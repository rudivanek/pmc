import { supabase } from './client';

export interface SavedOutput {
  id?: string;
  user_id: string;
  customer_id?: string | null;
  brief_description: string;
  language: string;
  tone: string;
  model: string;
  selected_persona?: string | null;
  input_snapshot: any;
  output_content: any;
  saved_at?: string;
  customer?: any;
}

export async function saveSavedOutput(outputData: Omit<SavedOutput, 'id'>) {
  const { data, error } = await supabase
    .from('pmc_saved_outputs')
    .insert([outputData])
    .select()
    .single();

  return { data, error };
}

export async function getSavedOutput(outputId: string) {
  const { data, error } = await supabase
    .from('pmc_saved_outputs')
    .select(`
      *,
      customer:pmc_customers(*)
    `)
    .eq('id', outputId)
    .single();

  return { data, error };
}

export async function getUserSavedOutputs(userId: string) {
  const { data, error } = await supabase
    .from('pmc_saved_outputs')
    .select(`
      *,
      customer:pmc_customers(*)
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  return { data, error };
}

export async function deleteSavedOutput(outputId: string) {
  const { data, error } = await supabase
    .from('pmc_saved_outputs')
    .delete()
    .eq('id', outputId);

  return { data, error };
}