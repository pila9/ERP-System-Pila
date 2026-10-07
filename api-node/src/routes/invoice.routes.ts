import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, updateInvoiceStatus, addPayment, deleteInvoice } from '../controllers/invoice.controller.js';
import { createInvoiceSchema, updateInvoiceSchema, createPaymentSchema } from '../validators/invoice.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', validateRequest(createInvoiceSchema), createInvoice);
router.put('/:id', validateRequest(updateInvoiceSchema), updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/payments', validateRequest(createPaymentSchema), addPayment);
router.delete('/:id', deleteInvoice);

export default router;