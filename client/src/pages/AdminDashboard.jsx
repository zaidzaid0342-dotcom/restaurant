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
    imageUrl: '', // Added imageUrl field
  });
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('menu'); // menu | orders
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
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
        price: form.price,
        category: form.category,
        available: form.available,
        imageUrl: form.imageUrl || null,
      };

      if (editItem) {
        await API.put(`/menu/${editItem._id}`, payload);
        toast.success('Menu item updated');
        setEditItem(null);
      } else {
        await API.post('/menu', payload);
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
      toast.error('Failed to save menu item');
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
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your restaurant's menu and orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm font-medium">Menu Items</p>
                <p className="text-3xl font-bold mt-1">{items.length}</p>
              </div>
              <div className="bg-indigo-400/30 p-3 rounded-xl">
                <FiShoppingCart className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium">Today's Income</p>
                <p className="text-3xl font-bold mt-1">₹{todaysIncome.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-400/30 p-3 rounded-xl">
                <FiCalendar className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200 text-sm font-medium">Total Income</p>
                <p className="text-3xl font-bold mt-1">₹{totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-amber-400/30 p-3 rounded-xl">
                <FiTrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl transform transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold mt-1">{orders.length}</p>
              </div>
              <div className="bg-blue-400/30 p-3 rounded-xl">
                <FiList className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'menu'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Menu Management
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Order Management
            </button>
            <div className="ml-auto px-4 py-3 flex items-center">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-lg transition-colors ${
                  isRefreshing 
                    ? 'text-gray-400' 
                    : 'text-gray-500 hover:bg-gray-100'
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
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    {editItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <form
                    onSubmit={submitMenu}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        required
                        placeholder="Item name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        required
                        placeholder="0.00"
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        placeholder="e.g. Appetizers, Main Course"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        placeholder="Brief description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                    
                    {/* Image URL Input */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input
                        placeholder="https://example.com/image.jpg"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Enter a URL for the product image. Leave empty to use a placeholder.
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="available"
                        checked={form.available}
                        onChange={(e) => setForm({ ...form, available: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                        Available
                      </label>
                    </div>
                    
                    <div className="md:col-span-2 flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                      >
                        {editItem ? 'Update Item' : 'Add Item'}
                      </button>
                      {editItem && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Menu Grid */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Items ({items.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="h-48 overflow-hidden bg-gray-100">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              onError={(e) => {
                                // Fallback to a placeholder if image fails to load
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <div className="bg-gray-200 rounded-full p-3 inline-block">
                                  <FiShoppingCart className="w-8 h-8 mx-auto" />
                                </div>
                                <p className="mt-2 text-sm">No Image</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                              <p className="text-gray-600 text-sm mt-1">{item.category}</p>
                            </div>
                            <span className="text-lg font-bold text-indigo-600">₹{item.price}</span>
                          </div>
                          <p className="text-gray-600 text-sm mt-3 line-clamp-2">{item.description || 'No description'}</p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                            >
                              <FiEdit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteId(item._id)}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
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
                  <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">#{order.trackingId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {getOrderTypeIcon(order.orderType)}
                                <span className="ml-1 capitalize">{order.orderType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {order.orderType === 'dine-in' ? (
                                  <div>
                                    <div className="flex items-center">
                                      <FiCoffee className="text-gray-400 mr-2" />
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
                                      <FiUser className="text-gray-400 mr-2" />
                                      <span className="font-medium">{order.customerName}</span>
                                    </div>
                                    <div className="flex items-center mt-1 text-gray-600">
                                      <FiPhone className="mr-2" />
                                      <span>{order.customerPhone}</span>
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
                                    <div className="flex items-start mt-1 text-gray-500 text-xs">
                                      <FiMapPin className="mt-0.5 mr-2 flex-shrink-0" />
                                      <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {order.items.map((item, index) => (
                                  <div key={index}>
                                    {item.name} <span className="text-gray-500">×{item.qty}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">₹{order.total.toFixed(2)}</div>
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
                                    : 'bg-gray-100 text-gray-800'
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => updateStatus(order._id, 'preparing')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition"
                                >
                                  Preparing
                                </button>
                                <button
                                  onClick={() => updateStatus(order._id, 'ready')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                >
                                  Ready
                                </button>
                                <button
                                  onClick={() => updateStatus(order._id, 'served')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                                >
                                  Served
                                </button>
                                <button
                                  onClick={() => updateStatus(order._id, 'cancelled')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <FiList className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
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
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Menu Item</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this menu item? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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