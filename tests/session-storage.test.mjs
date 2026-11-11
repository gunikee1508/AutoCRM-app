import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionStorage } from '../apps/mobile/lib/secure-storage.ts';

function fixture() {
  const items = new Map();
  const vault = {
    get: async (k) => items.get(k) ?? null,
    set: async (k, v) => {
      assert.ok(Buffer.byteLength(v) <= 1600);
      items.set(k, v);
    },
    remove: async (k) => {
      items.delete(k);
    },
  };
  return { items, vault };
}
test('Restauração em uma segunda instância, rotação e logout completo', async () => {
  const { vault, items } = fixture();
  const first = sessionStorage(vault);
  const large = '🚘 São Paulo '.repeat(600);
  await first.setItem('session', large);
  const restarted = sessionStorage(vault);
  assert.equal(await restarted.getItem('session'), large);
  await restarted.setItem('session', 'rotated');
  assert.equal(await first.getItem('session'), 'rotated');
  await first.removeItem('session');
  assert.equal(await restarted.getItem('session'), null);
  assert.equal(items.size, 0);
});
test('Uma gravação interrompida conserva a versão confirmada', async () => {
  const { vault, items } = fixture();
  await sessionStorage(vault).setItem('s', 'original');
  const faulty = sessionStorage({
    ...vault,
    set: async (k, v) => {
      if (k.endsWith('.1')) throw Error('armazenamento indisponível');
      await vault.set(k, v);
    },
  });
  await assert.rejects(faulty.setItem('s', 'x'.repeat(4200)));
  assert.equal(await faulty.getItem('s'), 'original');
  await faulty.removeItem('s');
  assert.equal(items.size, 0);
});
