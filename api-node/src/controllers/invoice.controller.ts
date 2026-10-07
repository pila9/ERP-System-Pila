import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { invoiceService } from '../services/invoice.service.js';
import { createInvoiceSchema, updateInvoiceSchema, createPaymentSchema } from '../validators/invoice.validators';

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const result = await invoiceService.getAll(req.query);
  res.json(result);
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getById(req.params.id);
  res.json(invoice);
});

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = createInvoiceSchema.parse(req.body);
  const invoice = await invoiceService.create(data, user.id);
  res.status(201).json(invoice);
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data = updateInvoiceSchema.parse(req.body);
  const invoice = await invoiceService.update(req.params.id, data);
  res.json(invoice);
});

export const updateInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const invoice = await invoiceService.updateStatus(req.params.id, status);
  res.json(invoice);
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = createPaymentSchema.parse(req.body);
  const payment = await invoiceService.addPayment(req.params.id, data, user.id);
  res.status(201).json(payment);
});

export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  await invoiceService.delete(req.params.id);
  res.status(204).send();
});