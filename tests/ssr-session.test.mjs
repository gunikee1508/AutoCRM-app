import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { authMessage } from '../packages/core/auth-error.ts';

test('SDK SSR restaura, renova e remove os cookies com transporte de autenticação simulado', async () => {
  const jar = new Map();
  const cookies = {
    getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
    setAll: (changes) => {
      for (const { name, value } of changes) {
        if (value) jar.set(name, value);
        else jar.delete(name);
      }
    },
  };
  let rotation = 0;
  const user = {
    id: 'session-test',
    email: 'test@example.invalid',
    aud: 'authenticated',
    user_metadata: {},
  };
  const transport = async (url) => {
    if (String(url).includes('/token')) {
      rotation++;
      return Response.json({
        access_token: 'test-access-' + rotation,
        refresh_token: 'test-refresh-' + rotation,
        expires_in: 3600,
        token_type: 'bearer',
        user,
      });
    }
    if (String(url).endsWith('/user')) return Response.json(user);
    if (String(url).includes('/logout')) return new Response(null, { status: 204 });
    throw Error('Endpoint inesperado no teste.');
  };
  const args = [
    'https://fixture.example.invalid',
    'public-test-key',
    { cookies, global: { fetch: transport }, isSingleton: false },
  ];
  const browser = createBrowserClient(...args);
  const login = await browser.auth.signInWithPassword({ email: user.email, password: 'fixture' });
  assert.equal(login.error, null);
  assert.ok(jar.size);
  const server = createServerClient(...args);
  assert.equal((await server.auth.getUser()).data.user.id, user.id);
  assert.equal((await server.auth.refreshSession()).error, null);
  const reopened = createBrowserClient(...args);
  assert.equal((await reopened.auth.getSession()).data.session.refresh_token, 'test-refresh-2');
  assert.equal((await reopened.auth.signOut({ scope: 'local' })).error, null);
  assert.equal((await createBrowserClient(...args).auth.getSession()).data.session, null);
});
test('Mensagens de conexão, confirmação e limite de envio', () => {
  assert.match(authMessage({ status: 429 }, ''), /tentativas/);
  assert.match(authMessage({ name: 'AuthRetryableFetchError' }, ''), /Conexão/);
  assert.match(authMessage({ code: 'email_not_confirmed' }, ''), /Confirme/);
});
