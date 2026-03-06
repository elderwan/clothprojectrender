import type { Request, Response } from 'express';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';
import { supabase } from '../../data/supabaseClient.js';

export async function getProducts(req: Request, res: Response): Promise<void> {
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

  let categoryQueryBuilder = supabase
    .from('categories')
    .select('*')
    .eq('del_flg', false)
    .order('name');
  if (audience) {
    categoryQueryBuilder = categoryQueryBuilder.eq('audience', audience) as typeof categoryQueryBuilder;
  }
  const { data: categories } = await categoryQueryBuilder;

  res.render('client/products', {
    title: 'Shop',
    products,
    categories: categories ?? [],
    category: categorySlug,
    audience: audience || undefined,
    sort: validSort,
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

