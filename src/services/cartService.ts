import {
  getCartByUser, upsertCartItem, updateCartItemQty, removeCartItem, clearCart
} from '../models/cartModel.js';
import type { CartItem } from '../types/cart.js';

export async function getCart(userId: string): Promise<{
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}> {
  const items = await getCartByUser(userId);
  const subtotal = items.reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const shipping = subtotal > 200 ? 0 : 15;
  return { items, subtotal, shipping, total: subtotal + shipping };
}

export async function addToCart(
  userId: string, productId: string, quantity: number, size?: string
): Promise<CartItem> {
  return upsertCartItem(userId, productId, quantity, size);
}

export async function updateQty(id: string, quantity: number): Promise<CartItem> {
  return updateCartItemQty(id, quantity);
}

export async function removeItem(id: string): Promise<void> {
  return removeCartItem(id);
}

export async function emptyCart(userId: string): Promise<void> {
  return clearCart(userId);
}
