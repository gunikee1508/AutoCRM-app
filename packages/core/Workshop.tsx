import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Kit } from './portal-kit';
import {
  normalizeFields,
  roles,
  validateFields,
  workshopSteps,
  type Field,
  type Role,
  type Snapshot,
} from './onboarding';
import { rpc, useTask } from './use-portal';

type FormProps = { kit: Kit; client: SupabaseClient };
type Values = Record<string, string>;
function Fields({
  kit: K,
  fields,
  values,
  change,
}: {
  kit: Kit;
  fields: Field[];
  values: Values;
  change: (v: Values) => void;
}) {
  return (
    <>
      {fields.map((f) => (
        <K.Input
          key={f.key}
          label={f.label + (f.optional ? ' (opcional)' : '')}
          type={f.key === 'email' ? 'email' : 'text'}
          value={values[f.key] || ''}
          hint={f.hint}
          change={(v) => change({ ...values, [f.key]: v })}
        />
      ))}
    </>
  );
}

export function Registration({ kit: K, client, done }: { done: (id: string) => void } & FormProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});
  const task = useTask();
  const current = workshopSteps[step];
  function next() {
    void task.run(async () => {
      const error = validateFields(current.fields, values);
      if (error) throw Error(error);
      if (step < workshopSteps.length - 1) setStep(step + 1);
      else done(await rpc<string>(client, 'register_workshop', { details: normalizeFields(values) }));
    });
  }
  return (
    <K.Form submit={next}>
      <K.Body>{'Cadastro da oficina · ' + (step + 1) + ' de 3'}</K.Body>
      <K.Heading>{current.title}</K.Heading>
      <Fields kit={K} fields={current.fields} values={values} change={setValues} />
      {step === 2 && <K.Body>Depois de cadastrar a oficina, adicione as imagens no painel.</K.Body>}
      <K.Button submit disabled={task.busy} press={next}>
        {task.busy ? 'Salvando…' : step === 2 ? 'Cadastrar oficina' : 'Continuar'}
      </K.Button>
      {step > 0 && (
        <K.Button
          secondary
          disabled={task.busy}
          press={() => {
            setStep(step - 1);
            task.setMessage('');
          }}
        >
          Voltar
        </K.Button>
      )}
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Form>
  );
}

const staffRoles = ['manager', 'receptionist', 'mechanic'] as const;
const customerFields = [
  { key: 'name', label: 'Nome do cliente' },
  { key: 'phone', label: 'Telefone', hint: '+55 11 99999-0000' },
  { key: 'email', label: 'E-mail do cliente' },
];
type AdminProps = FormProps & { shop: string; data: Snapshot; refresh: () => void };

export function Customers({ kit: K, client, shop, data, refresh }: AdminProps) {
  const [values, setValues] = useState<Values>({});
  const [issued, setIssued] = useState<{ code: string; email: string } | null>(null);
  const task = useTask();
  return (
    <K.Card>
      <K.Heading>Clientes da oficina</K.Heading>
      <Fields kit={K} fields={customerFields} values={values} change={setValues} />
      <K.Button
        disabled={task.busy}
        press={() =>
          void task.run(async () => {
            const error = validateFields(customerFields, values);
            if (error) throw Error(error);
            await rpc(client, 'create_customer', { shop, details: normalizeFields(values) });
            setValues({});
            refresh();
          })
        }
      >
        {task.busy ? 'Aguarde…' : 'Cadastrar cliente'}
      </K.Button>
      {data.contacts.map((c) => (
        <K.Card key={c.id}>
          <K.Heading>{c.name}</K.Heading>
          <K.Body>{c.email}</K.Body>
          {c.linked ? (
            <K.Body>Conta vinculada</K.Body>
          ) : (
            <K.Button
              secondary
              disabled={task.busy}
              press={() =>
                void task.run(async () => {
                  setIssued(null);
                  const code = await rpc<string>(client, 'issue_invite', { shop, contact: c.id });
                  setIssued({ code, email: c.email });
                  refresh();
                })
              }
            >
              Gerar convite de motorista
            </K.Button>
          )}
        </K.Card>
      ))}
      <Pending
        kit={K}
        client={client}
        shop={shop}
        data={data}
        refresh={refresh}
        staff={false}
        clear={() => setIssued(null)}
      />
      {issued && (
        <K.Card>
          <K.Heading>Convite para {issued.email}</K.Heading>
          <K.Share area="motorista" code={issued.code} />
        </K.Card>
      )}
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Card>
  );
}

