import { supabase } from '../../data/supabaseClient.js';
import type { WishlistItem } from '../types/wishlist.js';
import { getPrimaryImage } from './productImageModel.js';

export async function getWishlistByUser(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, products(name, price, audience, stock_quantity, is_active, categories(name))')
    .eq('user_id', userId)
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return Promise.all((data ?? []).map(async (row: any) => {
    const productImage = await getPrimaryImage(row.product_id);
    return {
      ...row,
      product_name: row.products?.name,
      product_price: row.products?.price,
      product_category: row.products?.categories?.name,
      product_audience: row.products?.audience,
      product_stock_quantity: row.products?.stock_quantity,
      product_is_active: row.products?.is_active,
      product_image: productImage,
    } as WishlistItem;
  }));
}

export async function findWishlistItemByProduct(userId: string, productId: string): Promise<WishlistItem | null> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('del_flg', false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as WishlistItem | null) ?? null;
}

export async function createWishlistItem(userId: string, productId: string): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({ user_id: userId, product_id: productId, del_flg: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as WishlistItem;
}

export async function removeWishlistItem(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
