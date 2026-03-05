import type { Request, Response } from 'express';
import { searchUsers, findUserById } from '../services/adminUserService.js';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? '').trim();
  const customers = await searchUsers({ role: 'client', q });
  res.render('admin/customers', { title: 'Customer Management', customers, filters: { q } });
}

export async function showCustomerDetail(req: Request, res: Response): Promise<void> {
  const user = await findUserById(req.params.id);
  if (!user) return void res.redirect('/admin/customers');
  res.render('admin/customerDetail', { title: 'Customer: ' + user.full_name, customer: user });
}
