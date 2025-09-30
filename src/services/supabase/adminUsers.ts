import { supabase } from './client';

export interface AdminUserData {
  email: string;
  password: string;
  name: string;
  startDate: string | null;
  untilDate: string | null;
  tokensAllowed: number;
}

export interface AdminUserUpdateData {
  userId: string;
  password?: string;
  startDate: string | null;
  untilDate: string | null;
  tokensAllowed: number;
}

export async function adminCreateUser(userData: AdminUserData) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: userData
  });

  if (error) {
    console.error('Error calling admin-create-user edge function:', error);
    throw new Error(error.message || 'Failed to create user');
  }

  return data;
}

export async function adminUpdateUser(updateData: AdminUserUpdateData) {
  const { data, error } = await supabase.functions.invoke('admin-update-user', {
    body: updateData
  });

  if (error) {
    console.error('Error calling admin-update-user edge function:', error);
    throw new Error(error.message || 'Failed to update user');
  }

  return data;
}

export async function adminDeleteUser(userId: string) {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId }
  });

  if (error) {
    console.error('Error calling admin-delete-user edge function:', error);
    throw new Error(error.message || 'Failed to delete user');
  }

  return data;
}

export async function adminGetUsers() {
  try {
    const { data, error } = await supabase.functions.invoke('admin-get-users');

    if (error) {
      console.error('Error calling admin-get-users edge function:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }

    return { data: data?.users || [], error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { data: [], error: error };
  }
}

export async function adminGetBetaRegistrationsCount() {
  const { data, error } = await supabase.functions.invoke('admin-get-beta-registrations-count');

  if (error) {
    console.error('Error calling admin-get-beta-registrations-count edge function:', error);
    throw new Error(error.message || 'Failed to get beta registrations count');
  }

  return data;
}