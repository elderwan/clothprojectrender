import {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, countProducts, searchProductsForAdmin
} from '../models/productModel.js';
import type { Product } from '../types/product.js';
import type { AdminProductSearchFilters } from '../models/productModel.js';

export async function adminGetAllProducts(): Promise<Product[]> {
  return getAllProducts(undefined, true);
}

export async function adminGetProductById(id: string): Promise<Product | null> {
  return getProductById(id, true);
}

export async function adminSearchProducts(filters: AdminProductSearchFilters): Promise<Product[]> {
  return searchProductsForAdmin(filters);
}

export { createProduct, updateProduct, deleteProduct, countProducts };
