import { supabase } from './client';

export interface Prefill {
  id: string;
  user_id?: string;
  label: string;
  category: string;
  is_public: boolean;
  data: any;
  created_at?: string;
  updated_at?: string;
}

export async function createPrefill(prefillData: Omit<Prefill, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('pmc_prefills')
    .insert([prefillData])
    .select()
    .single();

  return { data, error };
}

export async function getPrefills(userId?: string) {
  let query = supabase
    .from('pmc_prefills')
    .select('*');

  if (userId) {
    query = query.or(`user_id.eq.${userId},is_public.eq.true`);
  } else {
    query = query.eq('is_public', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  return { data, error };
}

export async function getPrefill(prefillId: string) {
  const { data, error } = await supabase
    .from('pmc_prefills')
    .select('*')
    .eq('id', prefillId)
    .single();

  return { data, error };
}

export async function updatePrefill(prefillData: Prefill) {
  const { data, error } = await supabase
    .from('pmc_prefills')
    .update(prefillData)
    .eq('id', prefillData.id)
    .select()
    .single();

  return { data, error };
}

export async function deletePrefill(prefillId: string) {
  const { data, error } = await supabase
    .from('pmc_prefills')
    .delete()
    .eq('id', prefillId);

  return { data, error };
}