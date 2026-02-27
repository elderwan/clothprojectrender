import 'express-session';
import type { PublicUser } from '../types/user.js';

declare module 'express-session' {
  interface SessionData {
    user?: PublicUser;
    cart?: Array<{ product_id: string; quantity: number; size?: string }>;
  }
}
