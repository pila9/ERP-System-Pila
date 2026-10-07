import { Router } from 'express';
import { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouse.controller.js';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/warehouse.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getWarehouses);
router.get('/:id', getWarehouse);
router.post('/', validateRequest(createWarehouseSchema), createWarehouse);
router.put('/:id', validateRequest(updateWarehouseSchema), updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;