import type { Request, Response } from 'express';
import { supabase } from '../../data/supabaseClient.js';
import {
  getAllHomeBannersForAdmin,
  getHomeBannerById,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
} from '../models/homeBannerModel.js';

async function loadProducts() {
  const productsResult = await supabase
    .from('products')
    .select('id, name')
    .eq('del_flg', false)
    .order('name');
  if (productsResult.error) throw new Error(productsResult.error.message);
  return productsResult.data ?? [];
}

function parseBannerPayload(body: Record<string, unknown>) {
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const image_url = String(body.image_url ?? '').trim();
  const product_id = String(body.product_id ?? '').trim();
  const active_from = String(body.active_from ?? '').trim();
  const active_to = String(body.active_to ?? '').trim();
  const is_active = String(body.is_active ?? '') === 'on';

  if (!title) throw new Error('Banner title is required.');
  if (!image_url) throw new Error('Banner image is required.');
  if (active_from && active_to && new Date(active_from).getTime() > new Date(active_to).getTime()) {
    throw new Error('Active start date must be before end date.');
  }

  return {
    title,
    description: description || undefined,
    image_url,
    product_id: product_id || null,
    is_active,
    active_from: active_from || null,
    active_to: active_to || null,
  };
}

export async function listBanners(req: Request, res: Response): Promise<void> {
  const banners = await getAllHomeBannersForAdmin();
  res.render('admin/bannerSettings', {
    title: 'Homepage Banner Settings',
    banners,
    success: String(req.query.success ?? ''),
  });
}

export async function showAddBanner(req: Request, res: Response): Promise<void> {
  const products = await loadProducts();
  res.render('admin/bannerAdd', {
    title: 'Add Banner',
    banner: null,
    products,
    error: null,
  });
}

export async function handleAddBanner(req: Request, res: Response): Promise<void> {
  try {
    const payload = parseBannerPayload(req.body);
    await createHomeBanner(payload);
    res.redirect('/admin/settings/banner?success=' + encodeURIComponent('Banner added successfully.'));
  } catch (err: any) {
    const products = await loadProducts();
    res.render('admin/bannerAdd', {
      title: 'Add Banner',
      banner: null,
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
    title: 'Edit Banner',
    banner,
    products,
    error: null,
  });
}

export async function handleEditBanner(req: Request, res: Response): Promise<void> {
  try {
    const payload = parseBannerPayload(req.body);
    await updateHomeBanner(req.params.id, payload);
    res.redirect('/admin/settings/banner?success=' + encodeURIComponent('Banner updated successfully.'));
  } catch (err: any) {
    const [banner, products] = await Promise.all([
      getHomeBannerById(req.params.id),
      loadProducts(),
    ]);
    res.render('admin/bannerAdd', {
      title: 'Edit Banner',
      banner,
      products,
      error: err.message,
    });
  }
}

export async function handleDeleteBanner(req: Request, res: Response): Promise<void> {
  await deleteHomeBanner(req.params.id);
  res.redirect('/admin/settings/banner?success=' + encodeURIComponent('Banner deleted.'));
}
