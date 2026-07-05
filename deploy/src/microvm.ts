/**
 * Lambda MicroVM deploy backend for the Colyseus game server.
 *
 * Wraps `@aws-sdk/client-lambda-microvms` (the standard aws-cli has no microvm
 * commands yet) with the proven flow:
 *
 *   ensureBuildRole → zip server build-context → upload to S3
 *   → CreateMicrovmImage (server-side Docker build, wait CREATED)
 *   → RunMicrovm (ingress=ALL_INGRESS, idle auto-suspend, wait RUNNING)
 *   → returns { microvmId, endpoint, imageArn }
 *
 * Auth tokens are NOT minted here — they expire in ≤60 min, so baking one at
 * deploy time is a foot-gun. `mintMicrovmToken()` is called at *runtime* by the
 * dev static server's matchmake proxy + /_mm/token endpoint, so every
 * connection gets a fresh token. See scripts/dev-static-server.mjs.
 */
import {
  LambdaMicrovmsClient,
  CreateMicrovmImageCommand,
  GetMicrovmImageCommand,
  RunMicrovmCommand,
  GetMicrovmCommand,
  CreateMicrovmAuthTokenCommand,
  TerminateMicrovmCommand,
} from '@aws-sdk/client-lambda-microvms';
import {
  S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, BucketLocationConstraint,
} from '@aws-sdk/client-s3';
import {
  IAMClient, GetRoleCommand, CreateRoleCommand, PutRolePolicyCommand,
} from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { execFileSync } from 'child_process';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';

// MicroVM is only available in a handful of regions (us-east-1, us-east-2,
// us-west-2, eu-west-1, ap-northeast-1). us-west-2 is the default.
export const MICROVM_REGION = process.env.MICROVM_REGION || 'us-west-2';

// The MicroVM ingress port the game server listens on (see server/src/index.ts).
export const MICROVM_PORT = Number(process.env.MICROVM_PORT) || 8080;

const BUILD_ROLE_NAME = process.env.MICROVM_BUILD_ROLE || 'colyseus-microvm-build-role';
const ARTIFACT_BUCKET_PREFIX = process.env.MICROVM_ARTIFACT_BUCKET || 'colyseus-microvm-artifacts';

// Idle policy — the cost lever. Suspend after 30 min idle (snapshot retains
// memory/disk), terminate after 1 h suspended, auto-resume on inbound traffic.
const IDLE_POLICY = {
  maxIdleDurationSeconds: 1800,
  suspendedDurationSeconds: 3600,
  autoResumeEnabled: true,
};
const MAX_DURATION_SECONDS = 28800; // 8h hard cap (platform max)

let _mvm: LambdaMicrovmsClient | null = null;
let _s3: S3Client | null = null;
let _iam: IAMClient | null = null;
let _sts: STSClient | null = null;
function mvm() { return (_mvm ??= new LambdaMicrovmsClient({ region: MICROVM_REGION })); }
function s3() { return (_s3 ??= new S3Client({ region: MICROVM_REGION })); }
function iam() { return (_iam ??= new IAMClient({ region: MICROVM_REGION })); }
function sts() { return (_sts ??= new STSClient({ region: MICROVM_REGION })); }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface MicrovmDeployResult {
  microvmId: string;
  endpoint: string;
  imageArn: string;
  imageVersion: string;
  region: string;
}

let _accountId: string | null = null;
async function accountId(): Promise<string> {
  if (_accountId) return _accountId;
  const r = await sts().send(new GetCallerIdentityCommand({}));
  _accountId = r.Account!;
  return _accountId;
}

// A globally-unique-ish artifact bucket name (prefix + account id).
async function artifactBucket(): Promise<string> {
  return `${ARTIFACT_BUCKET_PREFIX}-${await accountId()}`;
}

