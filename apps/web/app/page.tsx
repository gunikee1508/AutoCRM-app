import Link from 'next/link';

export default function Home() {
  return <main className="page">
    <header className="sitebar">
      <div className="logo"><span className="logomark" aria-hidden>A✦</span><span>auto<span className="blue">crm</span></span></div>
      <a href="/demo/index.html">Explorar demonstração →</a>
    </header>
    <section className="hero">
      <span className="eyebrow">AUTOCRM CONNECT</span>
      <h1>O cuidado com o carro não termina na oficina.</h1>
      <p>Consulte as ordens de serviço da sua equipe ou acompanhe o atendimento do seu veículo.</p>
      <div className="buttons">
        <Link className="primary" href="/oficina">Entrar como oficina →</Link>
        <Link className="secondary" href="/motorista">Entrar como motorista</Link>
      </div>
    </section>
    <section className="features" aria-label="Áreas de acesso">
      <div><h2>Para a oficina</h2><p>Consulte os serviços recebidos, em diagnóstico e em manutenção na sua oficina.</p></div>
      <div><h2>Para o motorista</h2><p>Veja o status dos atendimentos vinculados à sua conta e saiba quando o veículo está pronto para retirada.</p></div>
      <div><h2>Conheça a demonstração</h2><p>Experimente as duas perspectivas com dados fictícios. Marque uma ordem como pronta e confira a atualização na visão do motorista.</p></div>
    </section>
  </main>;
}
