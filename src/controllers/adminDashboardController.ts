import type { Request, Response } from 'express';
import { countProducts } from '../services/adminProductService.js';
import { countOrders } from '../services/adminOrderService.js';
import { countUsers } from '../services/adminUserService.js';
import { getAllOrders } from '../services/adminOrderService.js';

export async function showDashboard(req: Request, res: Response): Promise<void> {
  const [totalProducts, totalOrders, totalUsers, recentOrders] = await Promise.all([
    countProducts(),
    countOrders(),
    countUsers(),
    getAllOrders(),
  ]);
  res.render('admin/dashboard', {
    title: 'Dashboard',
    stats: { totalProducts, totalOrders, totalUsers },
    recentOrders: recentOrders.slice(0, 5),
  });
}
