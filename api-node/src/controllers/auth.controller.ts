import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authService } from '../services/auth.service.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../validators/auth.validators';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);
  res.json(result);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  res.status(201).json(result);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await authService.getProfile(user.id);
  res.json(profile);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const result = await authService.changePassword(user.id, currentPassword, newPassword);
  res.json(result);
});