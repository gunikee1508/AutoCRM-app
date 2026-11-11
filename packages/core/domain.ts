export const stages = {
  received: 'Recebido',
  diagnosis: 'Diagnóstico',
  awaiting_approval: 'Aguardando aprovação',
  progress: 'Em manutenção',
  ready: 'Pronto para retirada',
  delivered: 'Entregue',
} as const;

export type ServiceStatus = keyof typeof stages;
export type Area = 'oficina' | 'motorista';

export const portals = {
  oficina: { title: 'Painel da oficina', description: 'Consulte as ordens de serviço da sua equipe.', empty: 'Sua oficina ainda não tem ordens de serviço.' },
  motorista: { title: 'Meus atendimentos', description: 'Acompanhe os serviços dos veículos vinculados à sua conta.', empty: 'Nenhum atendimento nos seus veículos.' },
} as const;

export function statusLabel(value: string) {
  return Object.hasOwn(stages, value) ? stages[value as ServiceStatus] : 'Status indisponível';
}
