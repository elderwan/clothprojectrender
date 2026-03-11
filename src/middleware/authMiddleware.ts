import type { Request, Response, NextFunction } from 'express';
import { clearAuthCookie, getAuthUserFromRequest } from '../services/jwtService.js';
import { getCart } from '../services/cartService.js';

/** Requires an authenticated client session. Redirects to /login if not. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.authUser) {
    next();
  } else {
    res.redirect('/login');
  }
}

/** API variant: returns JSON instead of redirecting. */
export function requireAuthApi(req: Request, res: Response, next: NextFunction): void {
  if (req.authUser) {
    next();
  } else {
    res.status(401).json({ message: 'Authentication required.' });
  }
}

/** Attaches user to res.locals for use in all EJS templates. */
export async function injectUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authUser = getAuthUserFromRequest(req);
  req.authUser = authUser;
  res.locals.user = authUser;

  // compute cart count for logged-in users so header can show item number
  if (authUser) {
    try {
      const cart = await getCart(authUser.id);
      res.locals.cartCount = cart?.items?.length ?? 0;
    } catch (err) {
      console.error('failed to load cart count', err);
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }

  if (!authUser && getAuthUserFromRequest(req) === null && req.headers.cookie?.includes('maison_auth=')) {
    clearAuthCookie(res);
  }

  next();
}
