import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';
import { supabase } from '../../data/supabaseClient.js';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const products = await getAllProductsService(category);

  const { data: categories } = await supabase.from('categories').select('*').order('name');

  res.render('client/products', { title: 'Shop', products, categories: categories ?? [], category });
}

export async function getProductDetail(req: Request, res: Response): Promise<void> {
  const product = await getProductByIdService(req.params.id);
  if (!product) {
    res.status(404).render('404', { title: 'Not Found' });
    return;
  }
  // Fetch related products from same category
  const related = await getAllProductsService();
  res.render('client/productDetail', { title: product.name, product, related: related.slice(0, 4) });
}

