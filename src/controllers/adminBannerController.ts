import type { Request, Response } from 'express';
import { supabase } from '../../data/supabaseClient.js';
import {
  getAllHomeBannersForAdmin,
  getHomeBannerById,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
} from '../models/homeBannerModel.js';
import type { BannerAudienceScope, BannerKind } from '../types/banner.js';

async function loadProducts() {
  const productsResult = await supabase
    .from('products')
    .select('id, name')
    .eq('del_flg', false)
    .order('name');
  if (productsResult.error) throw new Error(productsResult.error.message);
  return productsResult.data ?? [];
}

function parseBannerKind(value: unknown): BannerKind {
  return String(value ?? '').trim().toLowerCase() === 'home' ? 'home' : 'category';
}

function parseBannerAudienceScope(value: unknown): BannerAudienceScope | null {
  const scope = String(value ?? '').trim().toLowerCase();
  if (scope === 'men' || scope === 'women' || scope === 'kids') return scope;
  return null;
}

function parseBannerPayload(body: Record<string, unknown>) {
  const banner_kind = parseBannerKind(body.banner_kind);
  const audience_scope = parseBannerAudienceScope(body.audience_scope);
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const image_url = String(body.image_url ?? '').trim();
  const product_id = String(body.product_id ?? '').trim();
  const active_from = String(body.active_from ?? '').trim();
  const active_to = String(body.active_to ?? '').trim();
  const is_active = String(body.is_active ?? '') === 'on';

  if (!title) throw new Error('Banner title is required.');
  if (!image_url) throw new Error('Banner image is required.');
  if (banner_kind === 'category' && !audience_scope) {
    throw new Error('Category banner audience is required.');
  }
  if (active_from && active_to && new Date(active_from).getTime() > new Date(active_to).getTime()) {
    throw new Error('Active start date must be before end date.');
  }

  return {
    title,
    description: description || undefined,
    image_url,
    product_id: product_id || null,
    banner_kind,
    audience_scope: banner_kind === 'category' ? audience_scope : null,
    is_active,
    active_from: active_from || null,
    active_to: active_to || null,
  };
}

export async function listBanners(req: Request, res: Response): Promise<void> {
  const kind = parseBannerKind(req.query.kind);
  const banners = await getAllHomeBannersForAdmin(kind);
  res.render('admin/bannerSettings', {
    title: 'Banner Settings',
    banners,
    kind,
    success: String(req.query.success ?? ''),
  });
}

export async function showAddBanner(req: Request, res: Response): Promise<void> {
  const kind = parseBannerKind(req.query.kind);
  const products = await loadProducts();
  res.render('admin/bannerAdd', {
    title: kind === 'home' ? 'Add Home Banner' : 'Add Category Banner',
    banner: null,
    kind,
    products,
    error: null,
  });
}

export async function handleAddBanner(req: Request, res: Response): Promise<void> {
  try {
    const payload = parseBannerPayload(req.body);
    await createHomeBanner(payload);
    res.redirect('/admin/settings/banner?kind=' + payload.banner_kind + '&success=' + encodeURIComponent('Banner added successfully.'));
  } catch (err: any) {
    const kind = parseBannerKind(req.body.banner_kind);
    const products = await loadProducts();
    res.render('admin/bannerAdd', {
      title: kind === 'home' ? 'Add Home Banner' : 'Add Category Banner',
      banner: null,
      kind,
      products,
      error: err.message,
    });
  }
}

export async function showEditBanner(req: Request, res: Response): Promise<void> {
  const [banner, products] = await Promise.all([
    getHomeBannerById(req.params.id),
    loadProducts(),
  ]);
  if (!banner) return void res.redirect('/admin/settings/banner');
  res.render('admin/bannerAdd', {
    title: banner.banner_kind === 'home' ? 'Edit Home Banner' : 'Edit Category Banner',
    banner,
    kind: banner.banner_kind,
    products,
    error: null,
  });
}

export async function handleEditBanner(req: Request, res: Response): Promise<void> {
  try {
    const payload = parseBannerPayload(req.body);
    await updateHomeBanner(req.params.id, payload);
    res.redirect('/admin/settings/banner?kind=' + payload.banner_kind + '&success=' + encodeURIComponent('Banner updated successfully.'));
  } catch (err: any) {
    const [banner, products] = await Promise.all([
      getHomeBannerById(req.params.id),
      loadProducts(),
    ]);
    res.render('admin/bannerAdd', {
      title: banner?.banner_kind === 'home' ? 'Edit Home Banner' : 'Edit Category Banner',
      banner,
      kind: banner?.banner_kind ?? parseBannerKind(req.body.banner_kind),
      products,
      error: err.message,
    });
  }
}

export async function handleDeleteBanner(req: Request, res: Response): Promise<void> {
  const banner = await getHomeBannerById(req.params.id);
  await deleteHomeBanner(req.params.id);
  const kind = banner?.banner_kind ?? 'category';
  res.redirect('/admin/settings/banner?kind=' + kind + '&success=' + encodeURIComponent('Banner deleted.'));
}
