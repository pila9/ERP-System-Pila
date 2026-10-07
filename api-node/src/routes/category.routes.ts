import { Router } from 'express';
import { getCategories, getCategoryTree, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);
router.post('/', validateRequest(createCategorySchema), createCategory);
router.put('/:id', validateRequest(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;