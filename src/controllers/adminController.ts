import type { Request, Response } from 'express';
import { adminLoginUsecase } from '../services/authService.js';
import { clearAuthCookie, setAuthCookie } from '../services/jwtService.js';

export function adminLoginPage(req: Request, res: Response): void {
  if (req.authUser?.role === 'admin') {
    res.redirect('/admin');
    return;
  }

  res.render('admin/login', {
    title: 'Admin Login',
    error: null,
  });
}

export function adminLogoutPage(req: Request, res: Response): void {
  clearAuthCookie(res);
  req.session.destroy(() => res.redirect('/admin/login'));
}

export async function adminLoginSubmitPage(req: Request, res: Response): Promise<void> {
  try {
    const user = await adminLoginUsecase(req.body);
    setAuthCookie(res, user);
    res.redirect('/admin');
  } catch (err: any) {
    res.status(401).render('admin/login', {
      title: 'Admin Login',
      error: err.message,
    });
  }
}
