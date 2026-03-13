import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/common/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

import AdminDashboard from './components/dashboard/AdminDashboard';
import ReportsPage from './components/dashboard/ReportsPage';
import MenuManagementPage from './components/menu/MenuManagementPage';
import MenuList from './components/menu/MenuList';
import POSInterface from './components/orders/POSInterface';
import OrderQueue from './components/orders/OrderQueue';
import OrderReceipt from './components/orders/OrderReceipt';
import CustomerOrders from './components/orders/CustomerOrders';
import InventoryPage from './components/inventory/InventoryPage';
import UserManagement from './components/users/UserManagement';
import SettingsPage from './components/settings/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Protected + Layout wrapper */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cashier', 'customer']}>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                {/* Admin Routes */}
                <Route path="/admin">
                  <Route path="dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="menu"      element={<ProtectedRoute allowedRoles={['admin']}><MenuManagementPage /></ProtectedRoute>} />
                  <Route path="orders"    element={<ProtectedRoute allowedRoles={['admin']}><OrderQueue /></ProtectedRoute>} />
                  <Route path="inventory" element={<ProtectedRoute allowedRoles={['admin']}><InventoryPage /></ProtectedRoute>} />
                  <Route path="users"     element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                  <Route path="reports"   element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
                  <Route path="settings"  element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
                </Route>

                {/* Cashier Routes */}
                <Route path="/cashier">
                  <Route path="pos"    element={<ProtectedRoute allowedRoles={['admin', 'cashier']}><POSInterface /></ProtectedRoute>} />
                  <Route path="orders" element={<ProtectedRoute allowedRoles={['admin', 'cashier']}><OrderQueue /></ProtectedRoute>} />
                </Route>

                {/* Shared Routes */}
                <Route path="/menu"       element={<ProtectedRoute allowedRoles={['customer', 'cashier', 'admin']}><MenuList /></ProtectedRoute>} />
                <Route path="/orders"     element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['customer', 'cashier', 'admin']}><OrderReceipt /></ProtectedRoute>} />
              </Route>

              {/* Default catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
    </ThemeProvider>
  );
}
