import type { Product } from '../types/product.js';

const mockProducts: Product[] = [
  { id: '1', name: 'T-Shirt', price: 19.99, image: '/client/placeholder.jpg' },
  { id: '2', name: 'Jeans', price: 49.99, image: '/client/placeholder.jpg' },
  { id: '3', name: 'Jacket', price: 89.99, image: '/client/placeholder.jpg' },
];

export async function getAllProducts(): Promise<Product[]> {
  return mockProducts;
}

export async function getProductById(id: string): Promise<Product | null> {
  return mockProducts.find((p) => p.id === id) ?? null;
}
