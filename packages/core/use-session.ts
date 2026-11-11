import { useEffect, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

export function useSession(client: SupabaseClient | null, initialUser: string | null) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!client) return;
    let active = true;
    let epoch = 0;
    let expiry: ReturnType<typeof setTimeout>;
    function apply(session: Session | null) {
      clearTimeout(expiry);
      setFailed(false);
      setLoading(false);
      setUser(session?.user.id ?? null);
      if (!session) setRecovering(false);
      if (session?.expires_at) {
        expiry = setTimeout(
          () => {
            setLoading(true);
            void restore();
          },
          Math.max(0, session.expires_at * 1000 - Date.now())
        );
      }
    }
    async function restore() {
      const version = epoch;
      try {
        const { data, error } = await client!.auth.getSession();
        if (!active || version !== epoch) return;
        if (error || (data.session?.expires_at && data.session.expires_at * 1000 <= Date.now())) {
          throw Error('Falha ao restaurar sessão.');
        }
        apply(data.session);
      } catch {
        if (active && version === epoch) {
          setFailed(true);
          setLoading(false);
          setUser(null);
        }
      }
    }
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return;
      epoch++;
      apply(session);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setNotice('Sessão encerrada. Entre para continuar.');
      if (event === 'SIGNED_IN') setNotice('');
    });
    void restore();
    return () => {
      active = false;
      clearTimeout(expiry);
      data.subscription.unsubscribe();
    };
  }, [client, revision]);
  return {
    user,
    loading,
    failed,
    recovering,
    notice,
    setNotice,
    setRecovering,
    retry: () => {
      setLoading(true);
      setFailed(false);
      setRevision((v) => v + 1);
    },
  };
}
