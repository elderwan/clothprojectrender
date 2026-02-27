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
  const { product_id, quantity, size } = req.body;
  await addToCart(req.session.user.id, product_id, Number(quantity) || 1, size);
  res.redirect('/cart');
}

export async function postUpdateQty(req: Request, res: Response): Promise<void> {
  const { id, quantity } = req.body;
  await updateQty(id, Number(quantity));
  res.redirect('/cart');
}

export async function postRemoveItem(req: Request, res: Response): Promise<void> {
  await removeItem(req.params.id);
  res.redirect('/cart');
}
