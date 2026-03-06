import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';

export async function getProductsApi(req: Request, res: Response): Promise<void> {
  try {
    const categoryQuery = String(req.query.category ?? '').trim().toLowerCase();
    const audienceQuery = String(req.query.audience ?? '').trim().toLowerCase();
    const sortQuery = String(req.query.sort ?? 'time_desc').trim().toLowerCase();
    const validSort = ['time_desc', 'time_asc', 'sales_desc', 'sales_asc'].includes(sortQuery)
      ? (sortQuery as 'time_desc' | 'time_asc' | 'sales_desc' | 'sales_asc')
      : 'time_desc';

    const categoryAsAudience = categoryQuery === 'men' || categoryQuery === 'women' || categoryQuery === 'kids';
    const audience = (audienceQuery === 'men' || audienceQuery === 'women' || audienceQuery === 'kids'
      ? audienceQuery
      : (categoryAsAudience ? categoryQuery : '')) as '' | 'men' | 'women' | 'kids';
    const categorySlug = categoryAsAudience ? undefined : (categoryQuery || undefined);

    const products = await getAllProductsService(categorySlug, audience || undefined, validSort);
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
