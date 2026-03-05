import { Router } from 'express';
import { showAdminLogin, handleAdminLogin, handleAdminLogout } from '../controllers/authController.js';
import { showDashboard } from '../controllers/adminDashboardController.js';
import {
  listProducts, showAddProduct, handleAddProduct,
  showEditProduct, handleEditProduct, handleDeleteProduct, uploadProductImage
} from '../controllers/adminProductController.js';
import { listOrders, showOrderDetail, handleUpdateStatus } from '../controllers/adminOrderController.js';
import { listCustomers, showCustomerDetail } from '../controllers/adminUserController.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// ── Admin Auth ────────────────────────────────────────────────
router.get('/login', showAdminLogin);
router.post('/login', handleAdminLogin);

// All routes below require admin session
router.use(requireAdmin);
router.get('/logout', handleAdminLogout);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/', showDashboard);

// ── Products ──────────────────────────────────────────────────
router.get('/products', listProducts);
router.get('/products/add', showAddProduct);
router.post('/products/add', handleAddProduct);
router.get('/products/:id/edit', showEditProduct);
router.post('/products/:id/edit', handleEditProduct);
router.post('/products/:id/delete', handleDeleteProduct);
router.post('/uploads/product-image', uploadProductImage);

// ── Orders ────────────────────────────────────────────────────
router.get('/orders', listOrders);
router.get('/orders/:id', showOrderDetail);
router.post('/orders/:id/status', handleUpdateStatus);

// ── Customers ─────────────────────────────────────────────────
router.get('/customers', listCustomers);
router.get('/customers/:id', showCustomerDetail);

export default router;
