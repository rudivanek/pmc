import { supabase } from './client';
import { FormState } from '../../types';

export interface CopySession {
  id: string;
  user_id: string;
  customer_id?: string;
  customer?: any;
  input_data: FormState;
  improved_copy: string | any;
  alternative_copy?: string | any;
  created_at: string;
  output_type?: string;
  brief_description?: string;
}

export async function saveCopySession(
  formState: FormState,
  improvedCopy: any,
  alternativeCopy?: any,
  sessionId?: string
) {
  try {
    const sessionData = {
      user_id: formState.sessionId || 'anonymous',
      customer_id: formState.customerId || null,
      input_data: formState,
      improved_copy: improvedCopy,
      alternative_copy: alternativeCopy || null,
      output_type: formState.tab,
      brief_description: formState.briefDescription || null,
      output_content: {
        improvedCopy,
        ...(alternativeCopy && { alternativeCopy })
      }
    };

    if (sessionId) {
      // Update existing session
      const { data, error } = await supabase
        .from('pmc_copy_sessions')
        .update(sessionData)
        .eq('id', sessionId)
        .select()
        .single();

      return { data, error };
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('pmc_copy_sessions')
        .insert([sessionData])
        .select()
        .single();

      return { data, error };
    }
  } catch (error: any) {
    console.error('Error saving copy session:', error);
    return { data: null, error };
  }
}

export async function getCopySession(sessionId: string) {
  const { data, error } = await supabase
    .from('pmc_copy_sessions')
    .select(`
      *,
      customer:pmc_customers(*)
    `)
    .eq('id', sessionId)
    .single();

  return { data, error };
}

export async function getUserCopySessions(userId: string) {
  const { data, error } = await supabase
    .from('pmc_copy_sessions')
    .select(`
      *,
      customer:pmc_customers(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function deleteCopySession(sessionId: string) {
  const { data, error } = await supabase
    .from('pmc_copy_sessions')
    .delete()
    .eq('id', sessionId);

  return { data, error };
}