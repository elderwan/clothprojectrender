import { getAllOrders, getRecentOrders, getOrderRevenueTotal, getOrderById, updateOrderStatus, countOrders, searchOrdersForAdmin } from '../models/orderModel.js';
import type { AdminOrderSearchFilters } from '../models/orderModel.js';

export { getAllOrders, getRecentOrders, getOrderRevenueTotal, getOrderById, updateOrderStatus, countOrders };

export async function adminSearchOrders(filters: AdminOrderSearchFilters) {
  return searchOrdersForAdmin(filters);
}
