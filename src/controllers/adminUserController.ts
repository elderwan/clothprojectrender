import type { Request, Response } from 'express';
import { searchUsers, findUserById, getOrdersByUser } from '../services/adminUserService.js';
import { supabase } from '../../data/supabaseClient.js';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? '').trim();
  const customers = await searchUsers({ role: 'client', q });

  const customerIds = customers.map((c) => c.id);
  let orderCountByUserId = new Map<string, number>();

  if (customerIds.length > 0) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('user_id')
      .in('user_id', customerIds)
      .eq('del_flg', false);

    if (error) throw new Error(error.message);

    orderCountByUserId = (orders ?? []).reduce((map, row: any) => {
      const userId = String(row.user_id);
      map.set(userId, (map.get(userId) ?? 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  const customersWithOrderCount = customers.map((customer) => ({
    ...customer,
    order_count: orderCountByUserId.get(customer.id) ?? 0,
  }));

  res.render('admin/customers', {
    title: 'Customer Management',
    customers: customersWithOrderCount,
    filters: { q },
  });
}

export async function showCustomerDetail(req: Request, res: Response): Promise<void> {
  const [user, orders] = await Promise.all([
    findUserById(req.params.id),
    getOrdersByUser(req.params.id),
  ]);
  if (!user) return void res.redirect('/admin/customers');
  res.render('admin/customerDetail', {
    title: 'Customer: ' + user.full_name,
    customer: user,
    orders,
  });
}
