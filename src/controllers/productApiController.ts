import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';

export async function getProductsApi(req: Request, res: Response): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const products = await getAllProductsService(category);
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
