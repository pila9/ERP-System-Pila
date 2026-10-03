import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronLeft,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'
import { initialsOf } from '../../lib/format'
import Dropdown from '../ui/Dropdown'

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: null, end: true },
      { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { to: '/products', label: 'Products', icon: Package, permission: 'products.view' },
      { to: '/categories', label: 'Categories', icon: Boxes, permission: 'products.view' },
      { to: '/units', label: 'Units of measure', icon: Building2, permission: 'products.view' },
      { to: '/warehouses', label: 'Warehouses', icon: Warehouse, permission: 'products.view' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/inventory', label: 'Stock levels', icon: ClipboardList, permission: 'stock.view' },
      { to: '/inventory/movements', label: 'Stock movements', icon: Truck, permission: 'stock.view' },
      { to: '/inventory/low-stock', label: 'Low stock alerts', icon: ShieldCheck, permission: 'stock.view' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/sales-orders', label: 'Sales orders', icon: ShoppingCart, permission: 'sales.view' },
      { to: '/invoices', label: 'Invoices', icon: Receipt, permission: 'invoices.view' },
      { to: '/customers', label: 'Customers', icon: Users, permission: 'customers.view' },
    ],
  },
  {
    title: 'Purchasing',
    items: [
      { to: '/purchase-orders', label: 'Purchase orders', icon: FileText, permission: 'purchases.view' },
      { to: '/suppliers', label: 'Suppliers', icon: Truck, permission: 'suppliers.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: UserCog, permission: 'users.manage' },
      { to: '/roles', label: 'Roles & permissions', icon: Settings, permission: 'roles.manage' },
    ],
  },
]

function navSections() {
  return NAV_SECTIONS.filter((section) => section.items.length > 0)
}

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const sections = useMemo(
    () => navSections().filter((section) => section.items.some((item) => hasPermission(item.permission))),
    [hasPermission],
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          ERP
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">ERP System</p>
            <p className="truncate text-[11px] text-slate-400">Operations suite</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white',
                        collapsed && 'justify-center px-0',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-2.5">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="hidden w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white lg:flex"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-pop">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <Breadcrumbs />
          </div>

          <Dropdown
            align="right"
            trigger={
              <button type="button" className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {initialsOf(user?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight text-slate-800">{user?.name}</span>
                  <span className="block text-xs leading-tight text-slate-500">{user?.role?.name}</span>
                </span>
              </button>
            }
            items={[
              { label: 'My profile', onSelect: () => navigate('/profile') },
              { label: 'Sign out', icon: LogOut, tone: 'danger', onSelect: handleLogout },
            ]}
          />
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const CRUMB_LABELS = {
  products: 'Products',
  categories: 'Categories',
  units: 'Units',
  warehouses: 'Warehouses',
  inventory: 'Inventory',
  movements: 'Movements',
  'low-stock': 'Low stock',
  'sales-orders': 'Sales orders',
  invoices: 'Invoices',
  customers: 'Customers',
  suppliers: 'Suppliers',
  'purchase-orders': 'Purchase orders',
  reports: 'Reports',
  users: 'Users',
  roles: 'Roles',
  profile: 'Profile',
}

function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (!segments.length) {
    return <p className="text-sm font-semibold text-slate-800">Dashboard</p>
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link to="/" className="hidden text-slate-500 hover:text-slate-800 sm:inline">
        Home
      </Link>
      {segments.map((segment, index) => (
        <span key={segment} className="flex items-center gap-1.5">
          <span className={index < segments.length - 1 ? 'hidden text-slate-500 sm:inline' : ''}>/</span>
          <span className={index === segments.length - 1 ? 'font-semibold text-slate-800' : 'hidden text-slate-500 sm:inline'}>
            {CRUMB_LABELS[segment] ?? segment}
          </span>
        </span>
      ))}
    </nav>
  )
}