# ERP API Contract

Base URL: `/api` (relative, so the SPA works same-origin behind nginx).
Auth: **Sanctum bearer token**. Send `Authorization: Bearer <token>` on every request except login.

All list endpoints accept these query params:

| Param | Type | Notes |
|---|---|---|
| `page` | int | 1-based page number |
| `per_page` | int | default 15, max 100 |
| `search` | string | free text (meaning depends on the endpoint) |
| `from` / `to` | `YYYY-MM-DD` | date range on the document date |
| `is_active` | `1`/`0` | boolean filter |
| `sort` + `direction` | string | `asc` / `desc` |

List responses are **Laravel resources**:

```json
{
  "data": [ ...items ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "...", "current": "..." },
  "meta": { "current_page": 1, "last_page": 4, "from": 1, "to": 15, "total": 58, "path": "..." }
}
```

Feed the whole object into `<Pagination meta={res.meta} links={res.links} onPageChange={setPage} />`.

Single-resource responses: the resource object **with an extra `message` key** when the
endpoint performs an action (e.g. `SalesOrderResource::make(...)->additional(['message' => ...])`),
or `{ "message": "..." }` for deletes.

Errors:

```json
{ "message": "Not enough stock for X in Main Warehouse.", "errors": { "stock": "..." } }
```

Status codes: `401` unauthenticated, `403` missing permission, `404` not found,
`422` validation / business rule (also uses `errors` for field level messages).

Endpoints that return a **plain object** (not a resource list) return `{ "data": { ... } }`:
`auth/login`, `auth/me`, `dashboard`, `stock/summary`, `stock/adjustments`, `stock/transfers`,
`reports/*`, `roles/permissions`, `invoices/{id}/print`.

---

## Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{email, password, device_name?}` | `{message, token, user}` |
| GET | `/auth/me` | - | `{data: user, permissions: [...], is_admin: bool}` |
| POST | `/auth/logout` | - | `{message}` (deletes current token) |
| POST | `/auth/logout-all` | - | `{message}` |
| PUT | `/auth/profile` | `{name?, email?, phone?}` | `{message, data: user}` |
| PUT | `/auth/password` | `{current_password, password, password_confirmation}` | `{message}` |

## Dashboard

`GET /dashboard?from&to` → `{data: {...}}`

```jsonc
{
  "period": { "from": "2026-10-01", "to": "2026-10-31" },
  "kpis": {
    "sales_total": 123456.78, "sales_change_percent": 12.4,
    "invoiced_total": 0, "cash_collected": 0, "cash_change_percent": 0,
    "stock_value": 0, "receivable": 0, "payable": 0,
    "open_sales_orders": 0, "open_invoices": 0, "open_purchase_orders": 0,
    "products_count": 0, "active_products_count": 0,
    "customers_count": 0, "active_customers_count": 0,
    "suppliers_count": 0, "users_count": 0,
    "low_stock_count": 0, "out_of_stock_count": 0, "stock_movements_today": 0
  },
  "sales_trend": [{ "period": "2026-05", "label": "May 2026", "total": 0, "orders": 0 }],
  "top_products": [{ "id": 1, "name": "…", "quantity": 0, "revenue": 0 }],
  "low_stock": [{ "id": 1, "code": "PRD-00001", "name": "…", "category": "…", "total_stock": 0, "reorder_level": 0, "stock_status": "low" }],
  "recent_orders": [{ "id": 1, "number": "SO-2026-0001", "customer": "…", "status": "draft", "grand_total": 0, "order_date": "2026-10-01" }],
  "recent_payments": [{ "id": 1, "number": "PAY-2026-0001", "customer": "…", "amount": 0, "method": "cash", "paid_at": "ISO8601" }],
  "order_status_breakdown": [{ "status": "draft", "count": 0, "amount": 0 }]
}
```

## Catalogue

### Products `GET/POST /products`, `GET/PUT/DELETE /products/{id}`

Query filters: `category_id`, `unit_id`, `stock_status` (`in_stock|low|out_of_stock`), `is_active`, `sort`, `direction`.

