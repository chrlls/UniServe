import api from './api';

const inventoryService = {
  async getAll(params = {}) {
    const { data } = await api.get('/inventory', { params });
    const payload = data?.data ?? {};
    const pagination = payload.inventory_pagination ?? null;

    return {
      inventoryItems: payload.inventory_items ?? [],
      recentLogs: payload.recent_logs ?? [],
      pagination: pagination
        ? {
            currentPage: pagination.current_page,
            lastPage: pagination.last_page,
            perPage: pagination.per_page,
            total: pagination.total,
            from: pagination.from,
            to: pagination.to,
          }
        : null,
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
