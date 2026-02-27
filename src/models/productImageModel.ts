import { supabase } from '../../data/supabaseClient.js';
import type { ProductImage } from '../types/product.js';

/** Fetch all images for a product, ordered by sort_order ascending */
export async function getImagesByProduct(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
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
    .insert(input)
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
  // Delete existing images first, then re-insert
  await supabase.from('product_images').delete().eq('product_id', productId);
  if (urls.length === 0) return;
  const rows = urls
    .filter(u => u.trim())
    .map((url, i) => ({
      product_id: productId,
      url:        url.trim(),
      sort_order: i,
      is_primary: i === 0,  // first URL is the cover image
    }));
  const { error } = await supabase.from('product_images').insert(rows);
  if (error) throw new Error(error.message);
}

/** Set a specific image as primary (unsets others for same product) */
export async function setPrimaryImage(imageId: string, productId: string): Promise<void> {
  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);
  if (error) throw new Error(error.message);
}

/** Delete a single image by id */
export async function deleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) throw new Error(error.message);
}
