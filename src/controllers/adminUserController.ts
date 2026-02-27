import type { Request, Response } from 'express';
import { getAllUsers, findUserById } from '../services/adminUserService.js';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  const customers = await getAllUsers();
  // Only client users
  const clients = customers.filter(u => u.role === 'client');
  res.render('admin/customers', { title: 'Customer Management', customers: clients });
}

export async function showCustomerDetail(req: Request, res: Response): Promise<void> {
  const user = await findUserById(req.params.id);
  if (!user) return void res.redirect('/admin/customers');
  res.render('admin/customerDetail', { title: 'Customer: ' + user.full_name, customer: user });
}
