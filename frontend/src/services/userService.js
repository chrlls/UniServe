import api from './api';

const userService = {
  async getAll(params = {}) {
    const { data } = await api.get('/users', { params });
    return data.data.users;
  },

  async create(userData) {
    const { data } = await api.post('/users', userData);
    return data.data.user;
  },

  async update(id, userData) {
    const { data } = await api.put(`/users/${id}`, userData);
    return data.data.user;
  },

  async delete(id) {
    await api.delete(`/users/${id}`);
  },
};

export default userService;
