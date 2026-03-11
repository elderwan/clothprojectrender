import type { Request, Response } from 'express';
import { getCart, addToCart, updateQty, removeItem, emptyCart } from '../services/cartService.js';

export async function showCart(req: Request, res: Response): Promise<void> {
  const error = typeof req.query.error === 'string' ? req.query.error : null;
  if (!req.authUser) {
    res.render('client/cart', { title: 'Shopping Bag', cart: null, error });
    return;
  }
  const cart = await getCart(req.authUser.id);
  res.render('client/cart', { title: 'Shopping Bag', cart, error });
}

export async function postAddToCart(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');
  try {
    const { product_id, quantity, size } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);
    await addToCart(req.authUser.id, product_id, qty, size);
    res.redirect('/cart');
  } catch (err: any) {
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}

export async function postUpdateQty(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');
  try {
    const ids = Array.isArray(req.body?.id) ? req.body.id : [req.body?.id];
    const quantities = Array.isArray(req.body?.quantity) ? req.body.quantity : [req.body?.quantity];

    if (!ids.length || !quantities.length || ids.length !== quantities.length) {
      throw new Error('Invalid cart update payload.');
    }

    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const qty = Number(quantities[index]);
      if (!id) throw new Error('Missing cart item id.');
      if (!Number.isFinite(qty)) throw new Error('Invalid quantity.');
      if (qty <= 0) {
        await removeItem(req.authUser.id, id);
      } else {
        await updateQty(req.authUser.id, id, qty);
      }
    }

    res.redirect('/cart');
  } catch (err: any) {
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}

export async function postRemoveItem(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');
  try {
    await removeItem(req.authUser.id, req.params.id);
    res.redirect('/cart');
  } catch (err: any) {
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}
