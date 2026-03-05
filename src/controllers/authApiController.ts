import type { Request, Response } from 'express';
import { login, register } from '../services/authService.js';

function sanitizeUser(user: { id: string; email: string; role: string; full_name?: string }): Record<string, unknown> {
  return { id: user.id, email: user.email, role: user.role, full_name: user.full_name ?? null };
}

export async function loginApi(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body?.email || !req.body?.password) throw new Error('Email and password are required.');
    const user = await login(req.body);
    req.session.user = user;
    res.status(200).json({ message: 'login success', user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
}

export async function registerApi(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body?.email || !req.body?.password || !req.body?.full_name) {
      throw new Error('Name, email, and password are required.');
    }
    const user = await register(req.body);
    req.session.user = user;
    res.status(201).json({ message: 'register success', user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export function logoutApi(req: Request, res: Response): void {
  req.session.destroy(() => {
    res.status(200).json({ message: 'logout success' });
  });
}

export function meApi(req: Request, res: Response): void {
  if (!req.session.user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }
  res.status(200).json({ user: sanitizeUser(req.session.user) });
}
