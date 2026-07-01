#!/usr/bin/env -S npx tsx
/**
 * Deploy CLI for hosting the Colyseus server on a Lambda MicroVM.
 *
 * Commands:
 *   deploy [name]     Build the MicroVM image from ../server and run an instance.
 *                     Writes ../client/public/config.json + ../.microvm-deploy.json.
 *   info              Show the current instance's state + endpoint.
 *   token             Mint a fresh ≤60-min auth token (debugging).
 *   terminate         Terminate the current instance (stops billing).
 *
 * Reads/writes ../.microvm-deploy.json as the source of truth for the running
 * instance ({ microvmId, endpoint, region }).
 *
 * Requires AWS credentials in the environment (a profile or env vars) with
 * permissions for lambda-microvms:*, s3:* on the artifact bucket, iam:* on the
 * build role, and sts:GetCallerIdentity.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  buildAndRunMicrovm, mintMicrovmToken, terminateMicrovm, getMicrovm, MICROVM_REGION,
} from './microvm.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');           // repo root
const SERVER_DIR = join(ROOT, 'server');
const CLIENT_PUBLIC = join(ROOT, 'client', 'public');
const CLIENT_DIST = join(ROOT, 'client', 'dist');
const STATE_FILE = join(ROOT, '.microvm-deploy.json');

interface DeployState { microvmId: string; endpoint: string; region: string; }

function readState(): DeployState | null {
  if (!existsSync(STATE_FILE)) return null;
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf-8')); } catch { return null; }
}

// The config the dev static server reads to mint fresh tokens at runtime. NO
// token is stored — only the instance coordinates.
function writeConfig(state: DeployState) {
  const body = JSON.stringify(state, null, 2);
  for (const dir of [CLIENT_PUBLIC, CLIENT_DIST]) {
    if (dir === CLIENT_PUBLIC || existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'config.json'), body);
    }
  }
  writeFileSync(STATE_FILE, body);
}

async function cmdDeploy(name: string) {
  console.log(`\n▶ Deploying Colyseus server → Lambda MicroVM (${MICROVM_REGION})\n`);
  const prev = readState();

  const result = await buildAndRunMicrovm(name, SERVER_DIR, (m) => console.log(`  · ${m}`));
  const state: DeployState = { microvmId: result.microvmId, endpoint: result.endpoint, region: result.region };
  writeConfig(state);

  // Terminate the previous instance (if any) to stop its billing.
  if (prev && prev.microvmId !== state.microvmId) {
    try {
      await terminateMicrovm(prev.microvmId);
      console.log(`  · Terminated previous instance ${prev.microvmId}`);
    } catch (e) {
      console.log(`  · Could not terminate previous instance: ${(e as Error).message}`);
    }
  }

  console.log(`\n✓ MicroVM running`);
  console.log(`    microvmId : ${state.microvmId}`);
  console.log(`    endpoint  : https://${state.endpoint}`);
  console.log(`    region    : ${state.region}`);
  console.log(`\n  Wrote client/public/config.json + .microvm-deploy.json.`);
  console.log(`  Start the dev static server (npm run static) and open it to play.\n`);
}

async function cmdInfo() {
  const state = readState();
  if (!state) return console.log('No deploy on record. Run `npm run deploy` first.');
  const live = await getMicrovm(state.microvmId);
  console.log(JSON.stringify({ ...state, liveState: live.state, liveEndpoint: live.endpoint }, null, 2));
}

async function cmdToken() {
  const state = readState();
  if (!state) return console.log('No deploy on record. Run `npm run deploy` first.');
  const token = await mintMicrovmToken(state.microvmId);
  console.log(token);
}

async function cmdTerminate() {
  const state = readState();
  if (!state) return console.log('No deploy on record — nothing to terminate.');
  await terminateMicrovm(state.microvmId);
  console.log(`✓ Terminated ${state.microvmId}. (Delete .microvm-deploy.json to forget it.)`);
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  switch (cmd) {
    case 'deploy': return cmdDeploy(arg || 'colyseus-game');
    case 'info': return cmdInfo();
    case 'token': return cmdToken();
    case 'terminate': return cmdTerminate();
    default:
      console.log('Usage: microvm-deploy <deploy|info|token|terminate> [name]');
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((e) => { console.error(`\n✗ ${e?.message || e}\n`); process.exit(1); });
