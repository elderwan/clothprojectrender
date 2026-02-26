import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const products = await getAllProductsService();
  res.render('client/products', { title: 'Products', products });
}

export async function getProductDetail(req: Request, res: Response): Promise<void> {
  const product = await getProductByIdService(req.params.id);
  if (!product) {
    res.status(404).send('Product not found');
    return;
  }
  res.render('client/productDetail', { title: product.name, product });
}