Create/update body:

```jsonc
{
  "code": "PRD-00019",            // optional, auto-generated
  "sku": "LAP-U14-001",
  "barcode": "8901234500011",
  "name": "ProBook 14\" Ultrabook",
  "description": null,
  "category_id": 1,
  "unit_id": 1,
  "cost_price": 720,
  "sale_price": 1099,
  "tax_rate": 10,
  "track_inventory": true,
  "reorder_level": 10,
  "reorder_quantity": 20,
  "is_active": true,
  // create only:
  "opening_quantity": 45,
  "warehouse_id": 1
}
```

Item shape: `{id, code, sku, barcode, name, description, category_id, category{id,name,code},
unit_id, unit{id,name,abbreviation}, cost_price, sale_price, tax_rate, track_inventory,
reorder_level, reorder_quantity, is_active, total_stock, stock_value, stock_status
(in_stock|low|out_of_stock|not_tracked), margin_percent, created_at, updated_at}`

### Categories `GET/POST /categories`, `GET/PUT/DELETE /categories/{id}`

Body: `{name, code?, parent_id?, description?, is_active?}` — never delete a category with
products or children (422).

Item: `{id, code, name, parent_id, parent{id,name}|null, description, is_active, products_count}`

### Units `GET/POST /units`, `PUT/DELETE /units/{id}`

Body: `{name, abbreviation, description?, is_active?}`
Item: `{id, name, abbreviation, description, is_active, products_count}`

### Warehouses `GET/POST /warehouses`, `GET/PUT/DELETE /warehouses/{id}`

Body: `{code, name, address?, city?, country?, phone?, manager?, is_default?, is_active?}`
Item: `{id, code, name, address, city, country, phone, manager, is_default, is_active,
total_quantity, total_value, products_count}`

## Inventory

| Method | Path | Notes |
|---|---|---|
| GET | `/stock/levels` | filters: `product_id`, `warehouse_id`, `search`, `low_only` |
| GET | `/stock/summary` | `{data:{total_skus, tracked_skus, total_quantity, total_value, retail_value, low_stock_count, out_of_stock_count, reserved_quantity}}` |
| GET | `/stock/low` | paginated **products** at/below reorder level; filters: `search`, `category_id`, `warehouse_id` |
| GET | `/stock/movements` | filters: `type`, `product_id`, `warehouse_id`, `from`, `to` |
| POST | `/stock/adjustments` | `{product_id, warehouse_id, quantity, note?}` → `{data: movement}` |
| POST | `/stock/transfers` | `{product_id, from_warehouse_id, to_warehouse_id, quantity, note?}` → `{data:{out, in}}` |

`stock/levels` item:
`{id, product_id, product{id,code,name,sku,cost_price,sale_price,reorder_level,track_inventory},
warehouse_id, warehouse{id,code,name}, quantity, reserved_quantity, available_quantity, value, is_low}`

`stock/movements` item:
`{id, number, product_id, product, warehouse_id, warehouse, to_warehouse_id, to_warehouse,
type (in|out|adjustment|transfer_in|transfer_out), quantity, unit_cost, balance_after,
reference_type, reference_id, note, user, created_at}`

## Customers / Suppliers

`GET/POST /customers`, `GET/PUT/DELETE /customers/{id}`

Customer body:
`{code?, name, company?, email?, phone?, tax_number?, address?, city?, state?, country?,
postal_code?, credit_limit?, payment_terms_days?, notes?, is_active?}`

Customer item adds: `balance` (outstanding, invoiced − paid), `sales_orders_count`,
`invoices_count`, `total_invoiced?`

Supplier body: `{code?, name, company?, email?, phone?, tax_number?, address?, city?, state?,
country?, postal_code?, payment_terms_days?, bank_name?, bank_account?, notes?, is_active?}`
Item adds `purchase_orders_count`.

## Sales orders

