import type { Request, Response } from 'express';
import {
  adminGetAllProducts, adminGetProductById, createProduct, updateProduct, deleteProduct
} from '../services/adminProductService.js';
import { supabase } from '../../data/supabaseClient.js';

export async function listProducts(req: Request, res: Response): Promise<void> {
  const products = await adminGetAllProducts();
  const { data: categories } = await supabase.from('categories').select('*').order('name');
  res.render('admin/products', { title: 'Product Management', products, categories: categories ?? [] });
}

export async function showAddProduct(req: Request, res: Response): Promise<void> {
  const { data: categories } = await supabase.from('categories').select('*').order('name');
  res.render('admin/productAdd', { title: 'Add Product', categories: categories ?? [], error: null, product: null });
}

export async function handleAddProduct(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, price, category_id, stock_quantity, image_url } = req.body;
    await createProduct({
      name, description, price: Number(price),
      category_id: category_id || null,
      stock_quantity: Number(stock_quantity) || 0,
      image_url: image_url || null,
      is_active: true,
    });
    res.redirect('/admin/products');
  } catch (err: any) {
    const { data: categories } = await supabase.from('categories').select('*').order('name');
    res.render('admin/productAdd', { title: 'Add Product', categories: categories ?? [], error: err.message, product: null });
  }
}

export async function showEditProduct(req: Request, res: Response): Promise<void> {
  const product = await adminGetProductById(req.params.id);
  if (!product) return void res.redirect('/admin/products');
  const { data: categories } = await supabase.from('categories').select('*').order('name');
  res.render('admin/productAdd', { title: 'Edit Product', product, categories: categories ?? [], error: null });
}

export async function handleEditProduct(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, price, category_id, stock_quantity, image_url } = req.body;
    await updateProduct(req.params.id, {
      name, description, price: Number(price),
      category_id: category_id || null,
      stock_quantity: Number(stock_quantity) || 0,
      image_url: image_url || null,
    });
    res.redirect('/admin/products');
  } catch (err: any) {
    res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
  }
}

export async function handleDeleteProduct(req: Request, res: Response): Promise<void> {
  await deleteProduct(req.params.id);
  res.redirect('/admin/products');
}
