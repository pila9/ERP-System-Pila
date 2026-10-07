import { Router } from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customer.controller.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validators';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', validateRequest(createCustomerSchema), createCustomer);
router.put('/:id', validateRequest(updateCustomerSchema), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;