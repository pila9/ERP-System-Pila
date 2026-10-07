import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { categoryService } from '../services/category.service.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.getAll(req.query);
  res.json(result);
});

export const getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
  const tree = await categoryService.getTree();
  res.json(tree);
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getById(req.params.id);
  res.json(category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = createCategorySchema.parse(req.body);
  const category = await categoryService.create(data);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = updateCategorySchema.parse(req.body);
  const category = await categoryService.update(req.params.id, data);
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.delete(req.params.id);
  res.status(204).send();
});