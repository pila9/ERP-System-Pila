import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  {
    label: 'Sales',
    icon: <ShoppingCartIcon />,
    children: [
      { path: '/sales/orders', label: 'Sales Orders' },
      { path: '/sales/invoices', label: 'Invoices' },
      { path: '/sales/customers', label: 'Customers' },
    ],
  },
  {
    label: 'Purchasing',
    icon: <LocalShippingIcon />,
    children: [
      { path: '/purchasing/orders', label: 'Purchase Orders' },
      { path: '/purchasing/suppliers', label: 'Suppliers' },
    ],
  },
  {
    label: 'Inventory',
    icon: <InventoryIcon />,
    children: [
      { path: '/inventory/products', label: 'Products' },
      { path: '/inventory/categories', label: 'Categories' },
      { path: '/inventory/units', label: 'Units' },
      { path: '/inventory/warehouses', label: 'Warehouses' },
      { path: '/inventory/stock-levels', label: 'Stock Levels' },
      { path: '/inventory/stock-movements', label: 'Stock Movements' },
      { path: '/inventory/low-stock', label: 'Low Stock Alerts' },
    ],
  },
  {
    label: 'Admin',
    icon: <SettingsIcon />,
    children: [
      { path: '/admin/users', label: 'Users' },
      { path: '/admin/roles', label: 'Roles' },
    ],
  },
  { path: '/reports', label: 'Reports', icon: <ReceiptIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(['sales', 'purchasing', 'inventory', 'admin']);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
    showToast('Logged out successfully', 'success');
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const drawer = (
    <Box sx={{ flexGrow: 1, p: 1, overflow: 'auto' }}>
      <Typography variant="h6" sx={{ px: 2, py: 1, fontWeight: 700, color: 'primary.main' }}>
        ERP System
      </Typography>
      <Divider />
      <List component="nav" disablePadding>
        {menuItems.map(item => {
          if (item.children) {
            const isOpen = expanded.includes(item.label.toLowerCase());
            return (
              <Box key={item.label}>
                <ListItem
                  button
                  onClick={() => toggleExpand(item.label.toLowerCase())}
                  sx={{ px: 1, py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                  {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItem>
                <Box component="ul" sx={{ display: isOpen ? 'block' : 'none', pl: 2 }}>
                  {item.children.map(child => (
                    <ListItem
                      key={child.path}
                      button
                      component={NavLink}
                      to={child.path}
                      selected={window.location.pathname === child.path}
                      onClick={() => isMobile && setMobileOpen(false)}
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        '&.active': { backgroundColor: 'primary.light', color: 'primary.contrastText', '& .MuiListItemIcon-root': { color: 'primary.contrastText' } },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, fontSize: 20 }}><PersonIcon /></ListItemIcon>
                      <ListItemText primary={child.label} />
                    </ListItem>
                  ))}
                </Box>
              </Box>
            );
          }
          return (
            <ListItem
              key={item.path}
              button
              component={NavLink}
              to={item.path}
              selected={window.location.pathname === item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&.active': { backgroundColor: 'primary.light', color: 'primary.contrastText', '& .MuiListItemIcon-root': { color: 'primary.contrastText' } },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - 260px)` }, ml: { md: '260px' }, zIndex: 1200 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error"><NotificationsIcon /></Badge>
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>{user?.name?.[0]?.toUpperCase()}</Avatar>
          </IconButton>
          </Tooltip>
          </Toolbar>
        </AppBar>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 } }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 260,
            flexShrink: 0,
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawer}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - 260px)` }, mt: '64px', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}