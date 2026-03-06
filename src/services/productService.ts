import { getAllProducts, getProductById } from '../models/productModel.js';
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

