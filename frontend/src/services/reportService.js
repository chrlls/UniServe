import api from './api';

const reportService = {
  async getSalesSummary(params = {}) {
    const { data } = await api.get('/reports/sales-summary', { params });
    return data.data.summary;
  },

  async getBestSellingItems(params = {}) {
    const { data } = await api.get('/reports/best-selling-items', { params });
    return data.data.items;
  },

  async getOrderTrends(params = {}) {
    const { data } = await api.get('/reports/order-trends', { params });
    return data.data.trends;
  },

  async getCategoryBreakdown(params = {}) {
    const { data } = await api.get('/reports/category-breakdown', { params });
    return data.data.categories;
  },
};

export default reportService;
