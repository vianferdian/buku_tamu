import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GuestLanding from './pages/GuestLanding';
import GuestForm from './pages/GuestForm';
import DeliveryForm from './pages/DeliveryForm';
import Login from './pages/Login';
import SecurityPortal from './pages/SecurityPortal';
import AdminPortal from './pages/AdminPortal';
import './App.css';

// Simple Route Protection Helper
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (!token || !savedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(savedUser);
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/security'} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Kiosk Guest Pages (Public) */}
        <Route path="/" element={<GuestLanding />} />
        <Route path="/form" element={<GuestForm />} />
        <Route path="/delivery" element={<DeliveryForm />} />
        
        {/* Secure Login */}
        <Route path="/login" element={<Login />} />

        {/* Security Officer Route */}
        <Route 
          path="/security" 
          element={
            <ProtectedRoute allowedRole="SECURITY">
              <SecurityPortal />
            </ProtectedRoute>
          } 
        />

        {/* Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminPortal />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
