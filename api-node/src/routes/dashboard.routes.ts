import { Router } from 'express';
import { getDashboardOverview, getSalesChart, getTopProducts, getTopCustomers } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/overview', getDashboardOverview);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);
router.get('/top-customers', getTopCustomers);

export default router;