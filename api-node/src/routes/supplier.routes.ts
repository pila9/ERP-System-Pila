import { Router } from 'express';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller.js';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplier.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', validateRequest(createSupplierSchema), createSupplier);
router.put('/:id', validateRequest(updateSupplierSchema), updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;