import { getAllProducts, getProductById, getTopProductsByAudience, incrementProductClickCount, getFilteredProductsPaginated, type PaginatedProductsResult } from '../models/productModel.js';
import type { Product } from '../types/product.js';

export async function getAllProductsService(
  categorySlug?: string,
  audience?: 'men' | 'women' | 'kids',
  sort: 'time_desc' | 'time_asc' | 'sales_desc' | 'sales_asc' | 'price_asc' | 'price_desc' = 'time_desc'
): Promise<Product[]> {
  return getAllProducts(categorySlug, false, audience, sort);
}

export async function getFilteredProductsPaginatedService(params: {
  audience?: string;
  categoryName?: string;
  q?: string;
  sort?: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedProductsResult> {
  return getFilteredProductsPaginated(params);
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
