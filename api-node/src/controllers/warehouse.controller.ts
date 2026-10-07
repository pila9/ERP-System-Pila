import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { warehouseService } from '../services/warehouse.service.js';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/warehouse.validators';

export const getWarehouses = asyncHandler(async (req: Request, res: Response) => {
  const result = await warehouseService.getAll(req.query);
  res.json(result);
});

export const getWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.getById(req.params.id);
  res.json(warehouse);
});

export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const data = createWarehouseSchema.parse(req.body);
  const warehouse = await warehouseService.create(data);
  res.status(201).json(warehouse);
});

export const updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const data = updateWarehouseSchema.parse(req.body);
  const warehouse = await warehouseService.update(req.params.id, data);
  res.json(warehouse);
});

export const deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
  await warehouseService.delete(req.params.id);
  res.status(204).send();
});