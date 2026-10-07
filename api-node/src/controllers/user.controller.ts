import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { userService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getAll(req.query);
  res.json(result);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(req.params.id);
  res.json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await userService.create(data);
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  const user = await userService.update(req.params.id, data);
  res.json(user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.delete(req.params.id);
  res.status(204).send();
});