// AWS-managed base image + network connectors.
function baseImageArn() { return `arn:aws:lambda:${MICROVM_REGION}:aws:microvm-image:al2023-1`; }
function allIngress() { return `arn:aws:lambda:${MICROVM_REGION}:aws:network-connector:aws-network-connector:ALL_INGRESS`; }
function internetEgress() { return `arn:aws:lambda:${MICROVM_REGION}:aws:network-connector:aws-network-connector:INTERNET_EGRESS`; }

/** Idempotently ensure the artifact bucket exists. */
async function ensureArtifactBucket(bucket: string): Promise<void> {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch { /* create below */ }
  await s3().send(new CreateBucketCommand({
    Bucket: bucket,
    // us-east-1 rejects an explicit LocationConstraint.
    ...(MICROVM_REGION === 'us-east-1'
      ? {}
      : { CreateBucketConfiguration: { LocationConstraint: MICROVM_REGION as BucketLocationConstraint } }),
  }));
}

/**
 * Idempotently ensure the image build role exists. Trust principal is
 * `lambda.amazonaws.com` (NOT `microvms.lambda.amazonaws.com` — that's
 * rejected). It only needs to read the build artifact from S3.
 */
async function ensureBuildRole(bucket: string): Promise<string> {
  try {
    const r = await iam().send(new GetRoleCommand({ RoleName: BUILD_ROLE_NAME }));
    return r.Role!.Arn!;
  } catch { /* create below */ }

  const trust = {
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }],
  };
  const created = await iam().send(new CreateRoleCommand({
    RoleName: BUILD_ROLE_NAME,
    AssumeRolePolicyDocument: JSON.stringify(trust),
    Description: 'Colyseus MicroVM image build role',
  }));
  await iam().send(new PutRolePolicyCommand({
    RoleName: BUILD_ROLE_NAME,
    PolicyName: 'artifact-read',
    PolicyDocument: JSON.stringify({
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${bucket}/*`] }],
    }),
  }));
  // IAM role propagation is eventually-consistent; give it a moment before use.
  await sleep(8000);
  return created.Role!.Arn!;
}

// The deploy name flows into a /tmp file path, an S3 key, and the MicroVM
// resource name. Constrain it to a safe slug so it can never traverse
// directories ('../') or smuggle path/URL/shell metacharacters, regardless of
// how a caller obtains it.
function assertSafeName(name: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/.test(name)) {
    throw new Error(
      `Invalid deploy name "${name}": use 1-63 chars of [a-zA-Z0-9_-], starting alphanumeric.`,
    );
  }
  return name;
}

/** Zip the server build-context (Dockerfile + package.json + src) and upload to S3. */
async function uploadServerArtifact(bucket: string, name: string, serverDir: string): Promise<string> {
  const key = `${name}/server-${Date.now()}.zip`;
  const zipPath = join('/tmp', `microvm-${name}.zip`);
  rmSync(zipPath, { force: true });
  // Use execFileSync (argv array, no shell) so `serverDir`/`name` can never be
  // interpreted as shell syntax. Exclude node_modules (the image build runs
  // npm install itself) + dist + .git.
  execFileSync(
    'zip',
    ['-rq', zipPath, '.', '-x', 'node_modules/*', '-x', 'dist/*', '-x', '.git/*'],
    { cwd: serverDir, stdio: 'pipe' },
  );
  const Body = readFileSync(zipPath);
  await s3().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body }));
  return `s3://${bucket}/${key}`;
}

async function waitImageCreated(imageArn: string, timeoutMs = 300000): Promise<string> {
  const start = Date.now();
  for (;;) {
    const r = await mvm().send(new GetMicrovmImageCommand({ imageIdentifier: imageArn }));
    if (r.state === 'CREATED') return r.latestActiveImageVersion || '1.0';
    if (r.state === 'CREATE_FAILED') throw new Error(`MicroVM image build failed: ${imageArn}`);
    if (Date.now() - start > timeoutMs) throw new Error(`MicroVM image build timed out: ${imageArn}`);
    await sleep(5000);
  }
}

async function waitMicrovmRunning(microvmId: string, timeoutMs = 120000): Promise<string> {
  const start = Date.now();
  for (;;) {
    const r = await mvm().send(new GetMicrovmCommand({ microvmIdentifier: microvmId }));
    if (r.state === 'RUNNING') return r.endpoint!;
    if (r.state === 'TERMINATED' || r.state === 'TERMINATING') {
      throw new Error(`MicroVM ${microvmId} entered ${r.state}: ${r.stateReason || ''}`);
    }
    if (Date.now() - start > timeoutMs) throw new Error(`MicroVM ${microvmId} did not reach RUNNING in time`);
    await sleep(4000);
  }
}

/**
 * Build a MicroVM image from the game server and run an instance.
 * Returns the instance id + its dedicated HTTPS endpoint.
 */
export async function buildAndRunMicrovm(
  name: string,
  serverDir: string,
  onStatus: (msg: string) => void = () => {},
): Promise<MicrovmDeployResult> {
  name = assertSafeName(name);
  const bucket = await artifactBucket();

  onStatus(`Preparing build environment (S3 bucket "${bucket}", IAM role)…`);
  await ensureArtifactBucket(bucket);
  const buildRoleArn = await ensureBuildRole(bucket);

  onStatus('Packaging server + uploading build context…');
  const codeUri = await uploadServerArtifact(bucket, name, serverDir);

  onStatus('Submitting MicroVM image build (server-side Docker build)…');
  const created = await mvm().send(new CreateMicrovmImageCommand({
    name: `colyseus-${name}`,
    baseImageArn: baseImageArn(),
    buildRoleArn,
    codeArtifact: { uri: codeUri },
    egressNetworkConnectors: [internetEgress()],
    environmentVariables: { PORT: String(MICROVM_PORT) },
  }));
  const imageArn = created.imageArn!;

  onStatus('Waiting for image build to finish (~1–2 min)…');
  const imageVersion = await waitImageCreated(imageArn);

  onStatus('Launching MicroVM instance…');
  const run = await mvm().send(new RunMicrovmCommand({
    imageIdentifier: imageArn,
    imageVersion,
    ingressNetworkConnectors: [allIngress()],
    egressNetworkConnectors: [internetEgress()],
    idlePolicy: IDLE_POLICY,
    maximumDurationInSeconds: MAX_DURATION_SECONDS,
  }));
  const microvmId = run.microvmId!;

  onStatus('Waiting for the MicroVM to become RUNNING…');
  const endpoint = await waitMicrovmRunning(microvmId);

  return { microvmId, endpoint, imageArn, imageVersion, region: MICROVM_REGION };
}

/**
 * Mint a short-lived (≤60 min) JWE auth token scoped to the game's MicroVM port.
 * Called per connection at runtime — never baked at deploy time.
 */
export async function mintMicrovmToken(microvmId: string, expirationMinutes = 60): Promise<string> {
  const r = await mvm().send(new CreateMicrovmAuthTokenCommand({
    microvmIdentifier: microvmId,
    expirationInMinutes: expirationMinutes,
    allowedPorts: [{ port: MICROVM_PORT }],
  }));
  const token = r.authToken?.['X-aws-proxy-auth'];
  if (!token) throw new Error(`No auth token returned for ${microvmId}`);
  return token;
}

/** Look up an instance's current state + endpoint. */
export async function getMicrovm(microvmId: string) {
  const r = await mvm().send(new GetMicrovmCommand({ microvmIdentifier: microvmId }));
  return { state: r.state, endpoint: r.endpoint, stateReason: r.stateReason };
}

/** Terminate a MicroVM instance (stops billing). */
export async function terminateMicrovm(microvmId: string): Promise<void> {
  await mvm().send(new TerminateMicrovmCommand({ microvmIdentifier: microvmId }));
}
