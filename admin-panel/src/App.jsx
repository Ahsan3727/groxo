import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Layout Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import HubMap from './pages/HubMap';
import Orders from './pages/OrderManagement';      // Your actual file names
import Products from './pages/ProductApprovals';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tickets from './pages/SupportTickets';

// Services
import api from './services/api';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main App Layout (with sidebar and header)
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/login');
  };

  // Get current page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/': return 'Dashboard';
      case '/dashboard': return 'Dashboard';
      case '/users': return 'User Management';
      case '/map': return 'Hub Map';
      case '/orders': return 'Order Management';
      case '/products': return 'Product Approvals';
      case '/transactions': return 'Transactions';
      case '/reports': return 'Reports';
      case '/settings': return 'Settings';
      case '/tickets': return 'Support Tickets';
      default: return 'Groxo Admin';
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{ marginLeft: sidebarOpen ? '250px' : '0', transition: 'margin-left 0.3s' }}
      >
        <Header title={getPageTitle()} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HubMap />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Orders />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Products />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Transactions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Tickets />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch All - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;