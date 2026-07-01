// Dev/demo static server + same-origin MicroVM matchmake proxy.
//
// Serves the built client (client/dist) at the origin root and bridges the
// browser to the game's MicroVM:
//
//   GET  /_mm/token   → mints a fresh ≤60-min auth token, returns {endpoint, token}
//   *    /_mm/<path>  → proxies matchmake to https://<endpoint>/<path> with the
//                       X-aws-proxy-auth + X-aws-proxy-port headers injected
//
// Why a proxy at all? The MicroVM endpoint requires the JWE token in the
// X-aws-proxy-auth header, but a browser fetch straight to the endpoint is
// cross-origin and triggers a CORS *preflight* the endpoint 403s (preflight
// can't carry the auth header). So matchmake is proxied **same-origin** here.
// The WebSocket upgrade goes **direct** to the endpoint (no preflight; the
// token rides as a subprotocol — see client/src/network/microvm.ts).
//
// This is a reference implementation for local dev / demos. In production you'd
// run the same logic behind API Gateway or an ALB + CloudFront (never a raw
// Lambda Function URL).
//
// Usage: node scripts/dev-static-server.mjs [port]
import { createServer } from 'http';
import { request as httpsRequest } from 'https';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LambdaMicrovmsClient, CreateMicrovmAuthTokenCommand } from '@aws-sdk/client-lambda-microvms';

const PORT = Number(process.argv[2]) || 3000;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'client', 'dist');
const MICROVM_PORT = Number(process.env.MICROVM_PORT) || 8080;

// Per-region MicroVM SDK clients, lazily created.
const mvmClients = new Map();
function mvmClient(region) {
  if (!mvmClients.has(region)) mvmClients.set(region, new LambdaMicrovmsClient({ region }));
  return mvmClients.get(region);
}

// Fresh-token cache keyed by microvmId. Tokens expire in ≤60 min; we mint for
// 60 and refresh ~5 min early so a handed-out token always has runway.
const tokenCache = new Map(); // microvmId → { token, expiresAt }
const TOKEN_TTL_MIN = 60;
const TOKEN_REFRESH_EARLY_MS = 5 * 60 * 1000;

async function mintToken(microvmId, region) {
  const hit = tokenCache.get(microvmId);
  if (hit && hit.expiresAt - Date.now() > TOKEN_REFRESH_EARLY_MS) return hit.token;
  const r = await mvmClient(region).send(new CreateMicrovmAuthTokenCommand({
    microvmIdentifier: microvmId,
    expirationInMinutes: TOKEN_TTL_MIN,
    allowedPorts: [{ port: MICROVM_PORT }],
  }));
  const token = r.authToken?.['X-aws-proxy-auth'];
  if (!token) throw new Error('no auth token returned');
  tokenCache.set(microvmId, { token, expiresAt: Date.now() + TOKEN_TTL_MIN * 60 * 1000 });
  return token;
}

// Read the deploy config written by the deploy CLI: { endpoint, microvmId, region }.
async function readConfig() {
  try { return JSON.parse(await readFile(join(DIST, 'config.json'), 'utf-8')); }
  catch { return null; }
}

// Resolve a usable {endpoint, token} from config.json (mints a fresh token).
async function resolveMvm() {
  const cfg = await readConfig();
  if (!cfg?.endpoint) return null;
  if (cfg.microvmId) {
    const token = await mintToken(cfg.microvmId, cfg.region || 'us-west-2');
    return { endpoint: cfg.endpoint, token };
  }
  if (cfg.token) return { endpoint: cfg.endpoint, token: cfg.token }; // baked fallback
  return null;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);

  // Token endpoint: the client fetches a fresh {endpoint, token} at connect time.
  if (pathname === '/_mm/token') return serveToken(res);
  // Matchmake proxy: /_mm/<path> → https://<endpoint>/<path> with auth headers.
  if (pathname.startsWith('/_mm/')) return proxyMatchmake(pathname.slice('/_mm/'.length), req, res);

  if (!existsSync(DIST)) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    return res.end('client/dist not found — run `npm run build:client` first.');
  }

  // Static file serving with SPA fallback.
  let rest = pathname === '/' ? '/index.html' : pathname;
  const safe = normalize(rest).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(DIST, safe);
  try {
    let data;
    try {
      data = await readFile(filePath);
    } catch {
      if (!extname(safe)) { filePath = join(DIST, 'index.html'); data = await readFile(filePath); }
      else throw new Error('not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Serves a fresh {endpoint, token} to the client. No-store so the browser
// always gets a live token; the WebSocket connects direct using it.
async function serveToken(res) {
  try {
    const mvm = await resolveMvm();
    if (!mvm) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end('{"error":"no microvm config — run the deploy CLI first"}');
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ endpoint: mvm.endpoint, token: mvm.token }));
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
}

// Proxies a matchmake request to the MicroVM endpoint, injecting a freshly
// minted JWE auth + port header. Streams the body and mirrors the response.
async function proxyMatchmake(mmPath, req, res) {
  let mvm;
  try { mvm = await resolveMvm(); }
  catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
  if (!mvm) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    return res.end('{"error":"no microvm config"}');
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const search = new URL(req.url, 'http://x').search; // preserve query string
    const options = {
      method: req.method,
      headers: {
        'X-aws-proxy-auth': mvm.token,
        'X-aws-proxy-port': String(MICROVM_PORT),
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Content-Length': body.length,
      },
    };
    const up = httpsRequest(`https://${mvm.endpoint}/${mmPath}${search}`, options, (upRes) => {
      res.writeHead(upRes.statusCode || 502, { 'Content-Type': upRes.headers['content-type'] || 'application/json' });
      upRes.pipe(res);
    });
    up.on('error', (e) => { res.writeHead(502); res.end(JSON.stringify({ error: String(e) })); });
    if (body.length) up.write(body);
    up.end();
  });
}

server.listen(PORT, () => {
  console.log(`Dev static server on http://localhost:${PORT} (serving ${DIST})`);
  console.log(`Matchmake proxy: /_mm/*   Token endpoint: /_mm/token`);
});
