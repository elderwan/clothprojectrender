import type { Request, Response } from 'express';
import { adminLoginUsecase } from '../services/authService.js';

export function adminLoginPage(req: Request, res: Response): void {
  if (req.session.user?.role === 'admin') {
    res.redirect('/admin');
    return;
  }

  res.render('admin/login', {
    title: 'Admin Login',
    error: null,
  });
}

export function adminLogoutPage(req: Request, res: Response): void {
  req.session.destroy(() => res.redirect('/admin/login'));
}

export async function adminLoginSubmitPage(req: Request, res: Response): Promise<void> {
  try {
    const user = await adminLoginUsecase(req.body);
    req.session.user = user;
    res.redirect('/admin');
  } catch (err: any) {
    res.status(401).render('admin/login', {
      title: 'Admin Login',
      error: err.message,
    });
  }
}
