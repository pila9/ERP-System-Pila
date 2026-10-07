import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { dashboardService } from '../services/dashboard.service.js';

export const getDashboardOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await dashboardService.getOverview(req.query);
  res.json(overview);
});

export const getSalesChart = asyncHandler(async (req: Request, res: Response) => {
  const chart = await dashboardService.getSalesChart(req.query);
  res.json(chart);
});

export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const products = await dashboardService.getTopProducts(limit);
  res.json(products);
});

export const getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const customers = await dashboardService.getTopCustomers(limit);
  res.json(customers);
});