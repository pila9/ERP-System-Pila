import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { supplierService } from '../services/supplier.service.js';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplier.validators';

export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierService.getAll(req.query);
  res.json(result);
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await supplierService.getById(req.params.id);
  res.json(supplier);
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const data = createSupplierSchema.parse(req.body);
  const supplier = await supplierService.create(data);
  res.status(201).json(supplier);
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSupplierSchema.parse(req.body);
  const supplier = await supplierService.update(req.params.id, data);
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  await supplierService.delete(req.params.id);
  res.status(204).send();
});