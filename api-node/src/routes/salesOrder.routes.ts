import { Router } from 'express';
import { getSalesOrders, getSalesOrder, createSalesOrder, updateSalesOrder, updateSalesOrderStatus, deleteSalesOrder } from '../controllers/salesOrder.controller.js';
import { createSalesOrderSchema, updateSalesOrderSchema } from '../validators/salesOrder.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getSalesOrders);
router.get('/:id', getSalesOrder);
router.post('/', validateRequest(createSalesOrderSchema), createSalesOrder);
router.put('/:id', validateRequest(updateSalesOrderSchema), updateSalesOrder);
router.patch('/:id/status', updateSalesOrderStatus);
router.delete('/:id', deleteSalesOrder);

export default router;