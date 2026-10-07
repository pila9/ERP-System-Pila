import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Sales
import Customers from './pages/sales/Customers';
import SalesOrders from './pages/sales/SalesOrders';
import SalesOrderForm from './pages/sales/SalesOrderForm';
import Invoices from './pages/sales/Invoices';
import InvoiceDetail from './pages/sales/InvoiceDetail';

// Purchasing
import Suppliers from './pages/purchasing/Suppliers';
import PurchaseOrders from './pages/purchasing/PurchaseOrders';
import PurchaseOrderForm from './pages/purchasing/PurchaseOrderForm';

// Inventory
import Products from './pages/products/Products';
import Categories from './pages/products/Categories';
import Units from './pages/products/Units';
import Warehouses from './pages/products/Warehouses';
import StockLevels from './pages/inventory/StockLevels';
import StockMovements from './pages/inventory/StockMovements';
import LowStock from './pages/inventory/LowStock';

// Admin
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';

// Reports
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/sales" element={<Navigate to="/sales/orders" replace />} />
        <Route path="/sales/customers" element={<Customers />} />
        <Route path="/sales/orders" element={<SalesOrders />} />
        <Route path="/sales/orders/new" element={<SalesOrderForm />} />
        <Route path="/sales/orders/:id/edit" element={<SalesOrderForm />} />
        <Route path="/sales/invoices" element={<Invoices />} />
        <Route path="/sales/invoices/:id" element={<InvoiceDetail />} />

        <Route path="/purchasing" element={<Navigate to="/purchasing/orders" replace />} />
        <Route path="/purchasing/suppliers" element={<Suppliers />} />
        <Route path="/purchasing/orders" element={<PurchaseOrders />} />
        <Route path="/purchasing/orders/new" element={<PurchaseOrderForm />} />
        <Route path="/purchasing/orders/:id/edit" element={<PurchaseOrderForm />} />

        <Route path="/inventory" element={<Navigate to="/inventory/products" replace />} />
        <Route path="/inventory/products" element={<Products />} />
        <Route path="/inventory/categories" element={<Categories />} />
        <Route path="/inventory/units" element={<Units />} />
        <Route path="/inventory/warehouses" element={<Warehouses />} />
        <Route path="/inventory/stock-levels" element={<StockLevels />} />
        <Route path="/inventory/stock-movements" element={<StockMovements />} />
        <Route path="/inventory/low-stock" element={<LowStock />} />

        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/roles" element={<Roles />} />

        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}