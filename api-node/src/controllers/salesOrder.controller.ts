import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { salesOrderService } from '../services/salesOrder.service.js';
import { createSalesOrderSchema, updateSalesOrderSchema } from '../validators/salesOrder.validators';

export const getSalesOrders = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await salesOrderService.getAll(req.query, user.id);
  res.json(result);
});

export const getSalesOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await salesOrderService.getById(req.params.id);
  res.json(order);
});

export const createSalesOrder = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = createSalesOrderSchema.parse(req.body);
  const order = await salesOrderService.create(data, user.id);
  res.status(201).json(order);
});

export const updateSalesOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSalesOrderSchema.parse(req.body);
  const order = await salesOrderService.update(req.params.id, data);
  res.json(order);
});

export const updateSalesOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const order = await salesOrderService.updateStatus(req.params.id, status);
  res.json(order);
});

export const deleteSalesOrder = asyncHandler(async (req: Request, res: Response) => {
  await salesOrderService.delete(req.params.id);
  res.status(204).send();
});