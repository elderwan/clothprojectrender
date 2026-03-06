import { supabase } from '../../data/supabaseClient.js';
import type { Product } from '../types/product.js';
import { getImagesByProduct, getPrimaryImage } from './productImageModel.js';

export interface AdminProductSearchFilters {
  q?: string;
  category_id?: string;
  active?: 'all' | 'true' | 'false';
  audience?: 'all' | 'men' | 'women' | 'kids';
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

  if (filters.audience && filters.audience !== 'all') {
    query = query.eq('audience', filters.audience) as typeof query;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachPrimaryImages(data ?? []);
}

export async function getAllProducts(
  categorySlug?: string,
  includeInactive = false,
  audience?: 'men' | 'women' | 'kids',
  sort: 'time_desc' | 'time_asc' | 'sales_desc' | 'sales_asc' = 'time_desc'
): Promise<Product[]> {
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
      .maybeSingle();
    if (!cat) return [];
    query = query.eq('category_id', (cat as any).id) as typeof query;
  }

  if (audience) {
    const { data: categoryRows } = await supabase
      .from('categories')
      .select('id')
      .eq('audience', audience)
      .eq('del_flg', false);
    const categoryIds = (categoryRows ?? []).map((c: any) => c.id);
    if (categoryIds.length === 0) return [];
    query = query.in('category_id', categoryIds) as typeof query;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const products = await attachPrimaryImages(data ?? []);

  if (sort === 'time_asc') {
    return [...products].sort((a, b) => {
      const at = new Date(a.created_at ?? 0).getTime();
      const bt = new Date(b.created_at ?? 0).getTime();
      return at - bt;
    });
  }

  if (sort === 'sales_desc' || sort === 'sales_asc') {
    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) return products;
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .in('product_id', productIds)
      .eq('del_flg', false);
    const salesMap = new Map<string, number>();
    for (const row of orderItems ?? []) {
      const pid = String((row as any).product_id);
      const qty = Number((row as any).quantity ?? 0);
      salesMap.set(pid, (salesMap.get(pid) ?? 0) + qty);
    }
    return [...products].sort((a, b) => {
      const as = salesMap.get(a.id) ?? 0;
      const bs = salesMap.get(b.id) ?? 0;
      return sort === 'sales_desc' ? bs - as : as - bs;
    });
  }

  return products;
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

