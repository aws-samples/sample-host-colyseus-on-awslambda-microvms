// Must run polyfill before anything imports @colyseus/schema
(Symbol as any).metadata ??= Symbol.for('Symbol.metadata');

import('./index.js');
