import type { Request, Response } from 'express';
import {
  getFilteredProductsPaginatedService,
  getProductByIdService,
  incrementProductClickCountService,
  getAllProductsService,
} from '../services/productService.js';
import { supabase } from '../../data/supabaseClient.js';
import { getActiveCategoryBanners } from '../models/homeBannerModel.js';

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
  
  const legacyCategoryQuery = String(req.query.category ?? '').trim().toLowerCase();
  const categoryNameQuery = String(req.query.category_name ?? '').trim();
  const keywordQuery = String(req.query.q ?? '').trim();
  const audienceQuery = String(req.query.audience ?? '').trim().toLowerCase();
  const sortQuery = String(req.query.sort ?? 'time_desc').trim().toLowerCase();
  
  const validSort = ['time_desc', 'time_asc', 'sales_desc', 'sales_asc', 'price_asc', 'price_desc'].includes(sortQuery)
    ? (sortQuery as any)
    : 'time_desc';

  const categoryAsAudience = legacyCategoryQuery === 'men' || legacyCategoryQuery === 'women' || legacyCategoryQuery === 'kids';
  const audience = (audienceQuery === 'men' || audienceQuery === 'women' || audienceQuery === 'kids'
    ? audienceQuery
    : (categoryAsAudience ? legacyCategoryQuery : '')) as string;

  // Use the new paginated service which filters in DB
  const { items: products, total: totalItems } = await getFilteredProductsPaginatedService({
    audience: audience || undefined,
    categoryName: categoryNameQuery || undefined,
    q: keywordQuery || undefined,
    sort: validSort,
    page,
    pageSize
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Fetch categories for the sidebar/filter
  let categoryQueryBuilder = supabase
    .from('categories')
    .select('name')
    .eq('del_flg', false)
    .order('name');
  if (audience) {
    categoryQueryBuilder = categoryQueryBuilder.eq('audience', audience) as typeof categoryQueryBuilder;
  }
  const { data: categoryRows } = await categoryQueryBuilder;
  const categoryNames = Array.from(
    new Set((categoryRows ?? []).map((c: any) => String(c.name ?? '').trim()).filter(Boolean))
  );
  const categoryBanners = audience
    ? await getActiveCategoryBanners(audience as 'men' | 'women' | 'kids')
    : [];

  res.render('client/products', {
    title: 'Shop',
    products,
    categoryBanners,
    categoryNames,
    categoryName: categoryNameQuery || undefined,
    audience: audience || undefined,
    q: keywordQuery,
    sort: validSort,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
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
