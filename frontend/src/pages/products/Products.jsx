import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams, cn } from '../../lib/utils'
import { formatCurrency, formatNumber } from '../../lib/format'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Dropdown from '../../components/ui/Dropdown'
import Pagination from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/Badge'
import { Select, Input, Textarea, Checkbox, FormGrid } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_FORM = {
  code: '',
  sku: '',
  barcode: '',
  name: '',
  description: '',
  category_id: '',
  unit_id: '',
  cost_price: 0,
  sale_price: 0,
  tax_rate: 10,
  track_inventory: true,
  reorder_level: 0,
  reorder_quantity: 0,
  is_active: true,
  opening_quantity: '',
  warehouse_id: '',
}

export default function Products() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ category_id: '', stock_status: '', is_active: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(
    () => cleanParams({ page, search, ...filters, per_page: 15 }),
    [page, search, filters],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['products', params],
    queryFn: () => get('products', params).then((response) => response.data),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => get('categories', { per_page: 100, is_active: 1 }).then((response) => response.data.data),
  })

  const { data: unitsData } = useQuery({
    queryKey: ['units', 'all'],
    queryFn: () => get('units', { per_page: 100 }).then((response) => response.data.data),
  })

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => get('warehouses', { per_page: 100 }).then((response) => response.data.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? put(`products/${editing.id}`, payload) : post('products', payload),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      toast.success(editing ? 'Product updated.' : 'Product created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`products/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Product deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the product.')
      setDeleting(null)
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      code: product.code ?? '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      name: product.name ?? '',
      description: product.description ?? '',
      category_id: product.category_id ?? '',
      unit_id: product.unit_id ?? '',
      cost_price: Number(product.cost_price ?? 0),
      sale_price: Number(product.sale_price ?? 0),
      tax_rate: Number(product.tax_rate ?? 0),
      track_inventory: Boolean(product.track_inventory),
      reorder_level: Number(product.reorder_level ?? 0),
      reorder_quantity: Number(product.reorder_quantity ?? 0),
      is_active: Boolean(product.is_active),
      opening_quantity: '',
      warehouse_id: '',
    })
    setErrors({})
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setErrors({})
    setFormError(null)

    const payload = {
      ...form,
      code: form.code || null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      category_id: form.category_id || null,
      unit_id: form.unit_id || null,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      tax_rate: Number(form.tax_rate) || 0,
      reorder_level: Number(form.reorder_level) || 0,
      reorder_quantity: Number(form.reorder_quantity) || 0,
      track_inventory: Boolean(form.track_inventory),
      is_active: Boolean(form.is_active),
    }

    if (!editing && form.opening_quantity) {
      payload.opening_quantity = Number(form.opening_quantity)
      payload.warehouse_id = form.warehouse_id || null
    }

    saveMutation.mutate(payload)
  }

  const products = data?.data ?? []
  const meta = data?.meta
  const links = data?.links

  const categoryOptions = (categoriesData ?? []).map((category) => ({ value: category.id, label: category.name }))
  const unitOptions = (unitsData ?? []).map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.abbreviation})` }))
  const warehouseOptions = (warehousesData ?? []).map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle={`${meta?.total ?? 0} products in the catalogue`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('products.create') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New product
              </Button>
            )}
          </>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search name, SKU or code…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
          <Select
            className="w-44"
            placeholder="All categories"
            value={filters.category_id}
            options={categoryOptions}
            onChange={(event) => {
              setFilters((state) => ({ ...state, category_id: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-40"
            placeholder="Any stock"
            value={filters.stock_status}
            options={[
              { value: 'in_stock', label: 'In stock' },
              { value: 'low', label: 'Low stock' },
              { value: 'out_of_stock', label: 'Out of stock' },
            ]}
            onChange={(event) => {
              setFilters((state) => ({ ...state, stock_status: event.target.value }))
              setPage(1)
            }}
          />
          <Select
            className="w-36"
            placeholder="Any status"
            value={filters.is_active}
            options={[
              { value: 1, label: 'Active' },
              { value: 0, label: 'Inactive' },
            ]}
            onChange={(event) => {
              setFilters((state) => ({ ...state, is_active: event.target.value }))
              setPage(1)
            }}
          />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Adjust your filters or create the first product."
            action={
              can('products.create') ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New product
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code / SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="whitespace-nowrap">
                      <p className="font-mono text-xs font-semibold text-slate-700">{product.code}</p>
                      <p className="font-mono text-[11px] text-slate-400">{product.sku || '—'}</p>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800">{product.name}</p>
                      {product.unit && (
                        <p className="text-xs text-slate-400">per {product.unit.abbreviation}</p>
                      )}
                    </td>
                    <td className="text-sm text-slate-500">{product.category?.name ?? '—'}</td>
                    <td className="text-right tabular">{formatCurrency(product.cost_price)}</td>
                    <td className="text-right tabular font-medium">{formatCurrency(product.sale_price)}</td>
                    <td className="text-right">
                      {product.track_inventory ? (
                        <span
                          className={cn(
                            'tabular font-semibold',
                            product.stock_status === 'out_of_stock'
                              ? 'text-rose-600'
                              : product.stock_status === 'low'
                                ? 'text-amber-600'
                                : 'text-slate-700',
                          )}
                        >
                          {formatNumber(product.total_stock)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not tracked</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge group="stock_status" value={product.stock_status} />
                        {!product.is_active && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          {
                            label: 'Edit',
                            icon: Pencil,
                            disabled: !can('products.update'),
                            onSelect: () => openEdit(product),
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            tone: 'danger',
                            disabled: !can('products.delete'),
                            onSelect: () => setDeleting(product),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} links={links} onPageChange={setPage} className="border-t border-slate-200" />
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${editing.name}` : 'New product'}
        subtitle={editing ? editing.code : 'Create a product in the catalogue'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input
              label="Product name"
              required
              value={form.name}
              error={errors.name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
            <Input
              label="Code"
              hint="Leave blank to auto-generate"
              value={form.code}
              error={errors.code?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, code: event.target.value }))}
            />
            <Input
              label="SKU"
              value={form.sku}
              error={errors.sku?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, sku: event.target.value }))}
            />
            <Input
              label="Barcode"
              value={form.barcode}
              error={errors.barcode?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, barcode: event.target.value }))}
            />
            <Select
              label="Category"
              placeholder="No category"
              options={categoryOptions}
              value={form.category_id}
              error={errors.category_id?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, category_id: event.target.value }))}
            />
            <Select
              label="Unit of measure"
              placeholder="No unit"
              options={unitOptions}
              value={form.unit_id}
              error={errors.unit_id?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, unit_id: event.target.value }))}
            />
          </FormGrid>

          <FormGrid columns={3}>
            <Input
              label="Cost price"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              error={errors.cost_price?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, cost_price: event.target.value }))}
            />
            <Input
              label="Sale price"
              type="number"
              step="0.01"
              min="0"
              value={form.sale_price}
              error={errors.sale_price?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, sale_price: event.target.value }))}
            />
            <Input
              label="Tax rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.tax_rate}
              error={errors.tax_rate?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, tax_rate: event.target.value }))}
            />
          </FormGrid>

          <FormGrid>
            <Input
              label="Reorder level"
              type="number"
              step="0.01"
              min="0"
              value={form.reorder_level}
              error={errors.reorder_level?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, reorder_level: event.target.value }))}
            />
            <Input
              label="Reorder quantity"
              type="number"
              step="0.01"
              min="0"
              value={form.reorder_quantity}
              error={errors.reorder_quantity?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, reorder_quantity: event.target.value }))}
            />
            {!editing && (
              <>
                <Input
                  label="Opening stock"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  hint="Optional initial quantity"
                  value={form.opening_quantity}
                  error={errors.opening_quantity?.[0]}
                  onChange={(event) => setForm((state) => ({ ...state, opening_quantity: event.target.value }))}
                />
                <Select
                  label="Opening stock warehouse"
                  placeholder="Default warehouse"
                  options={warehouseOptions}
                  value={form.warehouse_id}
                  error={errors.warehouse_id?.[0]}
                  onChange={(event) => setForm((state) => ({ ...state, warehouse_id: event.target.value }))}
                />
              </>
            )}
          </FormGrid>

          <Textarea
            label="Description"
            value={form.description ?? ''}
            error={errors.description?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
          />

          <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-3">
            <Checkbox
              label="Track inventory for this product"
              checked={form.track_inventory}
              onChange={(event) => setForm((state) => ({ ...state, track_inventory: event.target.checked }))}
            />
            <Checkbox
              label="Active"
              checked={form.is_active}
              onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))}
            />
          </div>

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete product"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleting.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <span className="font-semibold">{deleting?.name}</span>? Products used in
          documents cannot be deleted - deactivate them instead.
        </p>
      </Modal>
    </div>
  )
}