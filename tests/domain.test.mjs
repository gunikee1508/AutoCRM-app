import test from 'node:test';
import assert from 'node:assert/strict';
import { stages, statusLabel } from '../packages/core/domain.ts';

test('Etapas em ordem e fallback para status desconhecido', () => {
  assert.deepEqual(Object.keys(stages), ['received','diagnosis','awaiting_approval','progress','ready','delivered']);
  assert.equal(statusLabel('ready'), 'Pronto para retirada');
  assert.equal(statusLabel('constructor'), 'Status indisponível');
});
