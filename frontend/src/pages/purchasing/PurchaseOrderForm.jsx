import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { get, post, put } from '../../lib/api'
import { cn, isoDay, todayISO } from '../../lib/utils'
import { formatCurrency, formatNumber } from '../../lib/format'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card, CardBody, CardFooter, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { Checkbox, FormGrid, Input, Select, Textarea } from '../../components/ui/Form'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'

const EMPTY_LINE = {
  product_id: '',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  tax_rate: 0,
}

const emptyForm = () => ({
  supplier_id: '',
  warehouse_id: '',
  order_date: todayISO(),
  expected_date: isoDay(14),
  discount_type: 'fixed',
  discount_value: 0,
  shipping: 0,
  notes: '',
  reference: '',
  status: 'draft',
  items: [{ ...EMPTY_LINE }],
})

function lineTotals(line) {
  const quantity = Number(line.quantity) || 0
  const unitPrice = Number(line.unit_price) || 0
  const discount = Number(line.discount) || 0
  const taxRate = Number(line.tax_rate) || 0
  const subtotal = quantity * unitPrice - discount
  const tax = (subtotal * taxRate) / 100

  return { subtotal, tax, total: subtotal + tax }
}

function orderTotals(items, discountType, discountValue, shipping) {
  const lines = items.map(lineTotals)
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0)
  const taxTotal = lines.reduce((sum, line) => sum + line.tax, 0)
  const rawDiscount = Number(discountValue) || 0
  const discountAmount = discountType === 'percent' ? (subtotal * rawDiscount) / 100 : Math.min(rawDiscount, subtotal)
  const shippingAmount = Number(shipping) || 0

  return {
    subtotal,
    discountAmount,
    taxTotal,
    shipping: shippingAmount,
    grandTotal: subtotal - discountAmount + taxTotal + shippingAmount,
  }
}

