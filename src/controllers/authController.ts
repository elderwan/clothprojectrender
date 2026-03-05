import type { Request, Response } from 'express';
import { register, login } from '../services/authService.js';

function getSafeRedirectPath(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  if (value.includes('\n') || value.includes('\r')) return '/';
  return value;
}

export async function showLogin(req: Request, res: Response): Promise<void> {
  if (req.session.user) return void res.redirect('/');
  res.render('client/login', { title: 'Sign In', error: null });
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body?.email || !req.body?.password) {
      throw new Error('Email and password are required.');
    }
    const user = await login(req.body);
    req.session.user = user;
    res.redirect(getSafeRedirectPath(req.body.redirect));
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
    if (!req.body?.email || !req.body?.password || !req.body?.full_name) {
      throw new Error('Name, email, and password are required.');
    }
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
