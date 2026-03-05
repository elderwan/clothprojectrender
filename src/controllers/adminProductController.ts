import type { Request, Response } from 'express';
import {
  adminSearchProducts, adminGetProductById, createProduct, updateProduct, deleteProduct
} from '../services/adminProductService.js';
import { setProductImages } from '../models/productImageModel.js';
import { supabase } from '../../data/supabaseClient.js';
import { normalizeProductImageInputs } from '../services/cloudinaryService.js';

function validateProductPayload(body: Record<string, unknown>): { price: number; stock: number } {
  const name = String(body.name ?? '').trim();
  if (!name) throw new Error('Product name is required.');

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) throw new Error('Invalid product price.');

  const stock = Number(body.stock_quantity);
  if (!Number.isFinite(stock) || stock < 0) throw new Error('Invalid stock quantity.');

  return { price, stock };
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const activeRaw = String(req.query.active ?? 'all');
  const filters = {
    q: String(req.query.q ?? '').trim(),
    category_id: String(req.query.category_id ?? '').trim(),
    active: (activeRaw === 'true' || activeRaw === 'false' ? activeRaw : 'all') as 'all' | 'true' | 'false',
  };
  const products = await adminSearchProducts(filters);
  const { data: categories } = await supabase.from('categories').select('*').eq('del_flg', false).order('name');
  res.render('admin/products', { title: 'Product Management', products, categories: categories ?? [], filters });
}

export async function showAddProduct(req: Request, res: Response): Promise<void> {
  const { data: categories } = await supabase.from('categories').select('*').eq('del_flg', false).order('name');
  res.render('admin/productAdd', { title: 'Add Product', categories: categories ?? [], error: null, product: null });
}

export async function handleAddProduct(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, price, category_id, stock_quantity, is_active } = req.body;
    const parsed = validateProductPayload(req.body);
    // image_urls supports URL list and base64 data URI list (one per line).
    const imageUrls = await normalizeProductImageInputs(String(req.body.image_urls ?? ''));

    const product = await createProduct({
      name, description,
      price:          parsed.price,
      category_id:    category_id || null,
      stock_quantity: parsed.stock,
      is_active:      is_active === 'on',
    });

    if (imageUrls.length > 0) {
      await setProductImages(product.id, imageUrls);
    }

    res.redirect('/admin/products');
  } catch (err: any) {
    const { data: categories } = await supabase.from('categories').select('*').eq('del_flg', false).order('name');
    res.render('admin/productAdd', { title: 'Add Product', categories: categories ?? [], error: err.message, product: null });
  }
}

export async function showEditProduct(req: Request, res: Response): Promise<void> {
  const product = await adminGetProductById(req.params.id);
  if (!product) return void res.redirect('/admin/products');
  const { data: categories } = await supabase.from('categories').select('*').eq('del_flg', false).order('name');
  res.render('admin/productAdd', { title: 'Edit Product', product, categories: categories ?? [], error: null });
}

export async function handleEditProduct(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, price, category_id, stock_quantity, is_active } = req.body;
    const parsed = validateProductPayload(req.body);
    const imageUrls = await normalizeProductImageInputs(String(req.body.image_urls ?? ''));

    await updateProduct(req.params.id, {
      name, description,
      price:          parsed.price,
      category_id:    category_id || null,
      stock_quantity: parsed.stock,
      is_active:      is_active === 'on',
    });

    // Always overwrite images (empty textarea = remove all)
    await setProductImages(req.params.id, imageUrls);

    res.redirect('/admin/products');
  } catch (err: any) {
    res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
  }
}

export async function handleDeleteProduct(req: Request, res: Response): Promise<void> {
  await deleteProduct(req.params.id);
  res.redirect('/admin/products');
}

