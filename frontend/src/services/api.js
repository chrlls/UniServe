import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token from localStorage if present (token-based Sanctum flow)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Normalize error shape: always throw the server's message string
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverError = error.response?.data;
    const normalized = new Error(
      serverError?.message ?? error.message ?? 'An unexpected error occurred.',
    );
    normalized.errors = serverError?.errors ?? {};
    normalized.status = error.response?.status;
    return Promise.reject(normalized);
  },
);

export default api;
