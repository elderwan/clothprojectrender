import { Router } from 'express';
import { requireAuthApi } from '../middleware/authMiddleware.js';
import { requireAdminApi } from '../middleware/adminMiddleware.js';
import { loginApi, registerApi, logoutApi, meApi } from '../controllers/authApiController.js';
import { getProductsApi, getProductDetailApi } from '../controllers/productApiController.js';
import { getCartApi, addCartItemApi, updateCartItemApi, deleteCartItemApi } from '../controllers/cartApiController.js';
import { createOrderApi, getMyOrdersApi, getMyOrderDetailApi, simulatePaymentApi } from '../controllers/orderApiController.js';
import {
  getProfileApi, updateProfileApi, getAddressesApi, createAddressApi, updateAddressApi, deleteAddressApi,
} from '../controllers/userApiController.js';
import {
  adminLoginApi, adminLogoutApi, adminDashboardApi,
  adminListProductsApi, adminGetProductApi, adminCreateProductApi, adminUpdateProductApi, adminDeleteProductApi,
  adminUploadProductImageApi, adminListOrdersApi, adminGetOrderApi, adminUpdateOrderStatusApi,
  adminListCustomersApi, adminGetCustomerApi,
} from '../controllers/adminApiController.js';

const router = Router();

// Auth
router.post('/api/auth/login', loginApi);
router.post('/api/auth/register', registerApi);
router.post('/api/auth/logout', logoutApi);
router.get('/api/auth/me', meApi);

// Catalog
router.get('/api/products', getProductsApi);
router.get('/api/products/:id', getProductDetailApi);

// Admin auth
router.post('/api/admin/login', adminLoginApi);

// Client protected
router.use('/api', requireAuthApi);
router.get('/api/cart', getCartApi);
router.post('/api/cart/items', addCartItemApi);
router.patch('/api/cart/items/:id', updateCartItemApi);
router.delete('/api/cart/items/:id', deleteCartItemApi);

router.post('/api/orders', createOrderApi);
router.get('/api/orders', getMyOrdersApi);
router.get('/api/orders/:id', getMyOrderDetailApi);
router.post('/api/orders/:id/simulate-payment', simulatePaymentApi);

router.get('/api/profile', getProfileApi);
router.patch('/api/profile', updateProfileApi);
router.get('/api/addresses', getAddressesApi);
router.post('/api/addresses', createAddressApi);
router.patch('/api/addresses/:id', updateAddressApi);
router.delete('/api/addresses/:id', deleteAddressApi);

// Admin auth + protected
router.post('/api/admin/logout', requireAdminApi, adminLogoutApi);
router.use('/api/admin', requireAdminApi);

router.get('/api/admin/dashboard', adminDashboardApi);
router.get('/api/admin/products', adminListProductsApi);
router.get('/api/admin/products/:id', adminGetProductApi);
router.post('/api/admin/products', adminCreateProductApi);
router.patch('/api/admin/products/:id', adminUpdateProductApi);
router.delete('/api/admin/products/:id', adminDeleteProductApi);
router.post('/api/admin/uploads/product-image', adminUploadProductImageApi);

router.get('/api/admin/orders', adminListOrdersApi);
router.get('/api/admin/orders/:id', adminGetOrderApi);
router.patch('/api/admin/orders/:id/status', adminUpdateOrderStatusApi);

router.get('/api/admin/customers', adminListCustomersApi);
router.get('/api/admin/customers/:id', adminGetCustomerApi);

export default router;
