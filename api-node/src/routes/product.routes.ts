import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', validateRequest(createProductSchema), createProduct);
router.put('/:id', validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;