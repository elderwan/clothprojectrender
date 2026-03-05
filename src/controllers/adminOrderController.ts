import type { Request, Response } from 'express';
import { getAllOrders, getOrderById, updateOrderStatus } from '../services/adminOrderService.js';

export async function listOrders(req: Request, res: Response): Promise<void> {
  const status = (req.query.status as string) || 'all';
  const orders = await getAllOrders(status);
  res.render('admin/orders', { title: 'Order Management', orders, activeStatus: status });
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
