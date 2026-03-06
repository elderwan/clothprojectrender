import {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, countProducts, searchProductsForAdmin, searchProductsForAdminPaginated
} from '../models/productModel.js';
import type { Product } from '../types/product.js';
import type { AdminProductSearchFilters, PaginatedProductsResult } from '../models/productModel.js';

export async function adminGetAllProducts(): Promise<Product[]> {
  return getAllProducts(undefined, true);
}

export async function adminGetProductById(id: string): Promise<Product | null> {
  return getProductById(id, true);
}

export async function adminSearchProducts(filters: AdminProductSearchFilters): Promise<Product[]> {
  return searchProductsForAdmin(filters);
}

export async function adminSearchProductsPaginated(
  filters: AdminProductSearchFilters,
  page: number,
  pageSize: number
): Promise<PaginatedProductsResult> {
  return searchProductsForAdminPaginated(filters, page, pageSize);
}

export { createProduct, updateProduct, deleteProduct, countProducts };
