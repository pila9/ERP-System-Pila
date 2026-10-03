const LABELS = {
  order_status: {
    draft: 'Draft',
    confirmed: 'Confirmed',
    invoiced: 'Invoiced',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
  },
  invoice_status: {
    draft: 'Draft',
    sent: 'Sent',
    partial: 'Partly paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  },
  purchase_status: {
    draft: 'Draft',
    ordered: 'Ordered',
    partial: 'Partly received',
    received: 'Received',
    cancelled: 'Cancelled',
  },
  movement_type: {
    in: 'Stock in',
    out: 'Stock out',
    adjustment: 'Adjustment',
    transfer_in: 'Transfer in',
    transfer_out: 'Transfer out',
  },
  stock_status: {
    in_stock: 'In stock',
    low: 'Low stock',
    out_of_stock: 'Out of stock',
    not_tracked: 'Not tracked',
  },
  payment_method: {
    cash: 'Cash',
    bank_transfer: 'Bank transfer',
    card: 'Card',
    cheque: 'Cheque',
    credit: 'Credit',
    other: 'Other',
  },
}

export const SALES_ORDER_STATUSES = Object.keys(LABELS.order_status)
export const INVOICE_STATUSES = Object.keys(LABELS.invoice_status)
export const PURCHASE_ORDER_STATUSES = Object.keys(LABELS.purchase_status)
export const MOVEMENT_TYPES = Object.keys(LABELS.movement_type)
export const PAYMENT_METHODS = Object.keys(LABELS.payment_method)

export function label(group, value) {
  return LABELS[group]?.[value] ?? value ?? '-'
}

/** Tailwind classes per semantic status. */
export function badgeTone(group, value) {
  const tones = {
    order_status: {
      draft: 'bg-slate-100 text-slate-700 ring-slate-200',
      confirmed: 'bg-sky-50 text-sky-700 ring-sky-200',
      invoiced: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
      shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
      completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
    },
    invoice_status: {
      draft: 'bg-slate-100 text-slate-700 ring-slate-200',
      sent: 'bg-sky-50 text-sky-700 ring-sky-200',
      partial: 'bg-amber-50 text-amber-700 ring-amber-200',
      paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
      cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
    },
    purchase_status: {
      draft: 'bg-slate-100 text-slate-700 ring-slate-200',
      ordered: 'bg-sky-50 text-sky-700 ring-sky-200',
      partial: 'bg-amber-50 text-amber-700 ring-amber-200',
      received: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
    },
    movement_type: {
      in: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      out: 'bg-rose-50 text-rose-700 ring-rose-200',
      adjustment: 'bg-amber-50 text-amber-700 ring-amber-200',
      transfer_in: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      transfer_out: 'bg-sky-50 text-sky-700 ring-sky-200',
    },
    stock_status: {
      in_stock: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      low: 'bg-amber-50 text-amber-700 ring-amber-200',
      out_of_stock: 'bg-rose-50 text-rose-700 ring-rose-200',
      not_tracked: 'bg-slate-100 text-slate-600 ring-slate-200',
    },
    payment_method: {
      cash: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      bank_transfer: 'bg-sky-50 text-sky-700 ring-sky-200',
      card: 'bg-violet-50 text-violet-700 ring-violet-200',
      cheque: 'bg-amber-50 text-amber-700 ring-amber-200',
      credit: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
      other: 'bg-slate-100 text-slate-600 ring-slate-200',
    },
  }

  return tones[group]?.[value] ?? 'bg-slate-100 text-slate-700 ring-slate-200'
}