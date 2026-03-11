import { confirmOrderPayment, getOrdersByUser, getOrderById, createOrder, getAllOrders, countOrders, countOrdersByUser } from '../models/orderModel.js';
import type { CreateOrderInput, Order, OrderAddressSnapshot } from '../types/order.js';

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

export async function payOrder(orderId: string, userId: string, addressId: string, addressSnapshot: OrderAddressSnapshot): Promise<Order> {
  return confirmOrderPayment(orderId, userId, addressId, addressSnapshot);
}

export { getAllOrders, countOrders };
