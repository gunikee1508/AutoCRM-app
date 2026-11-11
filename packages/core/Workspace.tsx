import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSession } from './use-session';
import { NewPassword } from './Recovery';
import { statusLabel, type Area } from './domain';
import { inviteCode, roles } from './onboarding';
import { Account } from './Account';
import { Customers, Images, Registration, Team } from './Workshop';
import type { Kit } from './portal-kit';
import { rpc, useDashboard, useTask } from './use-portal';

type Props = { kit: Kit; area: Area; initialCode?: string; wake?: number };
type Tab = 'overview' | 'register' | 'invite' | 'team' | 'customers' | 'images';

function Dashboard({ kit: K, client, area, initialCode, wake }: { client: SupabaseClient } & Props) {
  const board = useDashboard(client, area, wake);
  const [tab, setTab] = useState<Tab>(initialCode ? 'invite' : 'overview');
  const [code, setCode] = useState(initialCode || '');
  const [success, setSuccess] = useState('');
  const task = useTask();
  const d = board.snapshot;
  const shop = d?.shops.find((s) => s.id === d.selected);
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setTab('invite');
    }
  }, [initialCode]);
  function go(next: Tab) {
    setSuccess('');
    task.setMessage('');
    setTab(next);
  }
  function done(id: string, text: string) {
    setSuccess(text);
    setTab('overview');
    board.refresh(id);
  }
  const admin =
    d && shop
      ? {
          kit: K,
          client,
          shop: shop.id,
          data: d,
          refresh: () => {
            setSuccess('Alteração salva.');
            board.refresh();
          },
        }
      : null;
  return (
    <>
      {success && <K.Notice>{success}</K.Notice>}
      {board.error && (
        <K.Card>
          <K.Notice>{board.error}</K.Notice>
          <K.Button press={() => board.refresh(null)}>Tentar novamente</K.Button>
        </K.Card>
      )}
      {!d && !board.error && <K.Notice>Carregando sua área…</K.Notice>}
      {d && (
        <>
          {d.shops.length > 1 && (
            <K.Card>
              <K.Heading>Suas oficinas</K.Heading>
              {d.shops.map((s) => (
                <K.Button
                  secondary={s.id !== shop?.id}
                  key={s.id}
                  press={() => {
                    go('overview');
                    board.select(s.id);
                  }}
                >
                  {s.name}
                </K.Button>
              ))}
            </K.Card>
          )}
          {tab === 'overview' && (
            <>
              <K.Card>
                <K.Heading>
                  {shop?.name ||
                    (area === 'motorista' ? 'Vincule sua primeira oficina' : 'Comece pela sua oficina')}
                </K.Heading>
                {shop ? (
                  <>
                    {shop.role && <K.Body>{roles[shop.role]}</K.Body>}
                    {d.images.logo && <K.Image src={d.images.logo} label={'Logotipo de ' + shop.name} />}
                    {d.images.photo && <K.Image src={d.images.photo} label={'Foto de ' + shop.name} />}
                    <K.Body>{shop.address}</K.Body>
                    {shop.legal_name && (
                      <K.Body>{[shop.legal_name, shop.cnpj].filter(Boolean).join(' · ')}</K.Body>
                    )}
                    {shop.hours && <K.Body>{shop.hours}</K.Body>}
                    {shop.phone && <K.Body>Telefone · {shop.phone}</K.Body>}
                    {shop.whatsapp_phone && <K.Body>WhatsApp · {shop.whatsapp_phone}</K.Body>}
                    {shop.email && <K.Body>{shop.email}</K.Body>}
                    {shop.latitude != null && (
                      <K.Body>
                        Localização · {shop.latitude}, {shop.longitude}
                      </K.Body>
                    )}
                  </>
                ) : (
                  <K.Body>
                    {area === 'motorista'
                      ? 'Aceite um convite da oficina com seu e-mail confirmado para ver seus veículos e atendimentos.'
                      : 'Proprietários podem cadastrar a oficina. Funcionários entram com o convite recebido.'}
                  </K.Body>
                )}
                {area === 'oficina' && !shop && (
                  <K.Button press={() => go('register')}>Cadastrar minha oficina</K.Button>
                )}
                <K.Button secondary={Boolean(shop)} press={() => go('invite')}>
                  Aceitar um convite
                </K.Button>
                {shop?.role && shop.role !== 'mechanic' && (
                  <K.Button secondary press={() => go('customers')}>
                    Clientes e convites
                  </K.Button>
                )}
                {shop?.role === 'owner' && (
                  <>
                    <K.Button secondary press={() => go('team')}>
                      Gerenciar equipe
                    </K.Button>
                  </>
                )}
                {(shop?.role === 'owner' || shop?.role === 'manager') && (
                  <K.Button secondary press={() => go('images')}>
                    Adicionar ou trocar imagens
                  </K.Button>
                )}
              </K.Card>
              {shop && (
                <>
                  <K.Card>
                    <K.Heading>
                      {area === 'motorista' ? 'Meus veículos' : 'Veículos da oficina'}
                    </K.Heading>
                    {d.vehicles.map((v) => (
                      <K.Body key={v.id}>{[v.name, v.plate].filter(Boolean).join(' · ')}</K.Body>
                    ))}
                    {!d.vehicles.length && <K.Body>Nenhum veículo vinculado nesta oficina.</K.Body>}
                  </K.Card>
                  <K.Card>
                    <K.Heading>Próximos atendimentos</K.Heading>
                    {d.appointments.map((a) => (
                      <K.Body key={a.id}>
                        {new Date(a.starts_at).toLocaleString('pt-BR')} · {a.description}
                      </K.Body>
                    ))}
                    {!d.appointments.length && <K.Body>Nenhum atendimento agendado.</K.Body>}
                  </K.Card>
                  <K.Card>
                    <K.Heading>Ordens de serviço</K.Heading>
                    {d.orders.map((o) => (
                      <K.Body key={o.id}>
                        {o.service_description} · {statusLabel(o.status)}
                      </K.Body>
                    ))}
                    {!d.orders.length && <K.Body>Nenhuma ordem de serviço nesta oficina.</K.Body>}
                  </K.Card>
                </>
              )}
            </>
          )}
          {tab === 'register' && area === 'oficina' && (
            <Registration
              kit={K}
              client={client}
              done={(id) =>
                done(id, 'Oficina cadastrada. Você já pode convidar a equipe e adicionar as imagens.')
              }
            />
          )}
          {tab === 'invite' && (
            <K.Card>
              <K.Heading>{area === 'oficina' ? 'Convite de equipe' : 'Vincular atendimento'}</K.Heading>
              <K.Body>
                Use o convite enviado para seu e-mail pela oficina. Ele vale por 48 horas e só pode ser
                usado uma vez.
              </K.Body>
              <K.Input label="Código ou link do convite" value={code} change={setCode} />
              <K.Button
                disabled={task.busy}
                press={() =>
                  void task.run(async () => {
                    const token = inviteCode(code);
                    if (!token) throw Error('Confira o código ou cole o link completo.');
                    const id = await rpc<string>(client, 'accept_invite', { code: token, area });
                    setCode('');
                    done(id, 'Convite aceito. Seu acesso está vinculado à oficina.');
                  })
                }
              >
                {task.busy ? 'Verificando…' : 'Confirmar vínculo'}
              </K.Button>
            </K.Card>
          )}
          {tab === 'customers' && admin && shop?.role && shop.role !== 'mechanic' && (
            <Customers {...admin} />
          )}
          {tab === 'team' && admin && shop?.role === 'owner' && <Team {...admin} />}
          {tab === 'images' && admin && (shop?.role === 'owner' || shop?.role === 'manager') && (
            <Images {...admin} />
          )}
          {tab !== 'overview' && (
            <K.Button secondary disabled={task.busy} press={() => go('overview')}>
              Voltar ao painel
            </K.Button>
          )}
          {tab === 'overview' && (
            <K.Button
              secondary
              press={() => {
                setSuccess('');
                board.refresh();
              }}
            >
              Atualizar painel
            </K.Button>
          )}
        </>
      )}
      {task.message && <K.Notice>{task.message}</K.Notice>}
      <K.Button
        secondary
        disabled={task.busy}
        press={() =>
          void task.run(async () => {
            const { error } = await client.auth.signOut({ scope: 'local' });
            if (error) throw Error('Falha ao sair. Tente novamente.');
          })
        }
      >
        Sair da conta
      </K.Button>
    </>
  );
}

