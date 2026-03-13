import api from './api';

const inventoryService = {
  async getAll(params = {}) {
    const { data } = await api.get('/inventory', { params });
    return {
      inventoryItems: data.data.inventory_items,
      recentLogs: data.data.recent_logs,
    };
  },

  async updateStock(menuItemId, { stock_quantity, reason }) {
    const { data } = await api.patch(`/inventory/${menuItemId}/stock`, {
      stock_quantity,
      reason,
    });
    return {
      menuItem: data.data.menu_item,
      inventoryLog: data.data.inventory_log,
    };
  },

  async bulkRestock(items, reason) {
    const { data } = await api.post('/inventory/restock', { items, reason });
    return data.data.inventory_logs;
  },
};

export default inventoryService;
