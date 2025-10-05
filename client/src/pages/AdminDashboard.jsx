import React, { useEffect, useState } from 'react';
import API from '../api';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiRefreshCcw,
  FiDollarSign,
  FiShoppingCart,
  FiTrash2,
  FiEdit,
  FiList,
  FiSearch,
  FiCalendar,
  FiTrendingUp,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCheck,
  FiX,
  FiClock,
  FiHome,
  FiCoffee,
  FiChevronDown,
  FiChevronUp,
  FiStar,
} from 'react-icons/fi';
import { FaWhatsapp } from "react-icons/fa";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
    imageUrl: '',
  });
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      // Sort orders by createdAt in descending order (newest first)
      const sortedOrders = [...res.data].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Most recent first
      });
      setOrders(sortedOrders);
    } catch (e) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await API.get('/menu');
      setItems(res.data);
    } catch (e) {
      toast.error('Failed to fetch menu');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOrders(), fetchMenu()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todaysIncome = orders
    .filter((o) => o.createdAt?.slice(0, 10) === today)
    .reduce((sum, o) => sum + o.total, 0);
    
  const totalIncome = orders
    .reduce((sum, o) => sum + o.total, 0);

  const submitMenu = async (e) => {
  e.preventDefault();
  
  try {
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      available: form.available,
      imageUrl: form.imageUrl || null,
    };
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    if (editItem) {
      await API.put(`/menu/${editItem._id}`, payload);
      toast.success('Menu item updated');
      setEditItem(null);
    } else {
      const response = await API.post('/menu', payload);
      console.log('Response:', response.data);
      toast.success('Menu item added');
    }
    
    setForm({
      name: '',
      description: '',
      price: '',
      category: '',
      available: true,
      imageUrl: '',
    });
    
    fetchMenu();
  } catch (e) {
    console.error('Full error object:', e);
    console.error('Error response data:', e.response?.data);
    console.error('Error status:', e.response?.status);
    
    let errorMessage = 'Failed to save menu item';
    
    if (e.response?.data?.error) {
      errorMessage = e.response.data.error;
    } else if (e.response?.data?.message) {
      errorMessage = e.response.data.message;
    }
    
    toast.error(errorMessage);
  }
};

  const startEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available ?? true,
      imageUrl: item.imageUrl || '',
    });
  };

  const cancelEdit = () => {
    setEditItem(null);
    setForm({
      name: '',
      description: '',
      price: '',
      category: '',
      available: true,
      imageUrl: '',
    });
  };

  const confirmDelete = async (id) => {
    try {
      await API.delete(`/menu/${id}`);
      toast.success('Menu item deleted');
      fetchMenu();
      setDeleteId(null);
    } catch (e) {
      toast.error('Failed to delete item');
    }
  };

  const togglePaid = async (id, currentPaid) => {
    try {
      await API.put(`/orders/${id}/status`, { paid: !currentPaid });
      toast.success(`Order marked as ${!currentPaid ? 'Paid' : 'Unpaid'}`);
      fetchOrders();
    } catch (e) {
      toast.error('Failed to update payment status');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders
    .filter((o) => filterStatus === 'all' || o.status === filterStatus)
    .filter(
      (o) =>
        (o.tableNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.trackingId || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.whatsappNumber || '').toLowerCase().includes(search.toLowerCase())
    );

  const getStatusColor = (status) => {
    switch (status) {
      case 'served': return 'bg-emerald-100 text-emerald-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'served': return <FiCheck className="w-4 h-4" />;
      case 'preparing': return <FiClock className="w-4 h-4" />;
      case 'ready': return <FiCoffee className="w-4 h-4" />;
      case 'cancelled': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const getOrderTypeIcon = (type) => {
    return type === 'dine-in' ? <FiCoffee className="w-4 h-4" /> : <FiHome className="w-4 h-4" />;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time ago for recent orders
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    return formatDate(dateString);
  };

  // Check if order is new (less than 30 minutes old)
  const isNewOrder = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    return diffInMinutes < 30;
  };

  // Toggle order details expansion
  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
              <p className="text-slate-600">Manage your restaurant's menu and orders</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">Live</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.03] hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Menu Items</p>
                <p className="text-3xl font-bold mt-1">{items.length}</p>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-2xl">
                <FiShoppingCart className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.03] hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium">Today's Income</p>
                <p className="text-3xl font-bold mt-1">₹{todaysIncome.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-600/30 p-4 rounded-2xl">
                <FiCalendar className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-700 to-amber-800 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.03] hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200 text-sm font-medium">Total Income</p>
                <p className="text-3xl font-bold mt-1">₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-amber-600/30 p-4 rounded-2xl">
                <FiTrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.03] hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold mt-1">{orders.length}</p>
              </div>
              <div className="bg-blue-600/30 p-4 rounded-2xl">
                <FiList className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row border-b border-slate-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'menu'
                    ? 'text-slate-800 border-b-2 border-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Menu Management
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'text-slate-800 border-b-2 border-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Order Management
              </button>
            </div>
            <div className="ml-auto px-4 py-3 flex items-center">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-xl transition-colors ${
                  isRefreshing 
                    ? 'text-slate-400' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <FiRefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'menu' ? (
              // Menu Section
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    {editItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <form
                    onSubmit={submitMenu}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                      <input
                        required
                        placeholder="Item name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Price (₹)</label>
                      <input
                        required
                        placeholder="0.00"
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                      <input
                        placeholder="e.g. Appetizers, Main Course"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <input
                        placeholder="Brief description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    
                    {/* Image URL Input */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
                      <input
                        placeholder="https://example.com/image.jpg"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                      />
                      <p className="mt-1 text-sm text-slate-500">
                        Enter a URL for the product image. Leave empty to use a placeholder.
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="available"
                        checked={form.available}
                        onChange={(e) => setForm({ ...form, available: e.target.checked })}
                        className="w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                      />
                      <label htmlFor="available" className="ml-2 block text-sm text-slate-700">
                        Available
                      </label>
                    </div>
                    
                    <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition shadow-md"
                      >
                        {editItem ? 'Update Item' : 'Add Item'}
                      </button>
                      {editItem && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Menu Grid */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">Menu Items ({items.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                      >
                        <div className="h-48 overflow-hidden bg-slate-100">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <div className="text-center">
                                <div className="bg-slate-200 rounded-full p-4 inline-block">
                                  <FiShoppingCart className="w-10 h-10 mx-auto" />
                                </div>
                                <p className="mt-2 text-sm">No Image</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 text-lg">{item.name}</h4>
                              <p className="text-slate-600 text-sm mt-1">{item.category}</p>
                            </div>
                            <span className="text-xl font-bold text-slate-900">₹{item.price}</span>
                          </div>
                          <p className="text-slate-600 text-sm mt-3 line-clamp-2">{item.description || 'No description'}</p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                            >
                              <FiEdit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteId(item._id)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                          {!item.available && (
                            <div className="mt-3 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <FiX className="w-3 h-3 mr-1" />
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Orders Section
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Order Management</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition bg-white/90 backdrop-blur-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                            Items
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                            Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {filteredOrders.map((order) => (
                          <React.Fragment key={order._id}>
                            <tr className={`hover:bg-slate-50 transition-colors ${isNewOrder(order.createdAt) ? 'bg-blue-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-slate-900">#{order.trackingId}</div>
                                  {isNewOrder(order.createdAt) && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <FiStar className="mr-1 w-3 h-3" /> New
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                  {getOrderTypeIcon(order.orderType)}
                                  <span className="ml-1 capitalize">{order.orderType}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-900">
                                  {order.orderType === 'dine-in' ? (
                                    <div>
                                      <div className="flex items-center">
                                        <FiCoffee className="text-slate-400 mr-2" />
                                        <span className="font-medium">Table {order.tableNumber}</span>
                                      </div>
                                      {order.whatsappNumber && (
                                        <div className="flex items-center mt-1 text-green-600">
                                          <FaWhatsapp className="mr-1" />
                                          <a 
                                            href={`https://wa.me/${order.whatsappNumber.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                          >
                                            {order.whatsappNumber}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center">
                                        <FiUser className="text-slate-400 mr-2" />
                                        <span className="font-medium">{order.customerName}</span>
                                      </div>
                                      <div className="flex items-center mt-1 text-slate-600">
                                        <FiPhone className="mr-2" />
                                        <span>{order.customerPhone}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 hidden sm:table-cell">
                                <div className="text-sm text-slate-900 max-w-xs truncate">
                                  {order.items.map((item, index) => (
                                    <div key={index}>
                                      {item.name} <span className="text-slate-500">×{item.qty}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900">₹{order.total.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  <span className="ml-1 capitalize">{order.status}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => togglePaid(order._id, order.paid)}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    order.paid
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-800'
                                  } hover:opacity-90 transition`}
                                >
                                  {order.paid ? (
                                    <>
                                      <FiCheck className="w-3 h-3 mr-1" />
                                      Paid
                                    </>
                                  ) : (
                                    <>
                                      <FiX className="w-3 h-3 mr-1" />
                                      Unpaid
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <div className="text-sm text-slate-500">
                                  {formatTimeAgo(order.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex flex-col sm:flex-row gap-1">
                                  <button
                                    onClick={() => toggleOrderDetails(order._id)}
                                    className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
                                  >
                                    {expandedOrderId === order._id ? <FiChevronUp /> : <FiChevronDown />}
                                  </button>
                                  <div className="flex flex-wrap gap-1">
                                    <button
                                      onClick={() => updateStatus(order._id, 'preparing')}
                                      className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition"
                                      disabled={order.status === 'preparing' || order.status === 'ready' || order.status === 'served' || order.status === 'cancelled'}
                                    >
                                      Preparing
                                    </button>
                                    <button
                                      onClick={() => updateStatus(order._id, 'ready')}
                                      className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                      disabled={order.status === 'ready' || order.status === 'served' || order.status === 'cancelled'}
                                    >
                                      Ready
                                    </button>
                                    <button
                                      onClick={() => updateStatus(order._id, 'served')}
                                      className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                                      disabled={order.status === 'served' || order.status === 'cancelled'}
                                    >
                                      Served
                                    </button>
                                    <button
                                      onClick={() => updateStatus(order._id, 'cancelled')}
                                      className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition"
                                      disabled={order.status === 'cancelled' || order.status === 'served'}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {expandedOrderId === order._id && (
                              <tr className="bg-slate-50">
                                <td colSpan={9} className="px-6 py-4">
                                  <div className="text-sm text-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium text-slate-900 mb-2">Order Details</h4>
                                        <p><span className="font-medium">Order ID:</span> #{order.trackingId}</p>
                                        <p><span className="font-medium">Date:</span> {formatDate(order.createdAt)}</p>
                                        <p><span className="font-medium">Status:</span> <span className="capitalize">{order.status}</span></p>
                                        <p><span className="font-medium">Payment:</span> {order.paid ? 'Paid' : 'Unpaid'}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-slate-900 mb-2">Items</h4>
                                        <ul className="space-y-1">
                                          {order.items.map((item, index) => (
                                            <li key={index} className="flex justify-between">
                                              <span>{item.name}</span>
                                              <span>₹{item.price} × {item.qty}</span>
                                            </li>
                                          ))}
                                        </ul>
                                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-medium">
                                          <span>Total:</span>
                                          <span>₹{order.total.toFixed(2)}</span>
                                        </div>
                                      </div>
                                      {order.orderType === 'home-delivery' && (
                                        <div className="md:col-span-2">
                                          <h4 className="font-medium text-slate-900 mb-2">Delivery Information</h4>
                                          <p><span className="font-medium">Address:</span> {order.deliveryAddress}</p>
                                          {order.whatsappNumber && (
                                            <p className="flex items-center">
                                              <span className="font-medium mr-2">WhatsApp:</span>
                                              <FaWhatsapp className="text-green-600 mr-1" />
                                              <a 
                                                href={`https://wa.me/${order.whatsappNumber.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:underline"
                                              >
                                                {order.whatsappNumber}
                                              </a>
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <FiList className="mx-auto h-12 w-12 text-slate-400" />
                                <h3 className="mt-2 text-sm font-medium text-slate-900">No orders</h3>
                                <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter to find what you're looking for.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-slate-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Delete Menu Item</h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500">
                        Are you sure you want to delete this menu item? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => confirmDelete(deleteId)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}