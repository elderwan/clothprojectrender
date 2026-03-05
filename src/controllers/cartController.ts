import type { Request, Response } from 'express';
import { getCart, addToCart, updateQty, removeItem, emptyCart } from '../services/cartService.js';

export async function showCart(req: Request, res: Response): Promise<void> {
  if (!req.session.user) {
    res.render('client/cart', { title: 'Shopping Bag', cart: null });
    return;
  }
  const cart = await getCart(req.session.user.id);
  res.render('client/cart', { title: 'Shopping Bag', cart });
}

export async function postAddToCart(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { product_id, quantity, size } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);
    await addToCart(req.session.user.id, product_id, qty, size);
    res.redirect('/cart');
  } catch (err: any) {
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}

export async function postUpdateQty(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { id, quantity } = req.body;
    const qty = Number(quantity);
    if (!id) throw new Error('Missing cart item id.');
    if (!Number.isFinite(qty)) throw new Error('Invalid quantity.');
    await updateQty(req.session.user.id, id, qty);
    res.redirect('/cart');
  } catch (err: any) {
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}

export async function postRemoveItem(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    await removeItem(req.session.user.id, req.params.id);
    res.redirect('/cart');
  } catch (err: any) {
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}
