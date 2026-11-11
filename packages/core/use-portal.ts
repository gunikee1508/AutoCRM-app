import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Area } from './domain';
import type { Snapshot } from './onboarding';

export function useTask() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await task();
    } catch (e) {
      const msg = typeof e === 'object' && e && 'message' in e ? String(e.message) : '';
      setMessage(
        /^[A-ZÁÉÍÓÚÇ][^\n]{1,140}[.!]$/.test(msg)
          ? msg
          : 'Não foi possível concluir. Confira os dados e tente novamente.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, message, setMessage, run };
}

export async function rpc<T>(client: SupabaseClient, name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data as T;
}

export function useDashboard(client: SupabaseClient, area: Area) {
  const [shop, setShop] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    rpc<Snapshot>(client, 'portal_snapshot', { area, selected: shop })
      .then((value) => {
        if (active) setSnapshot(value);
      })
      .catch(() => {
        if (active) {
          setSnapshot(null);
          setError('Não foi possível carregar esta área. Confira a conexão e a confirmação do e-mail.');
        }
      });
    return () => {
      active = false;
    };
  }, [client, area, shop, revision]);
  return {
    snapshot,
    error,
    select: (id: string) => {
      if (id !== shop) setSnapshot(null);
      setShop(id);
    },
    refresh: (id: string | null = shop) => {
      if (id !== shop) setSnapshot(null);
      setShop(id);
      setRevision((n) => n + 1);
    },
  };
}
