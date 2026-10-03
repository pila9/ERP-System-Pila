import { Outlet, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Products from './pages/products/Products'
import Categories from './pages/products/Categories'
import Units from './pages/products/Units'
import Warehouses from './pages/products/Warehouses'
import StockLevels from './pages/inventory/StockLevels'
import StockMovements from './pages/inventory/StockMovements'
import LowStock from './pages/inventory/LowStock'
import Customers from './pages/sales/Customers'
import SalesOrders from './pages/sales/SalesOrders'
import SalesOrderForm from './pages/sales/SalesOrderForm'
import Invoices from './pages/sales/Invoices'
import InvoiceDetail from './pages/sales/InvoiceDetail'
import Suppliers from './pages/purchasing/Suppliers'
import PurchaseOrders from './pages/purchasing/PurchaseOrders'
import PurchaseOrderForm from './pages/purchasing/PurchaseOrderForm'
import Users from './pages/admin/Users'
import Roles from './pages/admin/Roles'
import NotFound from './pages/NotFound'

/** Wrap a page element with a permission check. */
const gate = (element, permission) => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={gate(<Dashboard />, 'reports.view')} />
        <Route path="profile" element={<Profile />} />

        {/* Catalogue */}
        <Route path="products" element={gate(<Products />, 'products.view')} />
        <Route path="categories" element={gate(<Categories />, 'products.view')} />
        <Route path="units" element={gate(<Units />, 'products.view')} />
        <Route path="warehouses" element={gate(<Warehouses />, 'products.view')} />

        {/* Inventory */}
        <Route path="inventory" element={gate(<StockLevels />, 'stock.view')} />
        <Route path="inventory/movements" element={gate(<StockMovements />, 'stock.view')} />
        <Route path="inventory/low-stock" element={gate(<LowStock />, 'stock.view')} />

        {/* Sales */}
        <Route path="customers" element={gate(<Customers />, 'customers.view')} />
        <Route path="sales-orders" element={gate(<SalesOrders />, 'sales.view')} />
        <Route path="sales-orders/new" element={gate(<SalesOrderForm />, 'sales.create')} />
        <Route path="sales-orders/:id/edit" element={gate(<SalesOrderForm />, 'sales.update')} />
        <Route path="invoices" element={gate(<Invoices />, 'invoices.view')} />
        <Route path="invoices/:id" element={gate(<InvoiceDetail />, 'invoices.view')} />

        {/* Purchasing */}
        <Route path="suppliers" element={gate(<Suppliers />, 'suppliers.view')} />
        <Route path="purchase-orders" element={gate(<PurchaseOrders />, 'purchases.view')} />
        <Route path="purchase-orders/new" element={gate(<PurchaseOrderForm />, 'purchases.create')} />
        <Route path="purchase-orders/:id/edit" element={gate(<PurchaseOrderForm />, 'purchases.update')} />

        {/* Administration */}
        <Route path="users" element={gate(<Users />, 'users.manage')} />
        <Route path="roles" element={gate(<Roles />, 'roles.manage')} />

        {/* Reports */}
        <Route path="reports" element={gate(<Reports />, 'reports.view')} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}