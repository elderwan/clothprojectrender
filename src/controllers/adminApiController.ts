import type { Request, Response } from 'express';
import { adminLoginUsecase } from '../services/authService.js';
import { countProducts, adminGetAllProducts, adminGetProductById, createProduct, updateProduct, deleteProduct } from '../services/adminProductService.js';
import { countOrders, getAllOrders, getOrderById, updateOrderStatus } from '../services/adminOrderService.js';
import { countUsers, getAllUsers, findUserById } from '../services/adminUserService.js';
import { setProductImages } from '../models/productImageModel.js';
import { normalizeProductImageInputs, uploadImageToCloudinary } from '../services/cloudinaryService.js';
import { supabase } from '../../data/supabaseClient.js';

export async function adminLoginApi(req: Request, res: Response): Promise<void> {
  try {
    const user = await adminLoginUsecase(req.body);
    req.session.user = user;

    res.status(200).json({
      message: 'login success',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
}

function parseProductPayload(body: Record<string, unknown>): {
  name: string;
  description: string;
  composition_care?: string;
  price: number;
  category_id: string;
  stock_quantity: number;
} {
  const name = String(body.name ?? '').trim();
  if (!name) throw new Error('Product name is required.');
  const description = String(body.description ?? '');
  const composition_care = String(body.composition_care ?? '').trim();
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) throw new Error('Invalid product price.');
  const stock_quantity = Number(body.stock_quantity);
  if (!Number.isFinite(stock_quantity) || stock_quantity < 0) throw new Error('Invalid stock quantity.');
  const category = String(body.category_id ?? '').trim();
  if (!category) throw new Error('Category is required.');
  return {
    name,
    description,
    composition_care: composition_care || undefined,
    price,
    category_id: category,
    stock_quantity,
  };
}

async function getCategoryAudienceOrThrow(categoryId: string): Promise<'men' | 'women' | 'kids'> {
  const { data, error } = await supabase
    .from('categories')
    .select('audience')
    .eq('id', categoryId)
    .eq('del_flg', false)
    .single();
  if (error || !data) throw new Error('Invalid category.');
  const audience = String((data as any).audience ?? '').toLowerCase();
  if (audience !== 'men' && audience !== 'women' && audience !== 'kids') {
    throw new Error('Invalid category audience.');
  }
  return audience;
}

export function adminLogoutApi(req: Request, res: Response): void {
  req.session.destroy(() => {
    res.status(200).json({ message: 'logout success' });
  });
}

export async function adminDashboardApi(_req: Request, res: Response): Promise<void> {
  try {
    const [totalProducts, totalOrders, totalUsers, recentOrders] = await Promise.all([
      countProducts(),
      countOrders(),
      countUsers(),
      getAllOrders(),
    ]);
    res.status(200).json({
      stats: { totalProducts, totalOrders, totalUsers },
      recentOrders: recentOrders.slice(0, 5),
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminListProductsApi(_req: Request, res: Response): Promise<void> {
  try {
    const products = await adminGetAllProducts();
    res.status(200).json({ products });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminGetProductApi(req: Request, res: Response): Promise<void> {
  try {
    const product = await adminGetProductById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    res.status(200).json({ product });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminCreateProductApi(req: Request, res: Response): Promise<void> {
  try {
    const payload = parseProductPayload(req.body);
    const imageUrls = await normalizeProductImageInputs(String(req.body.image_urls ?? ''));
    const audience = await getCategoryAudienceOrThrow(payload.category_id);
    const product = await createProduct({ ...payload, audience, is_active: true });
    if (imageUrls.length > 0) await setProductImages(product.id, imageUrls);
    res.status(201).json({ message: 'product created', product });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminUpdateProductApi(req: Request, res: Response): Promise<void> {
  try {
    const payload = parseProductPayload(req.body);
    const imageUrls = await normalizeProductImageInputs(String(req.body.image_urls ?? ''));
    const audience = await getCategoryAudienceOrThrow(payload.category_id);
    const product = await updateProduct(req.params.id, { ...payload, audience });
    await setProductImages(req.params.id, imageUrls);
    res.status(200).json({ message: 'product updated', product });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminDeleteProductApi(req: Request, res: Response): Promise<void> {
  try {
    await deleteProduct(req.params.id);
    res.status(200).json({ message: 'product deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminUploadProductImageApi(req: Request, res: Response): Promise<void> {
  try {
    const file = String(req.body?.file ?? '');
    if (!file) {
      res.status(400).json({ message: 'file is required.' });
      return;
    }
    const url = await uploadImageToCloudinary(file);
    res.status(200).json({ message: 'upload success', url });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminListOrdersApi(req: Request, res: Response): Promise<void> {
  try {
    const status = String(req.query.status ?? 'all');
    const orders = await getAllOrders(status);
    res.status(200).json({ orders });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminGetOrderApi(req: Request, res: Response): Promise<void> {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    res.status(200).json({ order });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminUpdateOrderStatusApi(req: Request, res: Response): Promise<void> {
  try {
    const status = String(req.body?.status ?? '').trim();
    const order = await updateOrderStatus(req.params.id, status);
    res.status(200).json({ message: 'order status updated', order });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminListCustomersApi(_req: Request, res: Response): Promise<void> {
  try {
    const customers = await getAllUsers();
    res.status(200).json({ customers: customers.filter((u) => u.role === 'client') });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function adminGetCustomerApi(req: Request, res: Response): Promise<void> {
  try {
    const customer = await findUserById(req.params.id);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found.' });
      return;
    }
    res.status(200).json({ customer });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
