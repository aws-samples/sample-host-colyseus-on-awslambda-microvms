import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { GameRoom } from './rooms/GameRoom.js';

// Standalone Colyseus server, designed to run inside a single Lambda MicroVM.
//
// It listens on 8080 (the MicroVM default ingress port), serves Colyseus
// (matchmaking HTTP + the WebSocket upgrade) over the same HTTP server, and
// answers the MicroVM lifecycle hooks so Lambda lets traffic through and can
// suspend / resume the instance cleanly.
const PORT = Number(process.env.PORT) || 8080;
const HOOK_PREFIX = '/aws/lambda-microvms/runtime/v1/';

// Room type name the client joins. Keep client and server in sync via this
// single value (defaults to "game"; the client uses the same default).
const ROOM_NAME = process.env.ROOM_NAME || 'game';

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || '/';

  // Simple health probe (handy for `curl` checks through the proxy).
  if (url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }

  // Lambda MicroVM lifecycle hooks (/run /ready /validate /resume /suspend
  // /terminate). This sample has no per-instance init/teardown work, so we
  // acknowledge every hook with 200. (A real game might, e.g., persist room
  // state on /suspend and reload it on /resume.)
  if (url.startsWith(HOOK_PREFIX)) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      console.log('[hook]', url, body.slice(0, 120));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
    });
    return;
  }

  // Colyseus' transport also attaches to this server for matchmaking + the WS
  // upgrade; any other plain-HTTP path gets a 404.
  res.writeHead(404);
  res.end('not found');
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define(ROOM_NAME, GameRoom).enableRealtimeListing();

httpServer.listen(PORT, () => {
  console.log(`[colyseus] listening on ${PORT}, room "${ROOM_NAME}"`);
});
