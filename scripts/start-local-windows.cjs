const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
// A per-invocation, local named pipe. No TCP listener and no request logging.
const cli = process.argv[2] || 'supabase';
if (process.platform !== 'win32') throw Error('Use este inicializador no Windows.');
const context = execFileSync('docker', ['context', 'show'], { encoding: 'utf8' }).trim();
if (context !== 'desktop-linux') throw Error('Selecione o contexto Docker desktop-linux.');
const name = 'autocrm-cli-' + randomUUID();
const engine = '//./pipe/dockerDesktopLinuxEngine';
const pipe = '//./pipe/' + name;
const server = http.createServer(async (request, response) => {
  try {
    const headers = { ...request.headers };
    let body;
    if (request.method === 'POST' && /^\/(?:v[\d.]+\/)?containers\/create(?:\?|$)/.test(request.url)) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const spec = JSON.parse(Buffer.concat(chunks));
      for (const bindings of Object.values(spec.HostConfig?.PortBindings || {})) {
        for (const entry of bindings || []) entry.HostIp = '127.0.0.1';
      }
      body = Buffer.from(JSON.stringify(spec));
      delete headers['transfer-encoding'];
      headers['content-length'] = String(body.length);
    }
    const upstream = http.request(
      { socketPath: engine, path: request.url, method: request.method, headers },
      (incoming) => {
        response.writeHead(incoming.statusCode, incoming.headers);
        incoming.pipe(response);
      }
    );
    upstream.on('error', () => response.destroy());
    if (body) upstream.end(body);
    else request.pipe(upstream);
  } catch {
    response.writeHead(502);
    response.end();
  }
});
server.listen(pipe, () => {
  const env = { ...process.env, DOCKER_HOST: 'npipe:////./pipe/' + name };
  delete env.DOCKER_CONTEXT;
  const child = spawn(
    cli,
    [
      'start',
      '-x',
      'studio,edge-runtime,logflare,vector,imgproxy,storage-api,realtime,supavisor,postgres-meta',
    ],
    { env, stdio: ['ignore', 'ignore', 'inherit'] }
  );
  child.on('error', (error) => {
    console.error(error.message);
    server.close();
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    server.closeAllConnections();
    server.close();
    process.exitCode = code ?? 1;
  });
});
