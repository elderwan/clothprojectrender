import { Router, type Request, type Response } from 'express';
import { getProducts, getProductDetail } from '../controllers/productController.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.render('client/home', { title: 'Home' });
});

router.get('/products', getProducts);
router.get('/products/:id', getProductDetail);

router.get('/cart', (req: Request, res: Response) => {
  res.render('client/cart', { title: 'Cart' });
});

export default router;
