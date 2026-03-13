import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // null = unknown (checking), false = confirmed unauthenticated
  const [loading, setLoading] = useState(true);

  // On mount, rehydrate user from existing token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(credentials) {
    const registeredUser = await authService.register(credentials);
    setUser(registeredUser);
    return registeredUser;
  }

  async function refreshUser() {
    const currentUser = await authService.me();
    setUser(currentUser);
    return currentUser;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { AuthContext };
