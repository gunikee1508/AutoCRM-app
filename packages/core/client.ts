import type { SupabaseClient } from '@supabase/supabase-js';
import type { Area } from './domain';

export async function loadOrders(client: SupabaseClient, area: Area) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error('Entre novamente para continuar.');
  const workshop = area === 'oficina';
  const links = workshop
    ? await client.from('workshop_members').select('workshop_id').eq('user_id', user.id)
    : await client.from('customer_contacts').select('id').eq('user_id', user.id);
  if (links.error) throw new Error('Não foi possível verificar seu vínculo.');
  const ids = (links.data ?? []).map((row) => ('workshop_id' in row ? row.workshop_id : row.id));
  if (!ids.length) throw new Error('Sua conta ainda não tem vínculo com esta área.');
  const orders = await client
    .from('service_orders')
    .select('id,service_description,status')
    .in(workshop ? 'workshop_id' : 'customer_contact_id', ids)
    .order('created_at', { ascending: false })
    .limit(50);
  if (orders.error) throw new Error('Não foi possível carregar os atendimentos.');
  return orders.data;
}
