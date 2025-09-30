import { supabase } from './client';

export async function createNewUser(userId: string, email: string, name: string) {
  const { data, error } = await supabase
    .from('pmc_users')
    .insert([
      {
        id: userId,
        email: email,
        name: name,
        tokens_allowed: 999999
      }
    ]);

  if (error) {
    console.error('Error creating user in pmc_users:', error);
    throw error;
  }

  return data;
}

export async function ensureUserExists(userId: string, email: string, name?: string) {
  try {
    // Check if user exists in pmc_users table
    const { data: existingUser, error: checkError } = await supabase
      .from('pmc_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (!existingUser) {
      // User doesn't exist, create them
      await createNewUser(userId, email, name || email.split('@')[0]);
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function checkUserExists(email: string) {
  try {
    const { data, error } = await supabase
      .from('pmc_users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      return null; // User doesn't exist
    }

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
}

export async function registerBetaUserViaEdgeFunction(name: string, email: string) {
  const { data, error } = await supabase.functions.invoke('register-beta-user', {
    body: { name, email }
  });

  if (error) {
    console.error('Error calling register-beta-user edge function:', error);
    throw new Error(error.message || 'Failed to register for beta');
  }

  return data;
}