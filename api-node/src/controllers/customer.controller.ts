import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { customerService } from '../services/customer.service.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validators';

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getAll(req.query);
  res.json(result);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getById(req.params.id);
  res.json(customer);
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = createCustomerSchema.parse(req.body);
  const customer = await customerService.create(data);
  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = updateCustomerSchema.parse(req.body);
  const customer = await customerService.update(req.params.id, data);
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  await customerService.delete(req.params.id);
  res.status(204).send();
});