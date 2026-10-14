export const orderStatuses = {
  draft: { label: 'Draft', color: 'default' as const },
  confirmed: { label: 'Confirmed', color: 'info' as const },
  shipped: { label: 'Shipped', color: 'primary' as const },
  completed: { label: 'Completed', color: 'success' as const },
  cancelled: { label: 'Cancelled', color: 'error' as const },
} as const;

export const purchaseOrderStatuses = {
  draft: { label: 'Draft', color: 'default' as const },
  ordered: { label: 'Ordered', color: 'info' as const },
  received: { label: 'Received', color: 'success' as const },
  cancelled: { label: 'Cancelled', color: 'error' as const },
} as const;

export const invoiceStatuses = {
  draft: { label: 'Draft', color: 'default' as const },
  sent: { label: 'Sent', color: 'info' as const },
  paid: { label: 'Paid', color: 'success' as const },
  partial: { label: 'Partial', color: 'warning' as const },
  cancelled: { label: 'Cancelled', color: 'error' as const },
} as const;

export const INVOICE_STATUSES = invoiceStatuses;

export const paymentMethods = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  other: 'Other',
} as const;

export const PAYMENT_METHODS = paymentMethods;

export const stockMovementTypes = {
  in: { label: 'In', color: 'success' as const },
  out: { label: 'Out', color: 'error' as const },
  transfer: { label: 'Transfer', color: 'info' as const },
  adjustment: { label: 'Adjustment', color: 'warning' as const },
  return: { label: 'Return', color: 'primary' as const },
} as const;

export function getStatusConfig<T extends Record<string, { label: string; color: string }>>(statuses: T, status: string) {
  return statuses[status as keyof T] || { label: status, color: 'default' as const };
}