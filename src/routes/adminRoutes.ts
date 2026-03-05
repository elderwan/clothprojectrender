import { Router } from 'express';
import { adminLoginPage, adminLoginSubmitPage, adminLogoutPage } from '../controllers/adminController.js';
import { showDashboard } from '../controllers/adminDashboardController.js';
import {
  listProducts, showAddProduct, handleAddProduct,
  showEditProduct, handleEditProduct, handleDeleteProduct
} from '../controllers/adminProductController.js';
import { listOrders, showOrderDetail, handleUpdateStatus } from '../controllers/adminOrderController.js';
import { listCustomers, showCustomerDetail } from '../controllers/adminUserController.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// ── Admin Auth ────────────────────────────────────────────────
router.get('/admin/login', adminLoginPage);
router.post('/admin/login', adminLoginSubmitPage);

// All admin page routes below require admin session
router.use('/admin', requireAdmin);
router.get('/admin/logout', adminLogoutPage);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/admin', showDashboard);

// ── Products ──────────────────────────────────────────────────
router.get('/admin/products', listProducts);
router.get('/admin/products/add', showAddProduct);
router.post('/admin/products/add', handleAddProduct);
router.get('/admin/products/:id/edit', showEditProduct);
router.post('/admin/products/:id/edit', handleEditProduct);
router.post('/admin/products/:id/delete', handleDeleteProduct);

// ── Orders ────────────────────────────────────────────────────
router.get('/admin/orders', listOrders);
router.get('/admin/orders/:id', showOrderDetail);
router.post('/admin/orders/:id/status', handleUpdateStatus);

// ── Customers ─────────────────────────────────────────────────
router.get('/admin/customers', listCustomers);
router.get('/admin/customers/:id', showCustomerDetail);

export default router;
