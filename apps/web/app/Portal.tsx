'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { portals, type Area } from '@autocrm/core/domain';
import { Workspace } from '@autocrm/core/workspace';
import { kit } from './portal-kit';

export default function Portal({ area }: { area: Area }) {
  const [invite, setInvite] = useState('');
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has('convite')) {
      setInvite(fragment.get('convite') || '');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);
  return (
    <main className="page portal">
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
        <Workspace
          area={area}
          kit={kit}
          initialCode={invite}
          url={process.env.NEXT_PUBLIC_SUPABASE_URL}
          publicKey={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
        />
      </div>
    </main>
  );
}
