import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { productService } from '../services/product.service.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validators';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.getAll(req.query);
  res.json(result);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(req.params.id);
  res.json(product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);
  const product = await productService.create(data);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = updateProductSchema.parse(req.body);
  const product = await productService.update(req.params.id, data);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.delete(req.params.id);
  res.status(204).send();
});