import { Router } from 'express';
import { getStockLevels, getStockMovements, createStockMovement, getLowStock, getStockValuation } from '../controllers/stock.controller.js';

const router = Router();

router.get('/levels', getStockLevels);
router.get('/movements', getStockMovements);
router.post('/movements', createStockMovement);
router.get('/low-stock', getLowStock);
router.get('/low', getLowStock);
router.get('/valuation', getStockValuation);

export default router;