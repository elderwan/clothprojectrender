import { getAllProducts, getProductById } from '../models/productModel.js';
import type { Product } from '../types/product.js';

export async function getAllProductsService(categorySlug?: string): Promise<Product[]> {
  return getAllProducts(categorySlug);
}

export async function getProductByIdService(id: string): Promise<Product | null> {
  return getProductById(id);
}

