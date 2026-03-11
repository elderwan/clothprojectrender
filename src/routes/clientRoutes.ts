import { Router, type Request, type Response } from 'express';
import { getProducts, getProductDetail } from '../controllers/productController.js';
import {
  showLogin, handleLogin, showRegister, handleRegister, handleLogout
} from '../controllers/authController.js';
import { showCart, postAddToCart, postUpdateQty, postRemoveItem } from '../controllers/cartController.js';
import {
  postPlaceOrder, postSimulatePayment, showOrderConfirm, showOrderHistory, showOrderDetail
} from '../controllers/orderController.js';
import { 
  showProfile, showEditProfile, showAddressBook, postUpdateProfile, 
  showChangePassword, postChangePassword,
  postAddAddress, postEditAddress, postDeleteAddress 
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCart } from '../services/cartService.js';
import { getAllProductsService, getTopProductsByAudienceService } from '../services/productService.js';
import { getActiveHomeBanners } from '../models/homeBannerModel.js';

const router = Router();

// ── Home ──────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  let cartCount = 0;
  if (req.authUser) {
    const cart = await getCart(req.authUser.id);
    cartCount = cart.items.length;
  }

  // fetch a handful of products for the homepage
  const [all, homeBanners, manTrends, womanTrends, kidTrends] = await Promise.all([
    getAllProductsService(),
    getActiveHomeBanners(),
    getTopProductsByAudienceService('men', 4),
    getTopProductsByAudienceService('women', 4),
    getTopProductsByAudienceService('kids', 4),
  ]);
  const newArrivals = all.slice(0, 4);

  res.render('client/home', {
    title: 'MAISON',
    cartCount,
    newArrivals,
    homeBanners,
    manTrends,
    womanTrends,
    kidTrends,
  });
});

// ── Auth ──────────────────────────────────────────────────────
router.get('/login', showLogin);
router.post('/login', handleLogin);
router.get('/register', showRegister);
router.post('/register', handleRegister);
router.get('/logout', handleLogout);

// ── Products ──────────────────────────────────────────────────
router.get('/products', getProducts);
router.get('/products/:id', getProductDetail);

// ── Cart ──────────────────────────────────────────────────────
router.get('/cart', showCart);
router.post('/cart/add', requireAuth, postAddToCart);
router.post('/cart/update', requireAuth, postUpdateQty);
router.post('/cart/remove/:id', requireAuth, postRemoveItem);

// ── Orders ────────────────────────────────────────────────────
router.post('/orders', requireAuth, postPlaceOrder);
router.post('/orders/:id/simulate-payment', requireAuth, postSimulatePayment);
router.get('/order-confirm/:id', requireAuth, showOrderConfirm);
router.get('/orders', requireAuth, showOrderHistory);
router.get('/orders/:id', requireAuth, showOrderDetail);

// ── Profile ───────────────────────────────────────────────────
router.get('/profile', requireAuth, showProfile);
router.get('/profile/edit', requireAuth, showEditProfile);
router.get('/profile/addresses', requireAuth, showAddressBook);
router.post('/profile/edit', requireAuth, postUpdateProfile);
router.get('/profile/change-password', requireAuth, showChangePassword);
router.post('/profile/change-password', requireAuth, postChangePassword);

// ── Addresses ─────────────────────────────────────────────────
router.post('/addresses', requireAuth, postAddAddress);
router.post('/addresses/:id/edit', requireAuth, postEditAddress);
router.post('/addresses/:id/delete', requireAuth, postDeleteAddress);

export default router;
