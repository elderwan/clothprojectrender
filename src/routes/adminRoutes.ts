import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

router.get('/products', (req: Request, res: Response) => {
  res.render('admin/products', { title: 'Admin Products' });
});

router.get('/orders', (req: Request, res: Response) => {
  res.render('admin/orders', { title: 'Admin Orders' });
});

export default router;
