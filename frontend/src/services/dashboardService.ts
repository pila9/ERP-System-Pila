import { api } from '../lib/api';

export const dashboardService = {
  getOverview: (params?: any) => api.get('/dashboard/overview', { params }),
  getSalesChart: (params?: any) => api.get('/dashboard/sales-chart', { params }),
  getTopProducts: (params?: any) => api.get('/dashboard/top-products', { params }),
  getTopCustomers: (params?: any) => api.get('/dashboard/top-customers', { params }),
};