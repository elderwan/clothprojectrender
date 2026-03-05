import type { Request, Response, NextFunction } from 'express';

/** Requires an authenticated client session. Redirects to /login if not. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

/** API variant: returns JSON instead of redirecting. */
export function requireAuthApi(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ message: 'Authentication required.' });
  }
}

/** Attaches user to res.locals for use in all EJS templates. */
import { getCart } from '../services/cartService.js';

export async function injectUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.locals.user = req.session?.user ?? null;

  // compute cart count for logged-in users so header can show item number
  if (req.session?.user) {
    try {
      const cart = await getCart(req.session.user.id);
      res.locals.cartCount = cart?.items?.length ?? 0;
    } catch (err) {
      console.error('failed to load cart count', err);
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }

  next();
}
