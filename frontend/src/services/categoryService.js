import api from './api';

const categoryService = {
  async getAll() {
    const { data } = await api.get('/categories');
    return data.data.categories;
  },

  async getById(id) {
    const { data } = await api.get(`/categories/${id}`);
    return data.data.category;
  },

  async create({ name, description }) {
    const { data } = await api.post('/categories', { name, description });
    return data.data.category;
  },

  async update(id, { name, description }) {
    const { data } = await api.put(`/categories/${id}`, { name, description });
    return data.data.category;
  },

  async delete(id) {
    await api.delete(`/categories/${id}`);
  },
};

export default categoryService;
