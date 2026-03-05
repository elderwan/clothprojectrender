import type { Request, Response } from 'express';
import { adminSearchOrders, getOrderById, updateOrderStatus } from '../services/adminOrderService.js';

export async function listOrders(req: Request, res: Response): Promise<void> {
  const statusRaw = String(req.query.status ?? 'all');
  const minRaw = req.query.min_total ? Number(req.query.min_total) : undefined;
  const maxRaw = req.query.max_total ? Number(req.query.max_total) : undefined;
  const status = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(statusRaw)
    ? statusRaw
    : 'all';
  const filters = {
    order_no: String(req.query.order_no ?? '').trim(),
    customer: String(req.query.customer ?? '').trim(),
    status: status as 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    date_from: String(req.query.date_from ?? '').trim(),
    date_to: String(req.query.date_to ?? '').trim(),
    min_total: Number.isFinite(minRaw) ? minRaw : undefined,
    max_total: Number.isFinite(maxRaw) ? maxRaw : undefined,
  };
  const orders = await adminSearchOrders(filters);
  res.render('admin/orders', { title: 'Order Management', orders, filters });
}

export async function showOrderDetail(req: Request, res: Response): Promise<void> {
  const order = await getOrderById(req.params.id);
  if (!order) return void res.redirect('/admin/orders');
  res.render('admin/orderDetail', { title: 'Order Detail', order });
}

export async function handleUpdateStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    await updateOrderStatus(req.params.id, status);
    res.redirect('/admin/orders/' + req.params.id);
  } catch (err: any) {
    res.redirect('/admin/orders/' + req.params.id + '?error=' + encodeURIComponent(err.message));
  }
}
