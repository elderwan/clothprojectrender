import { Router, type Request, type Response } from 'express';
import { getProducts, getProductDetail } from '../controllers/productController.js';
import {
  showLogin, handleLogin, showRegister, handleRegister, handleLogout
} from '../controllers/authController.js';
import { showCart, postAddToCart, postUpdateQty, postRemoveItem } from '../controllers/cartController.js';
import {
  postPlaceOrder, showOrderConfirm, showOrderHistory, showOrderDetail
} from '../controllers/orderController.js';
import { showProfile, postUpdateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// ── Home ──────────────────────────────────────────────────────
router.get('/', (req: Request, res: Response) => {
  res.render('client/home', { title: 'MAISON' });
});

// ── Auth ──────────────────────────────────────────────────────
router.get('/login',         showLogin);
router.post('/login',        handleLogin);
router.get('/register',      showRegister);
router.post('/register',     handleRegister);
router.get('/logout',        handleLogout);

// ── Products ──────────────────────────────────────────────────
router.get('/products',      getProducts);
router.get('/products/:id',  getProductDetail);

// ── Cart ──────────────────────────────────────────────────────
router.get('/cart',               showCart);
router.post('/cart/add',          postAddToCart);
router.post('/cart/update',       postUpdateQty);
router.post('/cart/remove/:id',   postRemoveItem);

// ── Orders ────────────────────────────────────────────────────
router.post('/orders',                requireAuth, postPlaceOrder);
router.get('/order-confirm/:id',     requireAuth, showOrderConfirm);
router.get('/orders',                requireAuth, showOrderHistory);
router.get('/orders/:id',            requireAuth, showOrderDetail);

// ── Profile ───────────────────────────────────────────────────
router.get('/profile',   requireAuth, showProfile);
router.post('/profile',  requireAuth, postUpdateProfile);

export default router;
