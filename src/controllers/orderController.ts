import type { Request, Response } from 'express';
import { getUserOrders, getOrderDetail, placeOrder, payOrder, countUserOrders } from '../services/orderService.js';
import { getCart } from '../services/cartService.js';
import { getAddressById, getAddressesByUser } from '../models/addressModel.js';

export async function postPlaceOrder(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');
  try {
    const cart = await getCart(req.authUser.id);
    if (!cart.items.length) return void res.redirect('/cart');

    const order = await placeOrder({
      user_id: req.authUser.id,
      items: cart.items.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
        size:       i.size,
      })),
    });
    res.redirect('/orders/' + order.id);
  } catch (err: any) {
    const message = err?.message || 'Unable to confirm this order right now.';
    res.redirect('/cart?error=' + encodeURIComponent(message));
  }
}

export async function showOrderConfirm(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');
  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.authUser.id) {
    return void res.redirect('/');
  }
  if (order.status !== 'payed') {
    return void res.redirect('/orders/' + order.id);
  }
  res.render('client/orderConfirmation', {
    title: 'Order Confirmed',
    order,
    payment: typeof req.query.payment === 'string' ? req.query.payment : null,
  });
}

export async function showOrderHistory(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');
  
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    getUserOrders(req.authUser.id, limit, offset),
    countUserOrders(req.authUser.id),
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
  if (!req.authUser) return void res.redirect('/login');
  const [order, addresses] = await Promise.all([
    getOrderDetail(req.params.id),
    getAddressesByUser(req.authUser.id),
  ]);
  if (!order || order.user_id !== req.authUser.id) {
    return void res.status(404).render('404', { title: 'Not Found' });
  }
  res.render('client/orderDetail', {
    title: 'Order ' + order.id,
    order,
    addresses,
    error: typeof req.query.error === 'string' ? req.query.error : null,
    success: typeof req.query.success === 'string' ? req.query.success : null,
  });
}

export async function postConfirmAndPay(req: Request, res: Response): Promise<void> {
  if (!req.authUser) return void res.redirect('/login');

  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.authUser.id) {
    return void res.status(404).render('404', { title: 'Not Found' });
  }
  const addressId = typeof req.body?.address_id === 'string' ? req.body.address_id.trim() : '';
  if (!addressId) {
    return void res.redirect('/orders/' + order.id + '?error=' + encodeURIComponent('Please select a shipping address before payment.'));
  }

  try {
    const address = await getAddressById(addressId, req.authUser.id);
    if (!address) {
      throw new Error('Selected address is invalid.');
    }
    await payOrder(order.id, req.authUser.id, address.id, {
      label: address.label,
      full_name: address.full_name,
      phone: address.phone ?? null,
      address_line1: address.address_line1,
      address_line2: address.address_line2 ?? null,
      city: address.city,
      state: address.state ?? null,
      postal_code: address.postal_code,
      country: address.country,
    });
    return void res.redirect(`/order-confirm/${order.id}?payment=success`);
  } catch (err: any) {
    return void res.redirect('/orders/' + order.id + '?error=' + encodeURIComponent(err?.message || 'Unable to confirm payment right now.'));
  }
}
