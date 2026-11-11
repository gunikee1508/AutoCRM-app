import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import next from 'next';

export default async function startWeb() {
  const app = next({ dev: false, dir: fileURLToPath(new URL('../../apps/web', import.meta.url)) });
  await app.prepare();
  const server = createServer(app.getRequestHandler());
  server.listen(4173, '127.0.0.1');
  await once(server, 'listening');
  return async () => {
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
    await app.close();
  };
}
