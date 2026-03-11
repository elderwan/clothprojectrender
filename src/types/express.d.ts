import type { PublicUser } from './user.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: PublicUser | null;
    }

    interface Locals {
      user?: PublicUser | null;
      cartCount?: number;
    }
  }
}

export {};
