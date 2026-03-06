import type { Request, Response } from 'express';
import {
  getAllProductsService,
  getProductByIdService,
  incrementProductClickCountService,
} from '../services/productService.js';
import { supabase } from '../../data/supabaseClient.js';

const PRODUCT_VIEW_THROTTLE_MS = 30_000;
const globalProductViewThrottle = new Map<string, number>();

function shouldIncrementProductView(req: Request, productId: string): boolean {
  const now = Date.now();
  const ipKey = `${req.ip}:${productId}`;
  const lastIpTs = globalProductViewThrottle.get(ipKey) ?? 0;
  if (now - lastIpTs < PRODUCT_VIEW_THROTTLE_MS) return false;

  const sessionMap = req.session.productViewThrottle ?? {};
  const lastSessionTs = Number(sessionMap[productId] ?? 0);
  if (now - lastSessionTs < PRODUCT_VIEW_THROTTLE_MS) return false;

  globalProductViewThrottle.set(ipKey, now);
  sessionMap[productId] = now;
  req.session.productViewThrottle = sessionMap;
  return true;
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  const pageRaw = Number(req.query.page ?? 1);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = 16;
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

  const allProducts = await getAllProductsService(categorySlug, audience || undefined, validSort);
  const totalItems = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const products = allProducts.slice(start, start + pageSize);

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
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
  });
}

export async function getProductDetail(req: Request, res: Response): Promise<void> {
  const productId = req.params.id;
  const product = await getProductByIdService(productId);
  if (!product) {
    res.status(404).render('404', { title: 'Not Found' });
    return;
  }
  if (shouldIncrementProductView(req, productId)) {
    try {
      await incrementProductClickCountService(productId);
      product.click_count = Number(product.click_count ?? 0) + 1;
    } catch {
      // Non-blocking: product page should still render even if click increment fails.
    }
  }
  // Fetch related products from same category
  const related = await getAllProductsService();
  res.render('client/productDetail', { title: product.name, product, related: related.slice(0, 4) });
}

