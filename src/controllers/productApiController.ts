import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';

export async function getProductsApi(req: Request, res: Response): Promise<void> {
  try {
    const rawCategory = String(req.query.category ?? '').trim().toLowerCase();
    const isAudience = rawCategory === 'men' || rawCategory === 'women' || rawCategory === 'kids';
    const audience = isAudience ? (rawCategory as 'men' | 'women' | 'kids') : undefined;
    const category = isAudience ? undefined : (rawCategory || undefined);
    const products = await getAllProductsService(category, audience);
    res.status(200).json({ products });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function getProductDetailApi(req: Request, res: Response): Promise<void> {
  try {
    const product = await getProductByIdService(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    res.status(200).json({ product });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
