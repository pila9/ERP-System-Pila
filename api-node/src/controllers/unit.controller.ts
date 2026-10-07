import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { unitService } from '../services/unit.service.js';
import { createUnitSchema, updateUnitSchema } from '../validators/unit.validators';

export const getUnits = asyncHandler(async (req: Request, res: Response) => {
  const result = await unitService.getAll(req.query);
  res.json(result);
});

export const getUnit = asyncHandler(async (req: Request, res: Response) => {
  const unit = await unitService.getById(req.params.id);
  res.json(unit);
});

export const createUnit = asyncHandler(async (req: Request, res: Response) => {
  const data = createUnitSchema.parse(req.body);
  const unit = await unitService.create(data);
  res.status(201).json(unit);
});

export const updateUnit = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUnitSchema.parse(req.body);
  const unit = await unitService.update(req.params.id, data);
  res.json(unit);
});

export const deleteUnit = asyncHandler(async (req: Request, res: Response) => {
  await unitService.delete(req.params.id);
  res.status(204).send();
});