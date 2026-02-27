import { supabase } from '../../data/supabaseClient.js';
import type { CartItem } from '../types/cart.js';

export async function getCartByUser(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(name, price, image_url)')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    ...row,
    product_name:  row.products?.name,
    product_price: row.products?.price,
    product_image: row.products?.image_url,
    subtotal:      (row.products?.price ?? 0) * row.quantity,
  }));
}

export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number,
  size?: string
): Promise<CartItem> {
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, quantity, size: size ?? null },
      { onConflict: 'user_id,product_id,size' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function updateCartItemQty(id: string, quantity: number): Promise<CartItem> {
  if (quantity <= 0) {
    await removeCartItem(id);
    return { id, user_id: '', product_id: '', quantity: 0 };
  }
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function removeCartItem(id: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
