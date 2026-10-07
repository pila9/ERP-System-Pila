import { Router } from 'express';
import { getSalesReport, getPurchaseReport, getInventoryReport, getReceivablesReport, getPayablesReport } from '../controllers/report.controller.js';

const router = Router();

router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/inventory', getInventoryReport);
router.get('/receivables', getReceivablesReport);
router.get('/payables', getPayablesReport);

export default router;