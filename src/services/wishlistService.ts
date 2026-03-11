import { createWishlistItem, findWishlistItemByProduct, getWishlistByUser, removeWishlistItem } from '../models/wishlistModel.js';
import type { WishlistItem } from '../types/wishlist.js';

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  return getWishlistByUser(userId);
}

export async function addWishlistItem(userId: string, productId: string): Promise<'added' | 'existing'> {
  const existing = await findWishlistItemByProduct(userId, productId);
  if (existing) return 'existing';

  await createWishlistItem(userId, productId);
  return 'added';
}

export async function deleteWishlistItem(userId: string, wishlistItemId: string): Promise<void> {
  await removeWishlistItem(wishlistItemId, userId);
}
