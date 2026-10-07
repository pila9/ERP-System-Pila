import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { stockService } from '../services/stock.service.js';

export const getStockLevels = asyncHandler(async (req: Request, res: Response) => {
  const result = await stockService.getLevels(req.query);
  res.json(result);
});

export const getStockMovements = asyncHandler(async (req: Request, res: Response) => {
  const result = await stockService.getMovements(req.query);
  res.json(result);
});

export const createStockMovement = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const movement = await stockService.createMovement(req.body, user.id);
  res.status(201).json(movement);
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const { warehouseId } = req.query;
  const lowStock = await stockService.getLowStock(warehouseId as string);
  res.json(lowStock);
});

export const getStockValuation = asyncHandler(async (req: Request, res: Response) => {
  const { warehouseId } = req.query;
  const valuation = await stockService.getStockValuation(warehouseId as string);
  res.json(valuation);
});