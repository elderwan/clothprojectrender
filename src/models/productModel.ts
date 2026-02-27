import { supabase } from '../../data/supabaseClient.js';
import type { Product } from '../types/product.js';
import { getImagesByProduct, getPrimaryImage } from './productImageModel.js';

/** Attach the primary_image URL to each product row */
async function attachPrimaryImages(rows: any[]): Promise<Product[]> {
  return Promise.all(
    rows.map(async (row) => {
      const primary_image = await getPrimaryImage(row.id);
      return {
        ...row,
        category:      row.categories?.name ?? null,
        primary_image: primary_image ?? undefined,
      } as Product;
    })
  );
}

export async function getAllProducts(categorySlug?: string): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) query = query.eq('category_id', (cat as any).id) as typeof query;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachPrimaryImages(data ?? []);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  const images = await getImagesByProduct(id);
  const primary = images.find(i => i.is_primary) ?? images[0];
  return {
    ...(data as any),
    category:      (data as any).categories?.name ?? null,
    images,
    primary_image: primary?.url ?? undefined,
  } as Product;
}

export async function createProduct(
  input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'primary_image'>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'primary_image'>>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function countProducts(): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

