'use client';

import Link from 'next/link';
import { useState } from 'react';
import { portals, statusLabel, type Area } from '@autocrm/core/domain';
import { usePortal } from '@autocrm/core/use-portal';

export default function Portal({ area }: { area: Area }) {
  const view = portals[area];
  const portal = usePortal(area, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <main className="page portal">
    <header className="sitebar"><Link className="logo" href="/">auto<span className="blue">crm</span></Link><Link href="/">Voltar ao início</Link></header>
    <section className="hero"><span className="eyebrow">ÁREA {area === 'oficina' ? 'DA OFICINA' : 'DO MOTORISTA'}</span><h1>{view.title}</h1><p>{view.description}</p></section>
    <section className="panel">
      {!portal.configured ? <><h2>Acesso em configuração</h2><p>Enquanto o portal está em preparação, explore um atendimento fictício.</p><Link href="/demo/index.html">Abrir demonstração →</Link></>
      : !portal.sessionId ? <form onSubmit={async e => { e.preventDefault(); await portal.login(email, password); setPassword(''); }}>
        <h2>Entre na sua conta</h2>
        <label>E-mail<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button disabled={portal.busy}>{portal.busy ? 'Entrando…' : 'Entrar'}</button>
      </form> : <><h2>Atendimentos recentes</h2>
        {portal.orders?.length ? <ul>{portal.orders.map(order => <li key={order.id}><strong>{order.service_description}</strong><span>{statusLabel(order.status)}</span></li>)}</ul> :
        <p>{portal.orders ? view.empty : !portal.message && 'Carregando atendimentos…'}</p>}
        <button onClick={portal.reload}>Atualizar</button> <button onClick={portal.logout}>Sair</button></>}
      <p role="status">{portal.message}</p>
    </section>
  </main>;
}
