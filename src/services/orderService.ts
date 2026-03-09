import { getOrdersByUser, getOrderById, createOrder, getAllOrders, countOrders, countOrdersByUser } from '../models/orderModel.js';
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
  return createOrder(input);
}

export async function simulatePayment(orderId: string, _result: 'success' | 'fail'): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found.');
  return order;
}

export { getAllOrders, countOrders };
