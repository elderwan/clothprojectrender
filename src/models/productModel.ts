import { supabase } from '../../data/supabaseClient.js';
import type { Product } from '../types/product.js';
import { getImagesByProduct, getPrimaryImage } from './productImageModel.js';

export interface AdminProductSearchFilters {
  q?: string;
  category_id?: string;
  active?: 'all' | 'true' | 'false';
}

/** Attach the primary_image URL to each product row */
async function attachPrimaryImages(rows: any[]): Promise<Product[]> {
  return Promise.all(
    rows.map(async (row) => {
      const primary_image = await getPrimaryImage(row.id);
      return {
        ...row,
        category: row.categories?.name ?? null,
        primary_image: primary_image ?? undefined,
      } as Product;
    })
  );
}

export async function searchProductsForAdmin(filters: AdminProductSearchFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  const q = (filters.q ?? '').trim();
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`) as typeof query;
  }

  const categoryId = (filters.category_id ?? '').trim();
  if (categoryId) {
    query = query.eq('category_id', categoryId) as typeof query;
  }

  if (filters.active === 'true') {
    query = query.eq('is_active', true) as typeof query;
  } else if (filters.active === 'false') {
    query = query.eq('is_active', false) as typeof query;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachPrimaryImages(data ?? []);
}

export async function getAllProducts(categorySlug?: string, includeInactive = false): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true) as typeof query;
  }

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('del_flg', false)
      .single();
    if (cat) query = query.eq('category_id', (cat as any).id) as typeof query;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachPrimaryImages(data ?? []);
}

export async function getProductById(id: string, includeInactive = false): Promise<Product | null> {
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .eq('del_flg', false);

  if (!includeInactive) {
    query = query.eq('is_active', true) as typeof query;
  }

  const { data, error } = await query.single();

  if (error || !data) return null;
  const images = await getImagesByProduct(id);
  const primary = images.find(i => i.is_primary) ?? images[0];
  return {
    ...(data as any),
    category: (data as any).categories?.name ?? null,
    images,
    primary_image: primary?.url ?? undefined,
  } as Product;
}

export async function createProduct(
  input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'primary_image' | 'del_flg'>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, del_flg: false })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'primary_image' | 'del_flg'>>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .eq('del_flg', false)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ del_flg: true })
    .eq('id', id)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
}

export async function countProducts(): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

