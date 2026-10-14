# ERP System

A full-stack ERP built with **React + Tailwind CSS** (SPA), **Node.js/Express + Prisma** (API) and **PostgreSQL**, running entirely in **Docker**.

```
┌────────────┐   /api (nginx proxy)   ┌──────────────┐        ┌─────────┐
│  React SPA │ ────────────────────► │  Node.js API │ ─────► │PostgreSQL │
│  (nginx)   │                       │   express    │        │         │
└────────────┘                       └──────────────┘        └─────────┘
```

## Modules

| Area | Features |
|---|---|
| **Auth & RBAC** | JWT token auth, 7 system roles, granular `module.action` permissions, account activation, self-service profile + password |
| **Dashboard** | Sales/cash KPIs with period-over-period change, 6-month trend, top products, order status split, low-stock, recent orders & payments |
| **Catalogue** | Products (SKU, barcode, cost/price/tax, reorder level, margin), nested categories, units of measure, warehouses |
| **Inventory** | Multi-warehouse stock levels, full movement audit trail, manual adjustments, inter-warehouse transfers, low-stock alerts |
| **Sales** | Customers, sales orders with line editor, workflow `draft → confirmed → shipped → invoiced → completed` with stock reservation/consumption, discount & tax calculation |
| **Invoicing** | Invoices generated from sales orders or standalone, part/overdue status auto-sync, payment recording by method, printable invoice document, payment reversal |
| **Purchasing** | Suppliers, purchase orders `draft → ordered → partial → received`, goods receipts that increase stock and recalculate moving-average cost |
| **Reports** | Sales summary, top products, sales by customer, stock valuation, low stock, AR aging, AP by supplier, movement summary, profit & loss estimate, CSV export |
| **Administration** | User CRUD with roles, role editor with a full permission matrix |

## Requirements

- Docker Desktop (or Docker Engine + Compose v2)
- ~4 GB free RAM

No local PHP, Composer, MySQL or Node.js needed.

## Quick start

```bash
cd ERP-systems
make up            # or: docker compose up -d --build
```

Then open **http://localhost:8080**

The API container waits for MySQL, runs migrations and seeds demo data on first boot, so the
login page is usable immediately.

### Demo accounts

Password for every account: `password`

| Email | Role | Can do |
|---|---|---|
| `admin@erp.test` | Administrator | everything |
| `manager@erp.test` | General Manager | all operations, no user/role admin |
| `sales@erp.test` | Sales Manager | customers, sales, invoices, reports |
| `rep@erp.test` | Sales Representative | create and confirm own orders |
| `warehouse@erp.test` | Warehouse / Inventory | warehouses, stock, goods receipts |
| `accountant@erp.test` | Accountant | invoicing, payments, financial reports |
| `viewer@erp.test` | Viewer / Auditor | read-only |

Sign in as a non-admin to see the permission system hide menus, buttons and pages.

## Makefile commands

| Command | Description |
|---|---|
| `make up` | Build images and start db + api + web |
| `make dev` | Start with Vite dev server + HMR on http://localhost:5173 |
| `make down` | Stop containers (keeps the database volume) |
| `make destroy` | Stop containers **and delete all data** |
| `make logs` / `make api-logs` | Tail logs |
| `make migrate` | Run database migrations |
| `make migrate-fresh` | Drop all tables, re-migrate and re-seed demo data |
| `make seed` | Seed demo data |
| `make shell` | Bash shell inside the API container |
| `make test-api` | Run backend test suite |
| `make assets` | Force rebuild of the React production bundle |
| `make build-assets` | Build the frontend locally with Node (no Docker) |
| `make smoke` | Run the end-to-end API smoke test against the running stack |

## Architecture

