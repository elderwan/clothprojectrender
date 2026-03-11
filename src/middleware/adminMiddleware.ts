import type { Request, Response, NextFunction } from 'express';

/** Requires an admin session. Redirects to /admin/login if not. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.authUser?.role === 'admin') {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

/** API variant: returns JSON instead of redirecting. */
export function requireAdminApi(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required.' });
    return;
  }
  next();
}
