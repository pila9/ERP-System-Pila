import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { roleService } from '../services/role.service.js';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validators';

export const getRoles = asyncHandler(async (req: Request, res: Response) => {
  const result = await roleService.getAll(req.query);
  res.json(result);
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.getById(req.params.id);
  res.json(role);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const data = createRoleSchema.parse(req.body);
  const role = await roleService.create(data);
  res.status(201).json(role);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const data = updateRoleSchema.parse(req.body);
  const role = await roleService.update(req.params.id, data);
  res.json(role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await roleService.delete(req.params.id);
  res.status(204).send();
});