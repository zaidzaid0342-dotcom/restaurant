import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerMenu from './pages/CustomerMenu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerMenu />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}
