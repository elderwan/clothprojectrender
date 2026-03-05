import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';
import { supabase } from '../../data/supabaseClient.js';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const rawCategory = String(req.query.category ?? '').trim().toLowerCase();
  const isAudience = rawCategory === 'men' || rawCategory === 'women' || rawCategory === 'kids';
  const audience = isAudience ? (rawCategory as 'men' | 'women' | 'kids') : undefined;
  const category = isAudience ? undefined : (rawCategory || undefined);
  const products = await getAllProductsService(category, audience);

  const { data: categories } = await supabase.from('categories').select('*').eq('del_flg', false).order('name');

  res.render('client/products', {
    title: 'Shop',
    products,
    categories: categories ?? [],
    category: rawCategory || undefined,
    audience,
  });
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

