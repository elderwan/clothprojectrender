import { getAllProducts, getProductById } from '../models/productModel.js';
import type { Product } from '../types/product.js';

export async function getAllProductsService(): Promise<Product[]> {
  return getAllProducts();
}

export async function getProductByIdService(id: string): Promise<Product | null> {
  return getProductById(id);
}
