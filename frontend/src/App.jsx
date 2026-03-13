import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { Toaster } from 'sonner';

const Login = lazy(() => import('./components/auth/Login'));
const MainLayout = lazy(() => import('./components/common/MainLayout'));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const ReportsPage = lazy(() => import('./components/dashboard/ReportsPage'));
const MenuManagementPage = lazy(() => import('./components/menu/MenuManagementPage'));
const MenuList = lazy(() => import('./components/menu/MenuList'));
const POSInterface = lazy(() => import('./components/orders/POSInterface'));
const OrderQueue = lazy(() => import('./components/orders/OrderQueue'));
const OrderReceipt = lazy(() => import('./components/orders/OrderReceipt'));
const CustomerOrders = lazy(() => import('./components/orders/CustomerOrders'));
const InventoryPage = lazy(() => import('./components/inventory/InventoryPage'));
const UserManagement = lazy(() => import('./components/users/UserManagement'));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));

function RouteFallback() {
  return <LoadingSpinner fullScreen message="Loading page..." />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
          <CartProvider>
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
            <Toaster richColors position="top-right" closeButton />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
    </ThemeProvider>
  );
}
