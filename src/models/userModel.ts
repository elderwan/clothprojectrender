import { supabase } from '../../data/supabaseClient.js';
import type { User, PublicUser, RegisterInput } from '../types/user.js';

function toPublic(u: User): PublicUser {
  const { password_hash: _, ...pub } = u;
  return pub;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  if (error) return null;
  return data as User;
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as PublicUser;
}

export async function createUser(
  input: RegisterInput & { password_hash: string }
): Promise<PublicUser> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: input.email.toLowerCase(),
      password_hash: input.password_hash,
      full_name: input.full_name,
      phone: input.phone ?? null,
      role: 'client',
    })
    .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
    .single();
  if (error) throw new Error(error.message);
  return data as PublicUser;
}

export async function updateUser(
  id: string,
  input: Partial<{ full_name: string; phone: string; password_hash: string }>
): Promise<PublicUser> {
  const { data, error } = await supabase
    .from('users')
    .update(input)
    .eq('id', id)
    .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
    .single();
  if (error) throw new Error(error.message);
  return data as PublicUser;
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicUser[];
}

export async function countUsers(): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client');
  if (error) throw new Error(error.message);
  return count ?? 0;
}
