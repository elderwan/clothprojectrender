import type { Request, Response } from 'express';
import { getUserOrders, getOrderDetail, placeOrder, simulatePayment } from '../services/orderService.js';
import { getCart } from '../services/cartService.js';
import { getAddressById, getDefaultAddress } from '../models/addressModel.js';

async function resolveAddressId(req: Request): Promise<string | undefined> {
  const rawAddressId = typeof req.body?.address_id === 'string' ? req.body.address_id : '';
  if (rawAddressId) {
    const addr = await getAddressById(rawAddressId, req.session.user!.id);
    if (!addr) throw new Error('Selected address is invalid.');
    return addr.id;
  }
  const defaultAddr = await getDefaultAddress(req.session.user!.id);
  return defaultAddr?.id;
}

export async function createOrderApi(req: Request, res: Response): Promise<void> {
  try {
    const cart = await getCart(req.session.user!.id);
    if (!cart.items.length) throw new Error('Cart is empty.');

    const addressId = await resolveAddressId(req);
    const order = await placeOrder({
      user_id: req.session.user!.id,
      address_id: addressId,
      items: cart.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        size: i.size,
      })),
    });
    res.status(201).json({ message: 'order created', order });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function getMyOrdersApi(req: Request, res: Response): Promise<void> {
  try {
    const orders = await getUserOrders(req.session.user!.id);
    res.status(200).json({ orders });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function getMyOrderDetailApi(req: Request, res: Response): Promise<void> {
  try {
    const order = await getOrderDetail(req.params.id);
    if (!order || order.user_id !== req.session.user!.id) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    res.status(200).json({ order });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function simulatePaymentApi(req: Request, res: Response): Promise<void> {
  try {
    const order = await getOrderDetail(req.params.id);
    if (!order || order.user_id !== req.session.user!.id) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    const rawResult = String(req.body?.result ?? req.query?.result ?? 'success').toLowerCase();
    const result = rawResult === 'fail' ? 'fail' : 'success';
    const updated = await simulatePayment(order.id, result);
    res.status(200).json({
      message: 'payment simulated',
      simulated: true,
      result,
      order: { id: updated.id, status: updated.status, total_amount: updated.total_amount },
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
