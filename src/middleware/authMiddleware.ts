import type { Request, Response, NextFunction } from 'express';

/** Requires an authenticated client session. Redirects to /login if not. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

/** Attaches user to res.locals for use in all EJS templates. */
export function injectUser(req: Request, res: Response, next: NextFunction): void {
  res.locals.user = req.session?.user ?? null;
  next();
}
