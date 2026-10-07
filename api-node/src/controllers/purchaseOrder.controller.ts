import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { purchaseOrderService } from '../services/purchaseOrder.service.js';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema } from '../validators/purchaseOrder.validators';

export const getPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await purchaseOrderService.getAll(req.query, user.id);
  res.json(result);
});

export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await purchaseOrderService.getById(req.params.id);
  res.json(order);
});

export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = createPurchaseOrderSchema.parse(req.body);
  const order = await purchaseOrderService.create(data, user.id);
  res.status(201).json(order);
});

export const updatePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = updatePurchaseOrderSchema.parse(req.body);
  const order = await purchaseOrderService.update(req.params.id, data);
  res.json(order);
});

export const updatePurchaseOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const order = await purchaseOrderService.updateStatus(req.params.id, status);
  res.json(order);
});

export const receivePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body;
  const order = await purchaseOrderService.receive(req.params.id, items);
  res.json(order);
});

export const deletePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  await purchaseOrderService.delete(req.params.id);
  res.status(204).send();
});