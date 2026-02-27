import type { Request, Response, NextFunction } from 'express';

/** Requires an admin session. Redirects to /admin/login if not. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.user?.role === 'admin') {
    next();
  } else {
    res.redirect('/admin/login');
  }
}
