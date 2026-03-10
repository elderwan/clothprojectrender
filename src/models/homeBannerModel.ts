import { supabase } from '../../data/supabaseClient.js';
import type { BannerAudienceScope, BannerKind, HomeBanner, SaveHomeBannerInput } from '../types/banner.js';

function isDateInRange(now: Date, from?: string | null, to?: string | null): boolean {
  // Client requirement: banner must have both dates and be within range.
  if (!from || !to) return false;
  const nowMs = now.getTime();
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return false;
  return nowMs >= fromMs && nowMs <= toMs;
}

function mapBannerRow(row: any): HomeBanner {
  return {
    ...row,
    banner_kind: row.banner_kind ?? 'category',
    audience_scope: row.audience_scope ?? null,
    product_name: row.products?.name ?? undefined,
  } as HomeBanner;
}

async function attachLinkedProductMeta(rows: HomeBanner[]): Promise<HomeBanner[]> {
  const productIds = Array.from(new Set(rows.map((row) => row.product_id).filter(Boolean))) as string[];
  if (!productIds.length) return rows;

  const { data, error } = await supabase
    .from('products')
    .select('id, audience, categories(name, slug)')
    .in('id', productIds)
    .eq('del_flg', false);

  if (error || !data) return rows;

  const productMap = new Map(
    (data as any[]).map((product) => {
      const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;
      return [product.id, {
        audience: product.audience ?? null,
        categoryName: category?.name ?? undefined,
        categorySlug: category?.slug ?? undefined,
      }];
    })
  );

  return rows.map((row) => {
    const meta = row.product_id ? productMap.get(row.product_id) : null;
    return {
      ...row,
      product_audience: (meta?.audience ?? null) as BannerAudienceScope | null,
      product_category_name: meta?.categoryName,
      product_category_slug: meta?.categorySlug,
    };
  });
}

function isMissingBannerScopeColumns(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('banner_kind') || message.includes('audience_scope');
}

export async function getActiveHomeBanners(): Promise<HomeBanner[]> {
  const query = supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('del_flg', false)
    .eq('is_active', true)
    .eq('banner_kind', 'home')
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error && isMissingBannerScopeColumns(error)) {
    return [];
  }
  if (error) return [];
  const now = new Date();
  const rows = (data ?? [])
    .map(mapBannerRow)
    .filter((row: any) => isDateInRange(now, row.active_from, row.active_to)) as HomeBanner[];
  return attachLinkedProductMeta(rows);
}

export async function getActiveCategoryBanners(audience: BannerAudienceScope): Promise<HomeBanner[]> {
  const query = supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('del_flg', false)
    .eq('is_active', true)
    .eq('banner_kind', 'category')
    .eq('audience_scope', audience)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error && isMissingBannerScopeColumns(error)) {
    return [];
  }
  if (error) return [];
  const now = new Date();
  const rows = (data ?? [])
    .map(mapBannerRow)
    .filter((row: any) => isDateInRange(now, row.active_from, row.active_to)) as HomeBanner[];
  return attachLinkedProductMeta(rows);
}

export async function getAllHomeBannersForAdmin(kind: BannerKind): Promise<HomeBanner[]> {
  const baseQuery = supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  let data;
  let error;

  ({ data, error } = await baseQuery.eq('banner_kind', kind));

  if (error && isMissingBannerScopeColumns(error)) {
    ({ data, error } = await supabase
      .from('home_banners')
      .select('*, products(name)')
      .eq('del_flg', false)
      .order('created_at', { ascending: false }));
  }

  if (error) throw new Error(error.message);
  return attachLinkedProductMeta((data ?? []).map(mapBannerRow) as HomeBanner[]);
}

export async function getHomeBannerById(id: string): Promise<HomeBanner | null> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('id', id)
    .eq('del_flg', false)
    .maybeSingle();
  if (error || !data) return null;
  const [row] = await attachLinkedProductMeta([mapBannerRow(data)]);
  return row ?? null;
}

export async function createHomeBanner(input: SaveHomeBannerInput): Promise<HomeBanner> {
  const fullPayload = {
    title: input.title,
    description: input.description ?? null,
    image_url: input.image_url,
    product_id: input.product_id ?? null,
    banner_kind: input.banner_kind,
    audience_scope: input.audience_scope ?? null,
    is_active: input.is_active,
    active_from: input.active_from ?? null,
    active_to: input.active_to ?? null,
    del_flg: false,
  };

  let data;
  let error;

  ({ data, error } = await supabase
    .from('home_banners')
    .insert(fullPayload)
    .select()
    .single());

  if (error && isMissingBannerScopeColumns(error)) {
    ({ data, error } = await supabase
      .from('home_banners')
      .insert({
        title: input.title,
        description: input.description ?? null,
        image_url: input.image_url,
        product_id: input.product_id ?? null,
        is_active: input.is_active,
        active_from: input.active_from ?? null,
        active_to: input.active_to ?? null,
        del_flg: false,
      })
      .select()
      .single());
  }

  if (error) throw new Error(error.message);
  const [row] = await attachLinkedProductMeta([mapBannerRow(data)]);
  return row;
}

export async function updateHomeBanner(id: string, input: SaveHomeBannerInput): Promise<HomeBanner> {
  const fullPayload = {
    title: input.title,
    description: input.description ?? null,
    image_url: input.image_url,
    product_id: input.product_id ?? null,
    banner_kind: input.banner_kind,
    audience_scope: input.audience_scope ?? null,
    is_active: input.is_active,
    active_from: input.active_from ?? null,
    active_to: input.active_to ?? null,
  };

  let data;
  let error;

  ({ data, error } = await supabase
    .from('home_banners')
    .update(fullPayload)
    .eq('id', id)
    .eq('del_flg', false)
    .select()
    .single());

  if (error && isMissingBannerScopeColumns(error)) {
    ({ data, error } = await supabase
      .from('home_banners')
      .update({
        title: input.title,
        description: input.description ?? null,
        image_url: input.image_url,
        product_id: input.product_id ?? null,
        is_active: input.is_active,
        active_from: input.active_from ?? null,
        active_to: input.active_to ?? null,
      })
      .eq('id', id)
      .eq('del_flg', false)
      .select()
      .single());
  }

  if (error) throw new Error(error.message);
  const [row] = await attachLinkedProductMeta([mapBannerRow(data)]);
  return row;
}

export async function deleteHomeBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('home_banners')
    .update({ del_flg: true })
    .eq('id', id)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
}
