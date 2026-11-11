'use client';

import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { url, key, cookieOptions } from '../lib/auth';
import { useEffect, useState } from 'react';
import { portals, type Area } from '@autocrm/core/domain';
import { Workspace } from '@autocrm/core/workspace';
import { kit } from './portal-kit';

export default function Portal({ area, initialUser }: { area: Area; initialUser: string | null }) {
  const [client] = useState(() =>
    url && key
      ? createBrowserClient(url, key, {
          cookieOptions: {
            ...cookieOptions,
            secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
          },
          auth: { detectSessionInUrl: false },
        })
      : null
  );
  const [wake, setWake] = useState(0);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) setWake((v) => v + 1);
    };
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  const [invite, setInvite] = useState('');
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has('convite')) {
      setInvite(fragment.get('convite') || '');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);
  return (
    <main className={`page portal ${area}`}>
      <header className="sitebar">
        <Link className="logo" href="/" aria-label="AutoCRM, início">
          auto<span className="blue">crm</span>
        </Link>
        <Link href="/">Voltar ao início</Link>
      </header>
      <section className="hero">
        <span className="eyebrow">{area === 'oficina' ? 'ÁREA PROFISSIONAL' : 'ÁREA DO MOTORISTA'}</span>
        <h1>{portals[area].title}</h1>
        <p>
          {area === 'oficina'
            ? 'Cadastre sua oficina, organize a equipe e acompanhe os atendimentos.'
            : 'Seus veículos, suas oficinas e seus próximos atendimentos.'}
        </p>
      </section>
      <div className="workspace">
        {offline && (
          <p className="work-notice" role="status">
            Sem conexão. Reconecte para atualizar os dados.
          </p>
        )}
        <Workspace
          wake={wake}
          area={area}
          kit={kit}
          initialCode={invite}
          client={client}
          initialUser={initialUser}
        />
      </div>
    </main>
  );
}
