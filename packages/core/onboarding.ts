export type Role = 'owner' | 'manager' | 'receptionist' | 'mechanic';
export const roles = {
  owner: 'Proprietário',
  manager: 'Gerente',
  receptionist: 'Recepção',
  mechanic: 'Mecânico',
};
export type Shop = {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  whatsapp_phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  legal_name: string | null;
  cnpj: string | null;
  role: Role | null;
};
export type Snapshot = {
  shops: Shop[];
  selected: string | null;
  invites: { id: string; email: string; staff: boolean; expires: string }[];
  members: { id: string; name:string; email: string; role: Role }[];
  contacts: { id: string; name: string; email: string; linked: boolean }[];
  vehicles: { id: string; name: string; plate: string | null }[];
  appointments: { id: string; description: string; starts_at: string }[];
  orders: { id: string; service_description: string; status: string }[];
  images: { logo?: string; photo?: string };
};
export type Field = { key: string; label: string; optional?: boolean; hint?: string };
export const workshopSteps: { title: string; fields: Field[] }[] = [
  {
    title: 'Identidade da oficina',
    fields: [
      { key: 'name', label: 'Razão social' },
      { key: 'trade_name', label: 'Nome fantasia' },
      { key: 'cnpj', label: 'CNPJ', optional: true },
    ],
  },
  {
    title: 'Endereço e localização',
    fields: [
      { key: 'postal_code', label: 'CEP' },
      { key: 'street', label: 'Rua ou avenida' },
      { key: 'street_number', label: 'Número' },
      { key: 'complement', label: 'Complemento', optional: true },
      { key: 'district', label: 'Bairro' },
      { key: 'city', label: 'Cidade' },
      { key: 'state_code', label: 'UF', hint: 'SP' },
      { key: 'latitude', label: 'Latitude', optional: true },
      { key: 'longitude', label: 'Longitude', optional: true },
    ],
  },
  {
    title: 'Contato e funcionamento',
    fields: [
      { key: 'phone', label: 'Telefone comercial', hint: '+55 11 3333-0000' },
      { key: 'whatsapp', label: 'WhatsApp comercial', hint: '+55 11 99999-0000' },
      { key: 'email', label: 'E-mail comercial' },
      { key: 'hours', label: 'Horários de funcionamento', hint: 'Segunda a sexta, das 8h às 18h' },
    ],
  },
];
export function normalizeFields(values: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(values)) {
    let value = raw.trim();
    if (['phone', 'whatsapp', 'postal_code', 'cnpj'].includes(key))
      value = value.replace(/[()\s./-]/g, '');
    if (key === 'state_code' || key === 'cnpj') value = value.toUpperCase();
    if (key === 'latitude' || key === 'longitude') value = value.replace(',', '.');
    result[key] = value;
  }
  return result;
}
export function validateFields(fields: Field[], values: Record<string, string>) {
  const data = normalizeFields(values);
  for (const f of fields) {
    const v = data[f.key] || '';
    if (!v && f.optional) continue;
    if (!v) return 'Preencha o campo ' + f.label + '.';
    if (v.length > 180) return f.label + ' deve ter até 180 caracteres.';
    if (f.key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Confira o e-mail.';
    if (['phone', 'whatsapp'].includes(f.key) && !/^\+[1-9]\d{7,14}$/.test(v))
      return f.label + ' deve incluir + e o código do país.';
    if (f.key === 'postal_code' && !/^\d{8}$/.test(v)) return 'Informe os oito dígitos do CEP.';
    if (f.key === 'state_code' && !/^[A-Z]{2}$/.test(v)) return 'Informe a sigla da UF.';
    if (f.key === 'cnpj' && !/^[A-Z0-9]{12}\d{2}$/.test(v)) return 'Confira os 14 caracteres do CNPJ.';
    if (
      ['latitude', 'longitude'].includes(f.key) &&
      (!Number.isFinite(Number(v)) || Math.abs(Number(v)) > (f.key === 'latitude' ? 90 : 180))
    )
      return 'Confira a coordenada ' + f.label + '.';
  }
  if (fields.some((f) => f.key === 'latitude') && Boolean(data.latitude) !== Boolean(data.longitude))
    return 'Informe as duas coordenadas ou deixe ambas em branco.';
  return '';
}
export function inviteCode(value: string) {
  const match = /^(?:.*[#?]convite=)?([0-9a-f]{64})$/i.exec(value.trim());
  return match?.[1].toLowerCase() ?? '';
}