export function Workspace({
  kit: K,
  area,
  client,
  initialUser = null,
  initialCode,
  wake,
}: Props & { client: SupabaseClient | null; initialUser?: string | null }) {
  const session = useSession(client, initialUser);
  if (!client)
    return (
      <K.Card>
        <K.Heading>Acesso em configuração</K.Heading>
        <K.Body>A demonstração com dados fictícios está disponível na tela inicial.</K.Body>
      </K.Card>
    );
  if (session.loading) return <K.Notice>Restaurando sua sessão…</K.Notice>;
  if (session.failed)
    return (
      <K.Card>
        <K.Heading>Não foi possível restaurar a sessão</K.Heading>
        <K.Body>Confira a conexão e se o dispositivo está desbloqueado.</K.Body>
        <K.Button press={session.retry}>Tentar novamente</K.Button>
      </K.Card>
    );
  if (session.recovering && session.user)
    return (
      <NewPassword
        client={client}
        kit={K}
        done={() => {
          session.setRecovering(false);
          session.setNotice('Senha alterada com sucesso.');
        }}
      />
    );
  return (
    <>
      {session.notice && <K.Notice>{session.notice}</K.Notice>}
      {session.user ? (
        <Dashboard
          key={area + session.user}
          client={client}
          kit={K}
          area={area}
          initialCode={initialCode}
          wake={wake}
        />
      ) : (
        <Account kit={K} client={client} driver={area === 'motorista'} />
      )}
    </>
  );
}