```
ERP-systems/
├── docker-compose.yml       # db (postgres:16) + api (node:22) + assets + web (nginx) + vite (dev profile)
├── Makefile
├── docs/API.md              # complete REST API contract
├── docker/nginx/default.conf
├── api-node/                # Node.js/Express API
│   ├── Dockerfile           # installs node deps, builds TS, runs prisma
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── controllers/     # one controller per module
│   │   ├── middleware/      # auth, validation, error handling
│   │   ├── services/        # business logic layer
│   │   ├── routes/          # route definitions
│   │   ├── validators/      # input validation schemas
│   │   └── utils/           # prisma client wrapper
│   ├── prisma/              # Prisma schema and seed
│   │   ├── schema.prisma    # database schema
│   │   └── seed.ts          # demo data seeder
└── frontend/                # React 18 + Vite + Tailwind
    └── src/
        ├── lib/              # axios client, formatting, status maps, utils
        ├── context/          # AuthContext (session + permissions), ToastContext
        ├── components/ui/    # Button, Card, Form, Modal, Table bits, Pagination, Dropdown…
        ├── components/layout/# AppLayout (sidebar shell), ProtectedRoute
        └── pages/            # one folder per module
```

### Key design decisions

- **Stock is a ledger, not a number.** `stock_movements` records every in/out/adjustment/
  transfer with the resulting balance; `stock_levels` is the fast current quantity. Both are
  written inside the same transaction, so the audit trail always reconciles with the balance.
- **State machines are enforced server-side.** Confirming an order reserves stock, shipping
  consumes it, cancelling releases it. Every illegal transition returns a 422 with a readable
  message instead of corrupting data.
- **Totals are always recomputed from line items** (`HasDocumentTotals` trait), never trusted
  from the client, so subtotal/discount/tax/grand total cannot drift.
- **Document numbers are gap-free per year** using a `document_sequences` table locked with
  `SELECT … FOR UPDATE` inside the write transaction.
- **Receiving goods recalculates moving-average cost**, so the profit report stays meaningful.
- **Errors are uniform**: `{ message, errors }` with correct 401/403/404/422 codes, so the SPA
  can always surface a real message.

## API

Full reference: [`docs/API.md`](docs/API.md).

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@erp.test","password":"password"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

curl -s http://localhost:8080/api/dashboard -H "Authorization: Bearer $TOKEN"
```

## Configuration

Copy `.env.example` to `.env` at the repo root to override defaults (only needed if you change ports or credentials):

| Variable | Default |
|---|---|
| `WEB_PORT` | `8080` |
| `VITE_PORT` | `5173` (dev profile) |
| `DB_PORT` | `5432` |
| `POSTGRES_DB` | `erp_db` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |

Backend behaviour knobs live in `api-node/.env.example` (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` …).

## Development workflow

```bash
make dev          # stack + Vite HMR on http://localhost:5173
```

Vite proxies `/api` to the `api-node` container, so the SPA stays same-origin and no CORS setup is
needed. Edits to `api-node/` are reflected immediately in development (using `tsx watch`), so no rebuild is needed.
If you are using the built API (in containers built with `docker compose up --build`), you can restart the API container to pick up changes: `docker compose restart api`.

Frontend-only iteration without Docker:

```bash
cd frontend && npm install && npm run dev   # needs an API reachable at VITE_API_TARGET
```

## Resetting data

```bash
make migrate-fresh   # drops all tables, re-migrates, re-seeds demo data
make destroy         # removes containers and the PostgreSQL volume
```

## Verification

```bash
make up
make smoke
```

`scripts/smoke-test.sh` drives the real API end to end (56 assertions): login and bad-password
handling, dashboard payload, catalogue CRUD with opening stock, stock adjustment + transfer +
ledger, the full sales lifecycle (draft → confirmed → shipped → invoiced → paid) including
partial payments and overpayment rejection, purchasing with partial and final goods receipts
plus stock verification, business-rule rejections (zero quantity, duplicate lines,
over-receipt, unauthenticated access), every report endpoint, and user/role admin.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `api` restarts, "database not reachable" | PostgreSQL needs more time on first boot; `docker compose logs -f db` and restart with `docker compose up -d` |
| App shows the API error page | `docker compose logs -f api` — check `api-node/.env` matches the compose environment |
| Blank page after a frontend change | `make assets` to rebuild `frontend/dist`, then hard-reload the browser |
| Port 8080 already in use | `WEB_PORT=9090 docker compose up -d` or edit `.env` |
| Want a clean slate | `make destroy && make up` |