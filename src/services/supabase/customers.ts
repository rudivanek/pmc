import { supabase } from './client';

export interface Customer {
  id?: string;
  name: string;
  description?: string;
  user_id?: string;
  created_at?: string;
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('pmc_customers')
    .insert([customer])
    .select()
    .single();

  return { data, error };
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from('pmc_customers')
    .select('*')
    .order('name');

  return { data, error };
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const { data, error } = await supabase
    .from('pmc_customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteCustomer(id: string) {
  const { data, error } = await supabase
    .from('pmc_customers')
    .delete()
    .eq('id', id);

  return { data, error };
}