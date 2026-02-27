import {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, countProducts
} from '../models/productModel.js';
import type { Product } from '../types/product.js';

export {
  getAllProducts as adminGetAllProducts,
  getProductById as adminGetProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  countProducts,
};
