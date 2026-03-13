import api from './api';

const menuService = {
  async getAll(params = {}) {
    const { data } = await api.get('/menu-items', { params });
    return data.data.menu_items;
  },

  async getById(id) {
    const { data } = await api.get(`/menu-items/${id}`);
    return data.data.menu_item;
  },

  async create(formData) {
    const { data } = await api.post('/menu-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.menu_item;
  },

  async update(id, formData) {
    formData.append('_method', 'PUT');
    const { data } = await api.post(`/menu-items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.menu_item;
  },

  async delete(id) {
    await api.delete(`/menu-items/${id}`);
  },

  async toggleAvailability(id, isAvailable) {
    const { data } = await api.patch(`/menu-items/${id}/availability`, {
      is_available: isAvailable,
    });
    return data.data.menu_item;
  },
};

export default menuService;
