import type { Request, Response } from 'express';
import { getUserOrders, getOrderDetail, placeOrder, simulatePayment, countUserOrders } from '../services/orderService.js';
import { getCart } from '../services/cartService.js';
import { getAddressById, getDefaultAddress } from '../models/addressModel.js';

export async function postPlaceOrder(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const cart = await getCart(req.session.user.id);
    if (!cart.items.length) return void res.redirect('/cart');
    const rawAddressId = typeof req.body?.address_id === 'string' ? req.body.address_id : '';

    let addressId: string | undefined;
    if (rawAddressId) {
      const addr = await getAddressById(rawAddressId, req.session.user.id);
      if (!addr) throw new Error('Selected address is invalid.');
      addressId = addr.id;
    } else {
      const defaultAddr = await getDefaultAddress(req.session.user.id);
      addressId = defaultAddr?.id;
    }

    const order = await placeOrder({
      user_id: req.session.user.id,
      address_id: addressId,
      items: cart.items.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
        size:       i.size,
      })),
    });
    res.redirect('/order-confirm/' + order.id);
  } catch (err: any) {
    const message = err?.message || 'Unable to confirm this order right now.';
    res.redirect('/cart?error=' + encodeURIComponent(message));
  }
}

export async function showOrderConfirm(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.session.user.id) {
    return void res.redirect('/');
  }
  res.render('client/orderConfirmation', { title: 'Order Confirmed', order });
}

export async function showOrderHistory(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    getUserOrders(req.session.user.id, limit, offset),
    countUserOrders(req.session.user.id),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.render('client/orders', { 
    title: 'Order History', 
    orders,
    currentPage: page,
    totalPages
  });
}

export async function showOrderDetail(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.session.user.id) {
    return void res.status(404).render('404', { title: 'Not Found' });
  }
  res.render('client/orderDetail', { title: 'Order ' + order.id, order });
}

export async function postSimulatePayment(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');

  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.session.user.id) {
    return void res.status(404).render('404', { title: 'Not Found' });
  }

  const rawResult = String(req.body?.result ?? req.query?.result ?? 'success').toLowerCase();
  const result = rawResult === 'fail' ? 'fail' : 'success';

  try {
    await simulatePayment(order.id, result);
    const paymentFlag = result === 'success' ? 'success' : 'failed';
    return void res.redirect(`/order-confirm/${order.id}?payment=${paymentFlag}`);
  } catch (err: any) {
    return void res.redirect('/order-confirm/' + order.id + '?payment=failed');
  }
}
