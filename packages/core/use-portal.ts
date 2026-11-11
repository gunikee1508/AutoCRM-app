import { useEffect, useState } from 'react';
import { loadOrders, portalClient } from './client';
import type { Area } from './domain';

export function usePortal(area: Area, url?: string, key?: string) {
  const [client] = useState(() => portalClient(url, key));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, refresh] = useState(0);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof loadOrders>> | null>(null);
  useEffect(() => {
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, session) => setSessionId(session?.user.id ?? null));
    return () => { data.subscription.unsubscribe(); void client.auth.stopAutoRefresh(); };
  }, [client]);
  useEffect(() => {
    if (!client || !sessionId) return;
    let active = true;
    setOrders(null);
    setMessage('');
    loadOrders(client, area).then(rows => { if (active) setOrders(rows); })
      .catch((error: Error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [client, sessionId, revision, area]);

  async function login(email: string, password: string) {
    if (!client || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage('Confira suas credenciais e a conexão.');
    } catch { setMessage('Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (!client) return;
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) { setMessage('Falha ao sair. Tente novamente.'); return; }
    setSessionId(null);
    setOrders(null);
    setMessage('');
  }
  return { configured: Boolean(client), sessionId, busy, message, orders, login, logout, reload: () => refresh(n => n + 1) };
}
