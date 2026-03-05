import { supabase } from '../../data/supabaseClient.js';
import type { ProductImage } from '../types/product.js';

/** Fetch all images for a product, ordered by sort_order ascending */
export async function getImagesByProduct(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .eq('del_flg', false)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductImage[];
}

/** Fetch the primary image URL for a product (first by sort_order if none marked primary) */
export async function getPrimaryImage(productId: string): Promise<string | null> {
  const { data } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId)
    .eq('del_flg', false)
    .order('is_primary', { ascending: false })
    .order('sort_order',  { ascending: true })
    .limit(1)
    .single();
  return (data as any)?.url ?? null;
}

/** Add an image to a product */
export async function addProductImage(
  input: Omit<ProductImage, 'id' | 'created_at'>
): Promise<ProductImage> {
  const { data, error } = await supabase
    .from('product_images')
    .insert({ ...input, del_flg: false })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProductImage;
}

/** Bulk-insert images (used when saving a product with multiple URL inputs) */
export async function setProductImages(
  productId: string,
  urls: string[]
): Promise<void> {
  // Soft-delete existing images first, then re-insert
  await supabase
    .from('product_images')
    .update({ del_flg: true })
    .eq('product_id', productId)
    .eq('del_flg', false);
  if (urls.length === 0) return;
  const rows = urls
    .filter(u => u.trim())
    .map((url, i) => ({
      product_id: productId,
      url:        url.trim(),
      sort_order: i,
      is_primary: i === 0,  // first URL is the cover image
      del_flg:    false,
    }));
  const { error } = await supabase.from('product_images').insert(rows);
  if (error) throw new Error(error.message);
}

/** Set a specific image as primary (unsets others for same product) */
export async function setPrimaryImage(imageId: string, productId: string): Promise<void> {
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('del_flg', false);
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
}

/** Delete a single image by id */
export async function deleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .update({ del_flg: true })
    .eq('id', imageId)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
}
