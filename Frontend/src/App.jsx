import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './layouts/SidebarLayout';
import ProtectedRoute from './components/ProtectedRoute'; // Your route guard middleware
import Login from './pages/Login';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Products from './pages/Products'; 
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Categories from './pages/Categories'; 
import KhqrPayment from './pages/KhqrPayment'; // 🚀 1. IMPORT YOUR NEW KHQR REDIRECT COMPONENT HERE


export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Gateway Login Shell */}
        <Route path="/login" element={<Login />} />

        {/* 🎯 2. PUBLIC REDIRECT PAYMENT LINK GATEWAY (Accessible without sidebar layouts) */}
        <Route path="/khqr-payment" element={<KhqrPayment />} />

        {/* Protected Dashboard Shell Workspace */}
        <Route path="/*" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Routes>
                {/* Standard Base Forwarder to POS Terminal */}
                <Route path="/" element={<Navigate to="/orders" replace />} />
                
                {/* Regular Counter Actions (Accessible by both Users and Admins) */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />

                {/* Restricted Administrative CRUD Actions (Admin Only) */}
                <Route path="/users" element={
                  <ProtectedRoute adminOnly={true}>
                    <Users />
                  </ProtectedRoute>
                } />
                
                <Route path="/categories" element={
                  <ProtectedRoute adminOnly={true}>
                    <Categories />
                  </ProtectedRoute>
                } />
              
                <Route path="/dashboard" element={
                  <ProtectedRoute adminOnly={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/products" element={
                  <ProtectedRoute adminOnly={true}>
                    <Products />
                  </ProtectedRoute>
                } />

                <Route path="/reports" element={
                  <ProtectedRoute adminOnly={true}>
                    <Reports />
                  </ProtectedRoute>
                } />

              </Routes>
            </SidebarLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}