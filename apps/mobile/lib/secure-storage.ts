interface Vault {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// SecureStore values can be limited to ~2 KiB on iOS. Only switch the active
// slot after every chunk is durable. All session operations share the SDK lock.
export function sessionStorage(vault: Vault) {
  async function count(slot: string) {
    const raw = await vault.get(slot);
    if (raw === null) return 0;
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < 1 || n > 1024) throw Error('Armazenamento de sessão inválido.');
    return n;
  }
  async function clear(slot: string) {
    const n = await count(slot);
    for (let i = 0; i < n; i++) await vault.remove(slot + '.' + i);
    await vault.remove(slot);
  }
  return {
    async getItem(key: string) {
      const active = await vault.get(key);
      if (active === null) return null;
      if (active !== 'a' && active !== 'b') throw Error('Armazenamento de sessão inválido.');
      const slot = key + '.' + active;
      const n = await count(slot);
      if (!n) throw Error('Sessão incompleta no dispositivo.');
      let encoded = '';
      for (let i = 0; i < n; i++) {
        const part = await vault.get(slot + '.' + i);
        if (part === null) throw Error('Sessão incompleta no dispositivo.');
        encoded += part;
      }
      return decodeURIComponent(encoded);
    },
    async setItem(key: string, value: string) {
      const active = await vault.get(key);
      const next = active === 'a' ? 'b' : 'a';
      const slot = key + '.' + next;
      const encoded = encodeURIComponent(value);
      const n = Math.max(1, Math.ceil(encoded.length / 1600));
      if (n > 1024) throw Error('Sessão excede o limite de armazenamento.');
      await clear(slot);
      await vault.set(slot, String(n));
      for (let i = 0; i < n; i++)
        await vault.set(slot + '.' + i, encoded.slice(i * 1600, (i + 1) * 1600));
      await vault.set(key, next);
      if (active === 'a' || active === 'b') await clear(key + '.' + active);
    },
    async removeItem(key: string) {
      await vault.remove(key);
      await clear(key + '.a');
      await clear(key + '.b');
    },
  };
}
