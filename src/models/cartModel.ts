import { supabase } from '../../data/supabaseClient.js';
import type { CartItem } from '../types/cart.js';
import { getPrimaryImage } from './productImageModel.js';

export async function getCartByUser(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(name, price, audience, categories(name))')
    .eq('user_id', userId)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);

  return Promise.all((data ?? []).map(async (row: any) => {
    const product_image = await getPrimaryImage(row.product_id);
    return {
      ...row,
      product_name:  row.products?.name,
      product_price: row.products?.price,
      product_category: row.products?.categories?.name,
      product_audience: row.products?.audience,
      product_image,
      subtotal:      (row.products?.price ?? 0) * row.quantity,
    };
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
      { user_id: userId, product_id: productId, quantity, size: size ?? null, del_flg: false },
      { onConflict: 'user_id,product_id,size,del_flg' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function updateCartItemQty(id: string, userId: string, quantity: number): Promise<CartItem> {
  if (quantity <= 0) {
    await removeCartItem(id, userId);
    return { id, user_id: '', product_id: '', quantity: 0, del_flg: true };
  }
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('del_flg', false)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function removeCartItem(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
