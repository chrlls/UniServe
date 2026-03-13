import api from './api';

const orderService = {
  async getAll(params = {}) {
    const { data } = await api.get('/orders', { params });
    return data.data.orders;
  },

  async getById(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data.data.order;
  },

  async create({ payment_method, items, customer_id }) {
    const { data } = await api.post('/orders', { payment_method, items, customer_id });
    return data.data.order;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data.data.order;
  },
};

export default orderService;