function TotalsBlock({ subtotal, discount, tax, shipping, grandTotal, extra = [] }) {
  return (
    <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-slate-500">Subtotal</dt>
        <dd className="tabular font-medium text-slate-700">{formatCurrency(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Discount</dt>
          <dd className="tabular font-medium text-emerald-600">-{formatCurrency(discount)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <dt className="text-slate-500">Tax</dt>
        <dd className="tabular font-medium text-slate-700">{formatCurrency(tax)}</dd>
      </div>
      {shipping > 0 && (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Shipping</dt>
          <dd className="tabular font-medium text-slate-700">{formatCurrency(shipping)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
        <dt className="text-base font-semibold text-slate-900">Grand total</dt>
        <dd className="tabular text-base font-bold text-slate-900">{formatCurrency(grandTotal)}</dd>
      </div>
      {extra.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">{row.label}</dt>
          <dd className={cn('tabular font-semibold', row.tone ?? 'text-slate-700')}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function PurchaseOrderForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const isEdit = Boolean(id)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [lineError, setLineError] = useState(null)
  const [placeNow, setPlaceNow] = useState(false)

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['purchase-orders', 'detail', id],
    queryFn: () => get(`purchase-orders/${id}`).then((response) => response.data),
    enabled: isEdit,
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => get('suppliers', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => get('products', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  useEffect(() => {
    if (!order) return

    setForm({
      supplier_id: order.supplier_id ?? '',
      warehouse_id: order.warehouse_id ?? '',
      order_date: order.order_date ?? todayISO(),
      expected_date: order.expected_date ?? '',
      discount_type: order.discount_type ?? 'fixed',
      discount_value: Number(order.discount_value ?? 0),
      shipping: Number(order.shipping ?? 0),
      notes: order.notes ?? '',
      reference: order.reference ?? '',
      status: order.status ?? 'draft',
      items: (order.items ?? []).map((item) => ({
        product_id: item.product_id ?? '',
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        discount: Number(item.discount ?? 0),
        tax_rate: Number(item.tax_rate ?? 0),
      })),
    })
  }, [order])

  const readOnly = isEdit && order && order.status !== 'draft'

  const totals = useMemo(
    () => orderTotals(form.items, form.discount_type, form.discount_value, form.shipping),
    [form.items, form.discount_type, form.discount_value, form.shipping],
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? put(`purchase-orders/${id}`, payload) : post('purchase-orders', payload)),
    onSuccess: (response) => {
      invalidate()
      toast.success(response?.data?.message || (isEdit ? 'Purchase order updated.' : 'Purchase order created.'))
      navigate('/purchase-orders')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message || 'Unable to save the purchase order.')
      toast.error(err?.message || 'Unable to save the purchase order.')
    },
  })

  const setField = (field, value) => setForm((state) => ({ ...state, [field]: value }))

  const setItem = (index, patch) =>
    setForm((state) => ({
      ...state,
      items: state.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }))

  const selectProduct = (index, productId) => {
    const product = (productsData ?? []).find((entry) => String(entry.id) === String(productId))

    setItem(index, {
      product_id: productId,
      unit_price: product ? Number(product.cost_price ?? 0) : 0,
      tax_rate: product ? Number(product.tax_rate ?? 0) : 0,
    })
  }

  const addLine = () => setForm((state) => ({ ...state, items: [...state.items, { ...EMPTY_LINE }] }))

  const removeLine = (index) =>
    setForm((state) => ({
      ...state,
      items: state.items.length === 1 ? [{ ...EMPTY_LINE }] : state.items.filter((_, itemIndex) => itemIndex !== index),
    }))

  const findDuplicates = () => {
    const seen = new Set()
    const duplicates = []

    form.items.forEach((line) => {
      if (!line.product_id) return

      if (seen.has(String(line.product_id))) {
        const product = (productsData ?? []).find((entry) => String(entry.id) === String(line.product_id))
        duplicates.push(product?.name ?? `product #${line.product_id}`)
      }

      seen.add(String(line.product_id))
    })

    return duplicates
  }

  const handleSubmit = (status) => {
    const duplicates = findDuplicates()

    if (duplicates.length) {
      setLineError(`Duplicate lines found for ${duplicates.join(', ')}. Merge them into a single line.`)
      return
    }

    if (form.items.some((line) => !line.product_id || !(Number(line.quantity) > 0))) {
      setLineError('Every line needs a product and a quantity greater than zero.')
      return
    }

    setLineError(null)
    setErrors({})
    setFormError(null)

    const payload = {
      supplier_id: Number(form.supplier_id) || null,
      warehouse_id: Number(form.warehouse_id) || null,
      order_date: form.order_date || todayISO(),
      expected_date: form.expected_date || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      shipping: Number(form.shipping) || 0,
      notes: form.notes || null,
      reference: form.reference || null,
      status,
      items: form.items.map((line) => ({
        product_id: Number(line.product_id),
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price) || 0,
        discount: Number(line.discount) || 0,
        tax_rate: Number(line.tax_rate) || 0,
        description: null,
      })),
    }

    saveMutation.mutate(payload)
  }

  const supplierOptions = (suppliersData ?? []).map((supplier) => ({ value: supplier.id, label: supplier.name }))
  const warehouseOptions = (warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))
  const productOptions = (productsData ?? []).map((product) => ({
    value: product.id,
    label: `${product.code} · ${product.name}`,
  }))

  const title = isEdit ? `Edit ${order?.number ?? 'purchase order'}` : 'New purchase order'

  if (isEdit && isLoading) return <LoadingState label="Loading purchase order…" />
  if (isEdit && isError) return <ErrorState error={error} onRetry={() => navigate('/purchase-orders')} />

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subtitle={isEdit ? 'Draft orders can be edited until they are placed.' : 'Raise a purchase order for a supplier.'}
        actions={
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
            <ArrowLeft className="h-4 w-4" /> Back to purchase orders
          </Button>
        }
      />

      {readOnly && (
        <Alert tone="warning" title="This order is read-only">
          Only draft orders can be edited. This order is {order.status}, so it can no longer be changed.
        </Alert>
      )}

      {(formError || lineError) && (
        <Alert tone="error" onDismiss={() => { setFormError(null); setLineError(null) }}>
          {formError || lineError}
        </Alert>
      )}

      {Array.isArray(errors.items) && <Alert tone="error">{errors.items[0]}</Alert>}

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit(placeNow && can('purchases.create') ? 'ordered' : 'draft')
        }}
      >
        <Card>
          <CardHeader title="Order details" subtitle="Supplier, dates and header level discounts" />
          <CardBody className="space-y-4">
            <FormGrid>
              <Select
                label="Supplier"
                required
                placeholder="Select supplier"
                options={supplierOptions}
                value={form.supplier_id}
                error={errors.supplier_id?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('supplier_id', event.target.value)}
              />
              <Select
                label="Warehouse"
                placeholder="Default warehouse"
                options={warehouseOptions}
                value={form.warehouse_id}
                error={errors.warehouse_id?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('warehouse_id', event.target.value)}
              />
              <Input
                label="Order date"
                type="date"
                value={form.order_date}
                error={errors.order_date?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('order_date', event.target.value)}
              />
              <Input
                label="Expected date"
                type="date"
                value={form.expected_date}
                error={errors.expected_date?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('expected_date', event.target.value)}
              />
            </FormGrid>

            <FormGrid columns={3}>
              <Select
                label="Discount type"
                options={[
                  { value: 'fixed', label: 'Fixed amount' },
                  { value: 'percent', label: 'Percent' },
                ]}
                value={form.discount_type}
                error={errors.discount_type?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('discount_type', event.target.value)}
              />
              <Input
                label={form.discount_type === 'percent' ? 'Discount (%)' : 'Discount amount'}
                type="number"
                step="0.01"
                min="0"
                value={form.discount_value}
                error={errors.discount_value?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('discount_value', event.target.value)}
              />
              <Input
                label="Shipping"
                type="number"
                step="0.01"
                min="0"
                value={form.shipping}
                error={errors.shipping?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('shipping', event.target.value)}
              />
            </FormGrid>

            <FormGrid>
              <Input
                label="Reference"
                value={form.reference}
                error={errors.reference?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('reference', event.target.value)}
              />
              <Textarea
                label="Notes"
                rows={2}
                value={form.notes}
                error={errors.notes?.[0]}
                disabled={readOnly}
                onChange={(event) => setField('notes', event.target.value)}
              />
            </FormGrid>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Line items"
            subtitle={`${form.items.length} line${form.items.length === 1 ? '' : 's'}`}
            actions={
              !readOnly && (
                <Button variant="secondary" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4" /> Add line
                </Button>
              )
            }
          />
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="min-w-[18rem]">Product</th>
                  <th className="w-24 text-right">Qty</th>
                  <th className="w-32 text-right">Unit price</th>
                  <th className="w-32 text-right">Discount</th>
                  <th className="w-24 text-right">Tax %</th>
                  <th className="w-40 text-right">Line total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {form.items.map((line, index) => {
                  const lineSum = lineTotals(line)

                  return (
                    <tr key={index}>
                      <td>
                        <Select
                          aria-label="Product"
                          placeholder="Select product"
                          options={productOptions}
                          value={line.product_id}
                          disabled={readOnly}
                          onChange={(event) => selectProduct(index, event.target.value)}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Quantity"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={line.quantity}
                          disabled={readOnly}
                          onChange={(event) => setItem(index, { quantity: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Unit price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unit_price}
                          disabled={readOnly}
                          onChange={(event) => setItem(index, { unit_price: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Discount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.discount}
                          disabled={readOnly}
                          onChange={(event) => setItem(index, { discount: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          aria-label="Tax rate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.tax_rate}
                          disabled={readOnly}
                          onChange={(event) => setItem(index, { tax_rate: event.target.value })}
                        />
                      </td>
                      <td className="text-right">
                        <p className="tabular font-semibold text-slate-800">{formatCurrency(lineSum.total)}</p>
                        <p className="tabular text-[11px] text-slate-400">
                          tax {formatCurrency(lineSum.tax)} · base {formatCurrency(lineSum.subtotal)}
                        </p>
                      </td>
                      <td>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <CardFooter>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <p className="text-xs text-slate-500">
                Line subtotal = qty × price − discount, tax = subtotal × rate. Order discount is applied on the
                subtotal before shipping.
              </p>
              <TotalsBlock
                subtotal={totals.subtotal}
                discount={totals.discountAmount}
                tax={totals.taxTotal}
                shipping={totals.shipping}
                grandTotal={totals.grandTotal}
                extra={[{ label: 'Lines', value: formatNumber(form.items.length, 0) }]}
              />
            </div>
          </CardFooter>
        </Card>

        {!readOnly && (
          <Card>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3">
              {!isEdit && can('purchases.create') ? (
                <Checkbox
                  label="Save and place the order immediately"
                  checked={placeNow}
                  onChange={(event) => setPlaceNow(event.target.checked)}
                />
              ) : (
                <p className="text-xs text-slate-500">Saving keeps the order as a draft.</p>
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
                  Cancel
                </Button>
                <Button type="submit" loading={saveMutation.isPending}>
                  <Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Save draft'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </div>
  )
}