| Method | Path | Notes |
|---|---|---|
| GET | `/sales-orders` | filters: `status`, `customer_id`, `user_id`, `warehouse_id`, `from`, `to`, `search`, `min_total`, `max_total` |
| POST | `/sales-orders` | body below; `status: "confirmed"` confirms immediately |
| GET | `/sales-orders/{id}` | includes `items`, `invoice` |
| PUT | `/sales-orders/{id}` | **draft only** |
| DELETE | `/sales-orders/{id}` | **draft only** |
| POST | `/sales-orders/{id}/confirm` | draft → confirmed, **reserves stock**, fails with 422 if short |
| POST | `/sales-orders/{id}/ship` | confirmed → shipped, **deducts stock** |
| POST | `/sales-orders/{id}/complete` | shipped/invoiced → completed |
| POST | `/sales-orders/{id}/cancel` | releases the reservation |
| POST | `/sales-orders/{id}/invoice` | creates an invoice from un-invoiced lines → 201 |

Statuses: `draft, confirmed, invoiced, shipped, completed, cancelled`.

```jsonc
{
  "customer_id": 1,
  "warehouse_id": 1,
  "order_date": "2026-10-01",
  "expected_date": "2026-10-15",
  "discount_type": "fixed",          // or "percent"
  "discount_value": 0,
  "shipping": 0,
  "notes": null, "terms": null, "reference": null,
  "status": "draft",
  "items": [
    {
      "product_id": 1,
      "warehouse_id": 1,
      "quantity": 2,
      "unit_price": 1099,
      "discount": 0,
      "tax_rate": 10,
      "description": null
    }
  ]
}
```

Item: `{id, product_id, product, description, warehouse_id, warehouse, quantity,
fulfilled_quantity, remaining_quantity, unit_price, unit_cost, discount, tax_rate,
subtotal, tax_amount, total}`

Order: id, number (`SO-2026-0001`), customer, user, warehouse, order_date, expected_date,
status, discount_type/value/amount, subtotal, tax_total, shipping, grand_total,
paid_amount, balance_due, notes, terms, reference, confirmed_at, shipped_at,
completed_at, cancelled_at, items, items_count, invoice, created_at, updated_at.

## Invoices

| Method | Path | Notes |
|---|---|---|
| GET | `/invoices` | filters: `status`, `customer_id`, `sales_order_id`, `outstanding=1`, `from`, `to` |
| POST | `/invoices` | standalone invoice: `{customer_id, invoice_date?, due_date?, discount_type?, discount_value?, shipping?, notes?, terms?, status?, items:[{product_id?, description?, quantity, unit_price, discount?, tax_rate?}]}` |
| GET | `/invoices/{id}` | includes `items` + `payments` |
| PUT | `/invoices/{id}` | **draft only** |
| DELETE | `/invoices/{id}` | **draft only** |
| GET | `/invoices/{id}/print` | `{data:{invoice, company:{name,currency,symbol}, generated_at}}` |
| POST | `/invoices/{id}/send` | draft → sent |
| POST | `/invoices/{id}/cancel` | 422 if payments exist; returns shipped goods to stock |
| POST | `/invoices/{id}/payments` | `{amount, method, paid_at?, reference?, note?}` → 201 Payment |

Statuses: `draft, sent, partial, paid, overdue, cancelled` (auto-synced on payment).

Payment item: `{id, number (PAY-2026-0001), invoice_id, invoice{id,number,grand_total,balance_due},
customer_id, customer, amount, paid_at, method (cash|bank_transfer|card|cheque|credit|other),
reference, note, user, created_at}`

Invoice item: `{id, product_id, product, description, quantity, unit_price, discount,
tax_rate, subtotal, tax_amount, total}`

Invoice also exposes `days_overdue`, `balance_due`, `paid_amount`, `grand_total`,
`sales_order{id,number,status}`, `customer` (with address/tax_number for printing).

## Payments

`GET /payments` (filters `from`, `to`, `customer_id`, `invoice_id`, `method`, `search`),
`GET /payments/{id}`, `DELETE /payments/{id}` (reverses and deletes).

## Purchase orders

