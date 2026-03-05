import type { Request, Response } from 'express';
import { getUserOrders, getOrderDetail, placeOrder, simulatePayment } from '../services/orderService.js';
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
    res.redirect('/cart?error=' + encodeURIComponent(err.message));
  }
}

export async function showOrderConfirm(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.session.user.id) {
    return void res.redirect('/');
  }
  res.render('client/orderConfirm', { title: 'Order Confirmed', order });
}

export async function showOrderHistory(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const orders = await getUserOrders(req.session.user.id);
  res.render('client/orderHistory', { title: 'Order History', orders });
}

export async function showOrderDetail(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.session.user.id) {
    return void res.status(404).render('404', { title: 'Not Found' });
  }
  res.render('client/orderDetail', { title: 'Order ' + order.id, order });
}

function wantsJson(req: Request): boolean {
  const accept = req.headers.accept ?? '';
  return accept.includes('application/json') || req.xhr;
}

export async function postSimulatePayment(req: Request, res: Response): Promise<void> {
  if (!req.session.user) {
    if (wantsJson(req)) return void res.status(401).json({ error: 'Authentication required.' });
    return void res.redirect('/login');
  }

  const order = await getOrderDetail(req.params.id);
  if (!order || order.user_id !== req.session.user.id) {
    if (wantsJson(req)) return void res.status(404).json({ error: 'Order not found.' });
    return void res.status(404).render('404', { title: 'Not Found' });
  }

  const rawResult = String(req.body?.result ?? req.query?.result ?? 'success').toLowerCase();
  const result = rawResult === 'fail' ? 'fail' : 'success';

  try {
    const updated = await simulatePayment(order.id, result);
    if (wantsJson(req)) {
      return void res.json({
        ok: true,
        simulated: true,
        result,
        order: { id: updated.id, status: updated.status, total_amount: updated.total_amount },
      });
    }
    const paymentFlag = result === 'success' ? 'success' : 'failed';
    return void res.redirect(`/order-confirm/${order.id}?payment=${paymentFlag}`);
  } catch (err: any) {
    if (wantsJson(req)) return void res.status(400).json({ error: err.message });
    return void res.redirect('/order-confirm/' + order.id + '?payment=failed');
  }
}
