import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, MoreVertical, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { del, get, post, put } from '../../lib/api'
import { cleanParams } from '../../lib/utils'
import { usePermission } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/DataDisplay'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Dropdown from '../../components/ui/Dropdown'
import Pagination from '../../components/ui/Pagination'
import { Checkbox, FormGrid, Input, Select, Textarea } from '../../components/ui/Form'
import { SearchInput, Toolbar, ToolbarSpacer } from '../../components/ui/FilterBar'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/Feedback'

const EMPTY_FORM = { name: '', code: '', parent_id: '', description: '', is_active: true }

export default function Categories() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const can = usePermission()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const params = useMemo(() => cleanParams({ page, search, per_page: 20 }), [page, search])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['categories', params],
    queryFn: () => get('categories', params).then((response) => response.data),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? put(`categories/${editing.id}`, payload) : post('categories', payload)),
    onSuccess: () => {
      invalidate()
      closeModal()
      toast.success(editing ? 'Category updated.' : 'Category created.')
    },
    onError: (err) => {
      setErrors(err?.errors || {})
      setFormError(err?.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => del(`categories/${id}`),
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast.success('Category deleted.')
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to delete the category.')
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

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name ?? '',
      code: category.code ?? '',
      parent_id: category.parent_id ?? '',
      description: category.description ?? '',
      is_active: Boolean(category.is_active),
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

  const submit = (event) => {
    event?.preventDefault()
    setErrors({})
    setFormError(null)

    saveMutation.mutate({
      ...form,
      code: form.code || null,
      parent_id: form.parent_id || null,
      is_active: Boolean(form.is_active),
    })
  }

  const categories = data?.data ?? []
  const parentOptions = categories
    .filter((category) => !editing || category.id !== editing.id)
    .map((category) => ({ value: category.id, label: category.name }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        subtitle={`${data?.meta?.total ?? 0} categories`}
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            {can('categories.manage') && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New category
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
            placeholder="Search categories…"
            className="w-full sm:w-72"
          />
          <ToolbarSpacer />
        </Toolbar>

        {isLoading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : categories.length === 0 ? (
          <EmptyState icon={Boxes} title="No categories yet" description="Group products into categories to speed up searching." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Code</th>
                  <th>Parent</th>
                  <th className="text-right">Products</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <p className="font-medium text-slate-800">{category.name}</p>
                      {category.description && (
                        <p className="max-w-md truncate text-xs text-slate-400">{category.description}</p>
                      )}
                    </td>
                    <td className="font-mono text-xs text-slate-500">{category.code || '—'}</td>
                    <td className="text-sm text-slate-500">{category.parent?.name ?? '—'}</td>
                    <td className="text-right tabular">{category.products_count ?? 0}</td>
                    <td>
                      {category.is_active ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge>Inactive</Badge>
                      )}
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
                          { label: 'Edit', icon: Pencil, disabled: !can('categories.manage'), onSelect: () => openEdit(category) },
                          { label: 'Delete', icon: Trash2, tone: 'danger', disabled: !can('categories.manage'), onSelect: () => setDeleting(category) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={data?.meta} links={data?.links} onPageChange={setPage} className="border-t border-slate-200" />
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${editing.name}` : 'New category'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => submit()} loading={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <FormGrid>
            <Input
              label="Name"
              required
              value={form.name}
              error={errors.name?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
            <Input
              label="Code"
              value={form.code}
              error={errors.code?.[0]}
              onChange={(event) => setForm((state) => ({ ...state, code: event.target.value }))}
            />
          </FormGrid>

          <Select
            label="Parent category"
            placeholder="No parent (top level)"
            options={parentOptions}
            value={form.parent_id}
            error={errors.parent_id?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, parent_id: event.target.value }))}
          />

          <Textarea
            label="Description"
            value={form.description ?? ''}
            error={errors.description?.[0]}
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
          />

          <Checkbox
            label="Active"
            checked={form.is_active}
            onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))}
          />

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete category"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold">{deleting?.name}</span>? Categories with products or sub-categories
          cannot be deleted.
        </p>
      </Modal>
    </div>
  )
}