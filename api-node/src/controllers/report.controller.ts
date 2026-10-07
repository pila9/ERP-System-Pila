import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { reportService } from '../services/report.service.js';

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getSalesReport(req.query);
  res.json(report);
});

export const getPurchaseReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getPurchaseReport(req.query);
  res.json(report);
});

export const getInventoryReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getInventoryReport(req.query);
  res.json(report);
});

export const getReceivablesReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getReceivablesReport(req.query);
  res.json(report);
});

export const getPayablesReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getPayablesReport(req.query);
  res.json(report);
});