export function Team({ kit: K, client, shop, data, refresh }: AdminProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('mechanic');
  const [code, setCode] = useState('');
  const [editing, setEditing] = useState('');
  const task = useTask();
  function update(member_id: string, new_role: Role | null) {
    void task.run(async () => {
      await rpc(client, 'set_staff_role', { shop, member_id, new_role });
      refresh();
    });
  }
  return (
    <K.Card>
      <K.Heading>Equipe e permissões</K.Heading>
      <K.Body>
        Gerência e recepção podem cadastrar e convidar clientes. Gerentes também podem alterar as imagens
        da oficina. Mecânicos consultam veículos e serviços. O proprietário administra a equipe.
      </K.Body>
      <K.Input
        type="email"
        label="E-mail do funcionário"
        value={email}
        change={(v) => {
          setEmail(v);
          setCode('');
        }}
      />
      <K.Body>Permissão do convite</K.Body>
      {staffRoles.map((r) => (
        <K.Button
          key={r}
          secondary={r !== role}
          press={() => {
            setRole(r);
            setCode('');
          }}
        >
          {roles[r]}
        </K.Button>
      ))}
      <K.Button
        disabled={task.busy}
        press={() =>
          void task.run(async () => {
            setCode('');
            setCode(
              await rpc<string>(client, 'issue_invite', {
                shop,
                staff_email: email.trim(),
                staff_role: role,
              })
            );
            refresh();
          })
        }
      >
        {task.busy ? 'Aguarde…' : 'Gerar convite de equipe'}
      </K.Button>
      <Pending
        kit={K}
        client={client}
        shop={shop}
        data={data}
        refresh={refresh}
        staff
        clear={() => setCode('')}
      />
      {code && <K.Share code={code} area="oficina" />}
      {data.members.map((m) => (
        <K.Card key={m.id}>
          <K.Body>
            {[m.name,m.email,roles[m.role]].filter(Boolean).join(' · ')}
          </K.Body>
          {m.role !== 'owner' && (
            <K.Button secondary press={() => setEditing(editing === m.id ? '' : m.id)}>
              Gerenciar acesso
            </K.Button>
          )}
          {editing === m.id && (
            <>
              <K.Body>Selecione a nova permissão para aplicar a alteração.</K.Body>
              {staffRoles
                .filter((r) => r !== m.role)
                .map((r) => (
                  <K.Button key={r} secondary disabled={task.busy} press={() => update(m.id, r)}>
                    {'Alterar para ' + roles[r]}
                  </K.Button>
                ))}
              <K.Button secondary disabled={task.busy} press={() => update(m.id, null)}>
                Revogar acesso à oficina
              </K.Button>
            </>
          )}
        </K.Card>
      ))}
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Card>
  );
}

export function Images({ kit: K, client, shop, refresh }: AdminProps) {
  const task = useTask();
  return (
    <K.Card>
      <K.Heading>Imagens da oficina</K.Heading>
      <K.Body>
        Escolha o logotipo e a foto da fachada. As imagens ficam visíveis para a equipe e os clientes
        vinculados.
      </K.Body>
      {(['logo', 'photo'] as const).map((kind) => (
        <K.Pick
          key={kind}
          label={kind === 'logo' ? 'Escolher logotipo' : 'Escolher foto da oficina'}
          disabled={task.busy}
          failed={task.setMessage}
          picked={(image_base64) =>
            void task.run(async () => {
              await rpc(client, 'save_workshop_image', { shop, kind, image_base64 });
              refresh();
            })
          }
        />
      ))}
      {task.busy && <K.Notice>Salvando imagem…</K.Notice>}
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Card>
  );
}
function Pending({
  kit: K,
  client,
  shop,
  data,
  refresh,
  staff,
  clear,
}: AdminProps & { staff: boolean; clear: () => void }) {
  const task = useTask();
  const list = data.invites.filter((i) => i.staff === staff);
  if (!list.length) return null;
  return (
    <K.Card>
      <K.Heading>Convites pendentes</K.Heading>
      {list.map((i) => (
        <K.Card key={i.id}>
          <K.Body>
            {i.email} · válido até {new Date(i.expires).toLocaleString('pt-BR')}
          </K.Body>
          <K.Button
            secondary
            disabled={task.busy}
            press={() =>
              void task.run(async () => {
                await rpc(client, 'revoke_portal_invite', { shop, invitation: i.id });
                clear();
                refresh();
              })
            }
          >
            Revogar convite
          </K.Button>
        </K.Card>
      ))}
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Card>
  );
}
