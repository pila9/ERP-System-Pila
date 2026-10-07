import { Router } from 'express';
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder, deletePurchaseOrder } from '../controllers/purchaseOrder.controller.js';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema } from '../validators/purchaseOrder.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/', validateRequest(createPurchaseOrderSchema), createPurchaseOrder);
router.put('/:id', validateRequest(updatePurchaseOrderSchema), updatePurchaseOrder);
router.patch('/:id/status', updatePurchaseOrderStatus);
router.post('/:id/receive', receivePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;