| Method | Path | Notes |
|---|---|---|
| GET | `/purchase-orders` | filters: `status`, `supplier_id`, `warehouse_id`, `from`, `to`, `search` |
| POST | `/purchase-orders` | `status: "ordered"` places it immediately |
| GET/PUT/DELETE | `/purchase-orders/{id}` | PUT/DELETE **draft only** |
| POST | `/purchase-orders/{id}/place` | draft → ordered |
| POST | `/purchase-orders/{id}/receive` | `{items:[{item_id, quantity}]}` → increases stock + moving-average cost |
| POST | `/purchase-orders/{id}/cancel` | draft/ordered only |

Statuses: `draft, ordered, partial, received, cancelled`.

Body mirrors sales orders but uses `supplier_id` and items of
`{product_id, quantity, unit_price?, discount?, tax_rate?, description?}`.

Item adds `received_quantity`, `remaining_quantity`, `unit_cost`.

## Reports (all `{data: ...}`)

| Path | Payload |
|---|---|
| `GET /reports/sales-summary?from&to` | `{period, totals{orders_count,sales_total,average_order_value,cancelled_total,invoiced_total,collected_total,outstanding_total}, by_status[], trend[{day,label,total,orders}], by_customer[], by_product[]}` |
| `GET /reports/sales-by-customer` | `{period, rows[{customer_id,code,name,orders_count,total,average_order_value}]}` |
| `GET /reports/top-products` | `{period, rows[{product_id,code,name,quantity,revenue,cost,profit,margin_percent}]}` |
| `GET /reports/stock-valuation` | `{totals{lines,quantity,cost_value,retail_value,potential_profit}, rows[{product_id,code,name,category,warehouse,quantity,cost_price,sale_price,reorder_level,cost_value,retail_value,potential_profit,is_low}]}` |
| `GET /reports/low-stock` | `{totals{count,out_of_stock,estimated_reorder_cost}, rows[{id,code,name,category,quantity,reorder_level,reorder_quantity,status,estimated_cost}]}` |
| `GET /reports/receivables` | `{totals{outstanding,overdue,invoices_count}, buckets{current,'1-30','31-60','61-90','90+'}, top_debtors[], rows[{invoice_id,number,customer,customer_id,invoice_date,due_date,status,grand_total,paid_amount,balance_due,days_overdue,bucket}]}` |
| `GET /reports/payables` | `{period, totals{suppliers_count,purchases_total,balance}, rows[{supplier_id,code,name,orders_count,total,paid,balance}]}` |
| `GET /reports/stock-movements` | `{period, by_type[{type,movements,quantity,value}], totals{stock_value,stock_quantity,reserved_quantity,movements}}` |
| `GET /reports/profit-loss` | `{period, lines[{label,amount,type}], totals{net_sales,cogs,gross_profit,margin_percent}}` |

## Administration

`GET/POST /users`, `GET/PUT/DELETE /users/{id}` — body `{name, email, password?, role_id, phone?, is_active?}`
User item: `{id, code, name, email, phone, is_active, last_login_at, role{id,name,slug,permissions}, role_id, created_at}`

`GET /roles` → `{data:[{id,name,slug,description,permissions,is_system,users_count}], meta, links}`
`GET /roles/permissions` → `{data:{modules:{module:Label}, grouped:{module:[permission]}, all:[...]}}`
`POST /roles` — `{name, slug, description?, permissions:[...]}` (slug `alpha_dash`)
`PUT /roles/{id}` — system roles reject permission changes (422)

---

## Permission catalogue

Permissions are `module.action`; a role may hold `*` or `module.*`.

`products.{view,create,update,delete,manage,import,export}`,
`categories.{view,create,update,delete,manage}`,
`warehouses.{view,create,update,delete,manage}`,
`stock.{view,create,update,delete,manage,adjust,transfer}`,
`customers.{…}`, `suppliers.{…}`,
`sales.{view,create,update,delete,manage,confirm,ship,complete}`,
`invoices.{view,create,update,delete,manage,payment,send}`,
`purchases.{view,create,update,delete,manage,receive,approve}`,
`reports.view`, `users.manage`, `roles.manage`

Gate the UI with `const can = usePermission()` then `can('sales.create')`.