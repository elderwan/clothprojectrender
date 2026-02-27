import type { Request, Response } from 'express';
import { getUserOrders, getOrderDetail, placeOrder } from '../services/orderService.js';
import { getCart, emptyCart } from '../services/cartService.js';

export async function postPlaceOrder(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const cart = await getCart(req.session.user.id);
    if (!cart.items.length) return void res.redirect('/cart');

    const order = await placeOrder({
      user_id: req.session.user.id,
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
