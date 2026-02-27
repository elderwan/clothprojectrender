import type { Request, Response } from 'express';
import { register, login } from '../services/authService.js';

export async function showLogin(req: Request, res: Response): Promise<void> {
  if (req.session.user) return void res.redirect('/');
  res.render('client/login', { title: 'Sign In', error: null });
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const user = await login(req.body);
    req.session.user = user;
    res.redirect(req.body.redirect || '/');
  } catch (err: any) {
    res.render('client/login', { title: 'Sign In', error: err.message });
  }
}

export async function showRegister(req: Request, res: Response): Promise<void> {
  if (req.session.user) return void res.redirect('/');
  res.render('client/register', { title: 'Create Account', error: null });
}

export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    const user = await register(req.body);
    req.session.user = user;
    res.redirect('/');
  } catch (err: any) {
    res.render('client/register', { title: 'Create Account', error: err.message });
  }
}

export function handleLogout(req: Request, res: Response): void {
  req.session.destroy(() => res.redirect('/'));
}

// Admin login
export async function showAdminLogin(req: Request, res: Response): Promise<void> {
  if (req.session.user?.role === 'admin') return void res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null });
}

export async function handleAdminLogin(req: Request, res: Response): Promise<void> {
  try {
    const user = await login(req.body);
    if (user.role !== 'admin') throw new Error('Access denied.');
    req.session.user = user;
    res.redirect('/admin');
  } catch (err: any) {
    res.render('admin/login', { title: 'Admin Login', error: err.message });
  }
}
