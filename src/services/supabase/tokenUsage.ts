import { supabase } from './client';

export async function getUserTokenUsage(userId: string) {
  const { data, error } = await supabase
    .from('pmc_user_tokens_usage')
    .select('*')
    .eq('user_email', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getTokenUsageSummary(userId: string) {
  const { data, error } = await supabase
    .from('pmc_user_tokens_usage')
    .select('token_usage, token_cost, model')
    .eq('user_email', userId);

  if (error) {
    return { data: null, error };
  }

  // Calculate summary statistics
  const summary = {
    totalTokens: data.reduce((sum, record) => sum + (record.token_usage || 0), 0),
    totalCost: data.reduce((sum, record) => sum + (parseFloat(record.token_cost) || 0), 0),
    byModel: {} as Record<string, { tokens: number; cost: number }>
  };

  // Group by model
  data.forEach(record => {
    if (!summary.byModel[record.model]) {
      summary.byModel[record.model] = { tokens: 0, cost: 0 };
    }
    summary.byModel[record.model].tokens += record.token_usage || 0;
    summary.byModel[record.model].cost += parseFloat(record.token_cost) || 0;
  });

  return { data: summary, error: null };
}

export async function getAdminTokenUsage() {
  try {
    const { data, error } = await supabase.functions.invoke('admin-get-token-usage');

    if (error) {
      console.error('Error calling admin-get-token-usage edge function:', error);
      throw new Error(error.message || 'Failed to fetch token usage');
    }

    return { data: data?.data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching admin token usage:', error);
    return { data: [], error: error };
  }
}