/**
 * MicroVM connection bootstrap for the serverless build.
 *
 * A multiplayer game hosted on a Lambda MicroVM has two connection legs with
 * different constraints:
 *
 *  - **Matchmake (HTTP)**: every request to the MicroVM endpoint needs the JWE
 *    token in the X-aws-proxy-auth header. A browser fetch to the endpoint is a
 *    cross-origin request, so it triggers a CORS *preflight* OPTIONS — which the
 *    MicroVM proxy 403s (preflight can't carry the auth header). So matchmake is
 *    routed **same-origin** through the static server's proxy (`/{slug}/_mm/*`),
 *    which injects the auth header server-side. No CORS.
 *
 *  - **WebSocket**: WS has no CORS preflight, and the browser can't set headers,
 *    so the token + port ride as subprotocols. The WS connects **directly** to
 *    the MicroVM endpoint. We rewrite Colyseus' WS URL via `urlBuilder` and
 *    inject the subprotocols by patching `window.WebSocket`.
 */

const PORT = 8080;

interface MicrovmConfig { endpoint: string; token: string; }
let cfg: MicrovmConfig | null = null;

export function getMicrovmConfig(): MicrovmConfig | null { return cfg; }

// Patch window.WebSocket EAGERLY at module load — before colyseus.js evaluates,
// because colyseus.js captures `globalThis.WebSocket` at its own import time. If
// we patched lazily (after config loads) colyseus would already hold the native
// reference. The wrapper reads `cfg` at *connection* time, so the token only
// needs to be present before a socket is actually opened.
(function patchWebSocketEagerly() {
  if (typeof window === 'undefined' || (window as any).__mvmWsPatched) return;
  (window as any).__mvmWsPatched = true;
  const Native = window.WebSocket;
  const Patched = function (this: unknown, url: string | URL, protocols?: string | string[]) {
    const u = typeof url === 'string' ? url : url.toString();
    if (cfg && u.includes(cfg.endpoint)) {
      return new Native(u, [
        'lambda-microvms',
        `lambda-microvms.authentication.${cfg.token}`,
        `lambda-microvms.port.${PORT}`,
      ]);
    }
    return protocols !== undefined ? new Native(u, protocols) : new Native(u);
  } as unknown as typeof WebSocket;
  Patched.prototype = Native.prototype;
  (Patched as any).CONNECTING = Native.CONNECTING; (Patched as any).OPEN = Native.OPEN;
  (Patched as any).CLOSING = Native.CLOSING; (Patched as any).CLOSED = Native.CLOSED;
  window.WebSocket = Patched;
})();

/** Fetch a fresh {endpoint, token} from the same-origin token endpoint.
 * Tokens are short-lived (≤60 min) and minted server-side on each call — never
 * baked into config.json — so a long-lived/restarted MicroVM never 403s. */
export async function initMicrovm(): Promise<void> {
  const res = await fetch(`${import.meta.env.BASE_URL}_mm/token`, { cache: 'no-store' });
  cfg = await res.json();
}

/**
 * Base URL for the Colyseus Client: the **same-origin matchmake proxy**.
 * With the app served at the origin root this is e.g. https://your-host/_mm
 */
export function microvmHttpUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // '' when served at root
  return `${window.location.origin}${base}/_mm`;
}

/**
 * Colyseus urlBuilder: matchmake HTTP stays on the same-origin proxy; the WS
 * upgrade is redirected to the MicroVM endpoint root (the proxy only handles
 * matchmake, not the long-lived socket).
 */
export function microvmUrlBuilder(url: URL): string {
  if (!cfg) return url.toString();
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    // Colyseus builds e.g. wss://<origin>/<base>/_mm/<processId>/<roomId>?... —
    // strip the proxy prefix and send it straight to the MicroVM endpoint.
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    let path = url.pathname;
    const prefix = `${base}/_mm`;
    if (path.startsWith(prefix)) path = path.slice(prefix.length);
    return `wss://${cfg.endpoint}${path}${url.search}`;
  }
  return url.toString();
}
