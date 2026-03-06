import { getAllProducts, getProductById, getTopProductsByAudience, incrementProductClickCount } from '../models/productModel.js';
import type { Product } from '../types/product.js';

export async function getAllProductsService(
  categorySlug?: string,
  audience?: 'men' | 'women' | 'kids',
  sort: 'time_desc' | 'time_asc' | 'sales_desc' | 'sales_asc' = 'time_desc'
): Promise<Product[]> {
  return getAllProducts(categorySlug, false, audience, sort);
}

export async function getProductByIdService(id: string): Promise<Product | null> {
  return getProductById(id, false);
}

export async function incrementProductClickCountService(id: string): Promise<void> {
  await incrementProductClickCount(id);
}

export async function getTopProductsByAudienceService(
  audience: 'men' | 'women' | 'kids',
  limit = 4
): Promise<Product[]> {
  return getTopProductsByAudience(audience, limit);
}

