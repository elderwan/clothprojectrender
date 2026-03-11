import type { Request, Response } from 'express';
import { countProducts } from '../services/adminProductService.js';
import { countUsers } from '../services/adminUserService.js';
import { countOrders, getOrderRevenueTotal, getRecentOrders } from '../services/adminOrderService.js';

export async function showDashboard(req: Request, res: Response): Promise<void> {
  const [totalProducts, totalOrders, totalUsers, revenue, recentOrders] = await Promise.all([
    countProducts(),
    countOrders(),
    countUsers(),
    getOrderRevenueTotal(),
    getRecentOrders(5),
  ]);

  res.render('admin/dashboard', {
    title: 'Dashboard',
    stats: { totalProducts, totalOrders, totalUsers, revenue },
    recentOrders,
  });
}
