import api from './api';

const authService = {
  async login({ email, password, remember }) {
    const { data } = await api.post('/auth/login', { email, password, remember });
    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
    }
    return data.data.user;
  },

  async register({ name, email, password, password_confirmation }) {
    const { data } = await api.post('/auth/register', { name, email, password, password_confirmation });
    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
    }
    return data.data.user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },

  async updateProfile(profileData) {
    const { data } = await api.put('/auth/profile', profileData);
    return data.data.user;
  },

  async updatePassword(passwordData) {
    const { data } = await api.put('/auth/password', passwordData);
    return data.data ?? null;
  },
};

export default authService;
