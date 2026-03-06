import { supabase } from '../../data/supabaseClient.js';
import type { HomeBanner, SaveHomeBannerInput } from '../types/banner.js';

function isDateInRange(now: Date, from?: string | null, to?: string | null): boolean {
  // Client requirement: banner must have both dates and be within range.
  if (!from || !to) return false;
  const nowMs = now.getTime();
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return false;
  return nowMs >= fromMs && nowMs <= toMs;
}

export async function getActiveHomeBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('del_flg', false)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return [];
  const now = new Date();
  return (data ?? [])
    .map((row: any) => ({
      ...row,
      product_name: row.products?.name ?? undefined,
    }))
    .filter((row: any) => isDateInRange(now, row.active_from, row.active_to)) as HomeBanner[];
}

export async function getAllHomeBannersForAdmin(): Promise<HomeBanner[]> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    ...row,
    product_name: row.products?.name ?? undefined,
  })) as HomeBanner[];
}

export async function getHomeBannerById(id: string): Promise<HomeBanner | null> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*, products(name)')
    .eq('id', id)
    .eq('del_flg', false)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...(data as any),
    product_name: (data as any).products?.name ?? undefined,
  } as HomeBanner;
}

export async function createHomeBanner(input: SaveHomeBannerInput): Promise<HomeBanner> {
  const { data, error } = await supabase
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
    .single();
  if (error) throw new Error(error.message);
  return data as HomeBanner;
}

export async function updateHomeBanner(id: string, input: SaveHomeBannerInput): Promise<HomeBanner> {
  const { data, error } = await supabase
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
    .single();
  if (error) throw new Error(error.message);
  return data as HomeBanner;
}

export async function deleteHomeBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('home_banners')
    .update({ del_flg: true })
    .eq('id', id)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
}
