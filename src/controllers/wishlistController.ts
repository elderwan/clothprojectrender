import type { Request, Response } from 'express';
import { addWishlistItem, deleteWishlistItem, getWishlist } from '../services/wishlistService.js';

function getSafeReferer(req: Request): string {
  const referer = typeof req.get('referer') === 'string' ? req.get('referer')!.trim() : '';
  if (!referer) return '/wishlist';

  try {
    const refererUrl = new URL(referer);
    const currentOrigin = `${req.protocol}://${req.get('host')}`;
    if (refererUrl.origin !== currentOrigin) return '/wishlist';
    return `${refererUrl.pathname}${refererUrl.search}`;
  } catch {
    return '/wishlist';
  }
}

function withQuery(path: string, key: string, value: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

export async function showWishlist(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');

  const items = await getWishlist(req.authUser.id);
  res.render('client/wishlist', {
    title: 'Wishlist',
    items,
    success: typeof req.query.success === 'string' ? req.query.success : null,
    error: typeof req.query.error === 'string' ? req.query.error : null,
  });
}

export async function postAddWishlistItem(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');

  const productId = typeof req.body?.product_id === 'string' ? req.body.product_id.trim() : '';
  if (!productId) {
    res.redirect(withQuery(getSafeReferer(req), 'error', 'Product is required.'));
    return;
  }

  try {
    const result = await addWishlistItem(req.authUser.id, productId);
    const message = result === 'existing' ? 'This product is already in your wishlist.' : 'Added to wishlist.';
    res.redirect(withQuery(getSafeReferer(req), 'success', message));
  } catch (err: any) {
    res.redirect(withQuery(getSafeReferer(req), 'error', err?.message || 'Unable to update wishlist.'));
  }
}

export async function postRemoveWishlistItem(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');

  try {
    await deleteWishlistItem(req.authUser.id, req.params.id);
    res.redirect('/wishlist?success=' + encodeURIComponent('Item removed from wishlist.'));
  } catch (err: any) {
    res.redirect('/wishlist?error=' + encodeURIComponent(err?.message || 'Unable to remove item.'));
  }
}
