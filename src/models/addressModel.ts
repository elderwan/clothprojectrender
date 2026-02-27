import { supabase } from '../../data/supabaseClient.js';
import type { UserAddress, CreateAddressInput } from '../types/user.js';

/** Get all addresses for a user (default address first) */
export async function getAddressesByUser(userId: string): Promise<UserAddress[]> {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at',  { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as UserAddress[];
}

/** Get a single address (verifying it belongs to the user) */
export async function getAddressById(id: string, userId: string): Promise<UserAddress | null> {
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  return (data as UserAddress) ?? null;
}

/** Get the default address for a user */
export async function getDefaultAddress(userId: string): Promise<UserAddress | null> {
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .limit(1)
    .single();
  return (data as UserAddress) ?? null;
}

/** Create a new address. If is_default=true, unset all others first. */
export async function createAddress(input: CreateAddressInput): Promise<UserAddress> {
  if (input.is_default) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', input.user_id);
  }
  const { data, error } = await supabase
    .from('user_addresses')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as UserAddress;
}

/** Update an existing address */
export async function updateAddress(
  id: string,
  userId: string,
  input: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserAddress> {
  if (input.is_default) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
  }
  const { data, error } = await supabase
    .from('user_addresses')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as UserAddress;
}

/** Delete an address (only owner can delete) */
export async function deleteAddress(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
