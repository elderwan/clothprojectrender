import type { Request, Response } from 'express';
import { getCart, addToCart, updateQty, removeItem } from '../services/cartService.js';

export async function getCartApi(req: Request, res: Response): Promise<void> {
  try {
    const cart = await getCart(req.session.user!.id);
    res.status(200).json({ cart });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function addCartItemApi(req: Request, res: Response): Promise<void> {
  try {
    const productId = String(req.body?.product_id ?? '');
    if (!productId) throw new Error('product_id is required.');
    const quantity = Math.max(1, Number(req.body?.quantity) || 1);
    const size = req.body?.size ? String(req.body.size) : undefined;
    const item = await addToCart(req.session.user!.id, productId, quantity, size);
    res.status(201).json({ message: 'item added', item });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateCartItemApi(req: Request, res: Response): Promise<void> {
  try {
    const quantity = Number(req.body?.quantity);
    if (!Number.isFinite(quantity)) throw new Error('Invalid quantity.');
    const item = await updateQty(req.session.user!.id, req.params.id, quantity);
    res.status(200).json({ message: 'item updated', item });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteCartItemApi(req: Request, res: Response): Promise<void> {
  try {
    await removeItem(req.session.user!.id, req.params.id);
    res.status(200).json({ message: 'item removed' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
