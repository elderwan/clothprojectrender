import { supabase } from '../../data/supabaseClient.js';
import type { Product } from '../types/product.js';
import { getImagesByProduct, getPrimaryImagesBulk } from './productImageModel.js';

export interface AdminProductSearchFilters {
  q?: string;
  category_id?: string;
  active?: 'all' | 'true' | 'false';
  audience?: 'all' | 'men' | 'women' | 'kids';
}

export interface PaginatedProductsResult {
  items: Product[];
  total: number;
}

export async function incrementProductClickCount(productId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_product_click_count', { p_product_id: productId });
  if (error) throw new Error(error.message);
}

/** Attach primary image URLs to rows using a single bulk query */
async function attachPrimaryImagesBulk(rows: any[]): Promise<Product[]> {
  const ids = rows.map(r => r.id);
  const imageMap = await getPrimaryImagesBulk(ids);
  return rows.map(row => ({
    ...row,
    category: row.categories?.name ?? null,
    primary_image: imageMap.get(row.id),
  })) as Product[];
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
  return attachPrimaryImagesBulk(data ?? []);
}

export async function searchProductsForAdminPaginated(
  filters: AdminProductSearchFilters,
  page: number,
  pageSize: number
): Promise<PaginatedProductsResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 20;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' })
    .eq('del_flg', false)
    .order('created_at', { ascending: false })
    .range(from, to);

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

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const items = await attachPrimaryImagesBulk(data ?? []);
  return { items, total: count ?? 0 };
}

export async function getAllProducts(
  categorySlug?: string,
  includeInactive = false,
  audience?: 'men' | 'women' | 'kids',
  sort: 'time_desc' | 'time_asc' | 'sales_desc' | 'sales_asc' | 'price_asc' | 'price_desc' = 'time_desc'
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('del_flg', false);

  if (!includeInactive) query = query.eq('is_active', true) as typeof query;
  if (audience) query = query.eq('audience', audience) as typeof query;

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('del_flg', false)
      .maybeSingle();
    if (cat) query = query.eq('category_id', (cat as any).id) as typeof query;
  }

  // Sorting
  if (sort === 'time_desc') query = query.order('created_at', { ascending: false }) as typeof query;
  else if (sort === 'time_asc') query = query.order('created_at', { ascending: true }) as typeof query;
  else if (sort === 'price_asc') query = query.order('price', { ascending: true }) as typeof query;
  else if (sort === 'price_desc') query = query.order('price', { ascending: false }) as typeof query;
  else query = query.order('created_at', { ascending: false }) as typeof query;

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return attachPrimaryImagesBulk(data ?? []);
}

export async function getFilteredProductsPaginated(params: {
  audience?: string;
  categoryName?: string;
  q?: string;
  sort?: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedProductsResult> {
  let query = supabase
    .from('products')
    .select('*, categories!inner(name)', { count: 'exact' })
    .eq('del_flg', false)
    .eq('is_active', true);

  if (params.audience) {
    query = query.eq('audience', params.audience) as typeof query;
  }
  if (params.categoryName) {
    query = query.eq('categories.name', params.categoryName) as typeof query;
  }
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`) as typeof query;
  }

  // Sorting
  const sort = params.sort || 'time_desc';
  if (sort === 'time_asc') query = query.order('created_at', { ascending: true }) as typeof query;
  else if (sort === 'time_desc') query = query.order('created_at', { ascending: false }) as typeof query;
  else if (sort === 'price_asc') query = query.order('price', { ascending: true }) as typeof query;
  else if (sort === 'price_desc') query = query.order('price', { ascending: false }) as typeof query;
  else query = query.order('created_at', { ascending: false }) as typeof query;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const items = await attachPrimaryImagesBulk(data ?? []);
  return { items, total: count ?? 0 };
}

export async function getTopProductsByAudience(
  audience: 'men' | 'women' | 'kids',
  limit = 4
): Promise<Product[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 4;
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('del_flg', false)
    .eq('is_active', true)
    .eq('audience', audience)
    .order('click_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error(error.message);
  return attachPrimaryImagesBulk(data ?? []);
}

export async function getRelatedProducts(
  productId: string,
  audience: 'men' | 'women' | 'kids',
  price: number,
  categoryId?: string,
  limit = 4
): Promise<Product[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 4;

  const baseQuery = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('del_flg', false)
    .eq('is_active', true)
    .eq('audience', audience)
    .neq('id', productId);

  let primaryQuery = baseQuery;
  if (categoryId) {
    primaryQuery = primaryQuery.eq('category_id', categoryId) as typeof primaryQuery;
  }

  const { data: primaryData, error: primaryError } = await primaryQuery;
  if (primaryError) throw new Error(primaryError.message);

  const primaryItems = (await attachPrimaryImagesBulk(primaryData ?? []))
    .sort((a, b) => {
      const priceDiffA = Math.abs(Number(a.price ?? 0) - price);
      const priceDiffB = Math.abs(Number(b.price ?? 0) - price);
      if (priceDiffA !== priceDiffB) return priceDiffA - priceDiffB;
      const clickDiff = Number(b.click_count ?? 0) - Number(a.click_count ?? 0);
      if (clickDiff !== 0) return clickDiff;
      return new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime();
    });

  if (primaryItems.length >= safeLimit) {
    return primaryItems.slice(0, safeLimit);
  }

  const excludeIds = [productId, ...primaryItems.map((item) => item.id)];
  const fallbackLimit = safeLimit - primaryItems.length;
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('del_flg', false)
    .eq('is_active', true)
    .eq('audience', audience)
    .not('id', 'in', `(${excludeIds.map((id) => `"${id}"`).join(',')})`)
    .limit(Math.max(fallbackLimit * 3, fallbackLimit));

  if (fallbackError) throw new Error(fallbackError.message);
  const fallbackItems = (await attachPrimaryImagesBulk(fallbackData ?? []))
    .sort((a, b) => {
      const priceDiffA = Math.abs(Number(a.price ?? 0) - price);
      const priceDiffB = Math.abs(Number(b.price ?? 0) - price);
      if (priceDiffA !== priceDiffB) return priceDiffA - priceDiffB;
      const clickDiff = Number(b.click_count ?? 0) - Number(a.click_count ?? 0);
      if (clickDiff !== 0) return clickDiff;
      return new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime();
    });

  return [...primaryItems, ...fallbackItems].slice(0, safeLimit);
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
  input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'primary_image' | 'del_flg' | 'click_count'>
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
  input: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images' | 'primary_image' | 'del_flg' | 'click_count'>>
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
