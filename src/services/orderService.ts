import { getOrdersByUser, getOrderById, createOrder, getAllOrders, countOrders, updateOrderStatus, countOrdersByUser } from '../models/orderModel.js';
import { clearCart } from '../models/cartModel.js';
import type { Order, CreateOrderInput } from '../types/order.js';

export async function getUserOrders(userId: string, limit?: number, offset?: number): Promise<Order[]> {
  return getOrdersByUser(userId, limit, offset);
}

export async function countUserOrders(userId: string): Promise<number> {
  return countOrdersByUser(userId);
}

export async function getOrderDetail(id: string): Promise<Order | null> {
  return getOrderById(id);
}

export async function placeOrder(input: CreateOrderInput): Promise<Order> {
  const order = await createOrder(input);
  // Clear the cart after successful order
  await clearCart(input.user_id);
  return order;
}

export async function simulatePayment(orderId: string, result: 'success' | 'fail'): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found.');

  if (result === 'fail') {
    return order;
  }

  if (order.status !== 'pending') {
    return order;
  }

  return updateOrderStatus(orderId, 'processing');
}

export { getAllOrders, countOrders };
