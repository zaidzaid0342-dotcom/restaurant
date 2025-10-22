import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp } from "react-icons/fa";
import API from '../api';
import { 
  FiShoppingCart, 
  FiTrash2, 
  FiMinus, 
  FiPlus, 
  FiArrowLeft, 
  FiSearch, 
  FiPhone, 
  FiUser, 
  FiHome, 
  FiCoffee, 
  FiCheck, 
  FiClock, 
  FiX, 
  FiRefreshCw, 
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiMapPin,
  FiCalendar,
  FiStar,
  FiLock,
  FiShield,
  FiAward
} from 'react-icons/fi';

export default function Cart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('cart');
  const navigate = useNavigate();

  // Load recent order on component mount
  useEffect(() => {
    const loadRecentOrder = async () => {
      try {
        const res = await API.get('/orders/recent');
        if (res.data && res.data.length > 0) {
          setOrder(res.data[0]); // Load the most recent order
        }
      } catch (err) {
        console.error("Failed to load recent order:", err);
      }
    };
    
    loadRecentOrder();
  }, []);

  const persistCart = (next) => {
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
  };

  const updateQty = (id, delta) => {
    const next = cart.map(c => (c._id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
    persistCart(next);
  };

  const remove = (id) => {
    const next = cart.filter(c => c._id !== id);
    persistCart(next);
    toast.success('Item removed from cart', {
      icon: '✅',
      style: { 
        borderRadius: '12px', 
        background: '#065f46', 
        color: '#fff',
        fontWeight: '500'
      },
    });
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    remove(confirmDelete._id);
    setConfirmDelete(null);
  };

  const total = cart.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);

  const trackOrder = async () => {
    if (!trackingId) return toast.error('Please enter your 4-digit Order ID');
    setLoading(true);
    try {
      const res = await API.get(`/orders/track/${trackingId}`);
      setOrder(res.data);
      setActiveTab('tracking');
      toast.success('Order found', {
        icon: '✅',
        style: { 
          borderRadius: '12px', 
          background: '#065f46', 
          color: '#fff',
          fontWeight: '500'
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const trackOrderByWhatsapp = async () => {
    if (!whatsappNumber) return toast.error('Please enter your WhatsApp number');
    setLoading(true);
    try {
      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      const res = await API.get(`/orders/whatsapp/${cleanNumber}`);
      setOrder(res.data);
      setActiveTab('tracking');
      toast.success('Order found', {
        icon: '✅',
        style: { 
          borderRadius: '12px', 
          background: '#065f46', 
          color: '#fff',
          fontWeight: '500'
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('No orders found for this WhatsApp number');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

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

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl mr-3">
                <FiShoppingCart className="h-6 w-6 text-white" />
              </div>
              Your Cart
            </h1>
            <p className="text-slate-600 mt-1">Review your items before checkout</p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap px-4 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100"
          >
            <FiArrowLeft className="h-5 w-5 mr-1" />
            Continue Dining
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'cart'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Cart
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'tracking'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Track Order
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {cart.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-5 rounded-full">
                      <FiShoppingCart className="h-16 w-16 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">Your cart is empty</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">Looks like you haven't added any items to your cart yet.</p>
                  <Link 
                    to="/" 
                    className="inline-flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Cart Items */}
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                        <FiShoppingCart className="mr-2 text-emerald-600" />
                        Cart Items ({cart.length})
                      </h2>
                    </div>
                    <motion.div 
                      className="divide-y divide-slate-100"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {cart.map((i, index) => (
                        <motion.div 
                          key={i._id} 
                          className="p-6 hover:bg-slate-50 transition-colors"
                          variants={itemVariants}
                        >
                          <div className="flex flex-col sm:flex-row gap-6">
                            {/* Thumbnail */}
                            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 shadow-md">
                              {i.imageUrl ? (
                                <img
                                  src={i.imageUrl}
                                  alt={i.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/96x96?text=No+Image';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-emerald-400">
                                  <FiCoffee className="h-10 w-10" />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                                <div className="min-w-0">
                                  <h3 className="text-xl font-semibold text-slate-900 truncate">{i.name}</h3>
                                  <p className="text-slate-600 text-sm mt-1">₹{Number(i.price).toFixed(2)} each</p>
                                </div>
                                <div className="text-xl font-bold text-slate-900 ml-0 sm:ml-4">₹{(Number(i.price) * Number(i.qty)).toFixed(2)}</div>
                              </div>

                              {/* Quantity + Actions */}
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center bg-slate-100 rounded-2xl shadow-sm">
                                  <button
                                    onClick={() => updateQty(i._id, -1)}
                                    className="px-4 py-3 text-lg text-slate-700 hover:bg-slate-200 rounded-l-2xl transition-colors"
                                    aria-label={`Decrease quantity of ${i.name}`}
                                  >
                                    <FiMinus />
                                  </button>
                                  <div className="px-4 py-3 font-bold text-slate-900 min-w-[3rem] text-center">{i.qty}</div>
                                  <button
                                    onClick={() => updateQty(i._id, 1)}
                                    className="px-4 py-3 text-lg text-slate-700 hover:bg-slate-200 rounded-r-2xl transition-colors"
                                    aria-label={`Increase quantity of ${i.name}`}
                                  >
                                    <FiPlus />
                                  </button>
                                </div>

                                <button
                                  onClick={() => setConfirmDelete(i)}
                                  className="flex items-center px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm"
                                  aria-label={`Remove ${i.name}`}
                                >
                                  <FiTrash2 className="h-5 w-5 mr-1" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Summary */}
                  <div className="bg-white rounded-3xl shadow-xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 flex-1 border border-emerald-100">
                        <p className="text-emerald-700 font-medium">Subtotal</p>
                        <p className="text-3xl font-bold text-emerald-900">₹{total.toFixed(2)}</p>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                        <button
                          onClick={() => { 
                            localStorage.removeItem('cart'); 
                            persistCart([]); 
                            toast.success('Cart cleared', {
                              icon: '✅',
                              style: { 
                                borderRadius: '12px', 
                                background: '#065f46', 
                                color: '#fff',
                                fontWeight: '500'
                              },
                            }); 
                          }}
                          className="flex items-center px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
                        >
                          <FiTrash2 className="h-5 w-5 mr-1" />
                          Clear Cart
                        </button>

                        <button
                          onClick={() => navigate('/checkout')}
                          className="flex items-center px-7 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Proceed to Checkout
                          <FiArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tracking' && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Track Order Section */}
              <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
                <div className="flex items-center mb-8">
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-3 rounded-2xl mr-4">
                    <FiSearch className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Track Your Order</h3>
                </div>
                
                {/* Track by Order ID */}
                <div className="mb-8">
                  <label className="block text-slate-700 font-medium mb-3">By Order ID</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      value={trackingId}
                      onChange={e => setTrackingId(e.target.value)}
                      placeholder="Enter 4-digit Order ID"
                      className="flex-1 border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white shadow-sm"
                    />
                    <button
                      onClick={trackOrder}
                      disabled={loading}
                      className="px-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all font-medium whitespace-nowrap flex items-center justify-center shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <FiRefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      ) : (
                        <FiSearch className="mr-2 h-5 w-5" />
                      )}
                      Track Order
                    </button>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="flex items-center mb-8">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="mx-6 text-slate-600 text-sm font-medium">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                
                {/* Track by WhatsApp Number */}
                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-gradient-to-r from-green-100 to-teal-100 p-3 rounded-2xl mr-4">
                      <FaWhatsapp className="text-green-600 text-xl" />
                    </div>
                    <label className="block text-slate-700 font-medium text-lg">By WhatsApp Number</label>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      placeholder="Enter your WhatsApp number"
                      className="flex-1 border-2 border-green-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    />
                    <button
                      onClick={trackOrderByWhatsapp}
                      disabled={loading}
                      className="px-8 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-teal-700 disabled:opacity-50 transition-all font-medium whitespace-nowrap flex items-center justify-center shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <FiRefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      ) : (
                        <FaWhatsapp className="mr-2 h-5 w-5" />
                      )}
                      Track via WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              {order && (
                <motion.div 
                  className="bg-white rounded-3xl shadow-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-2xl font-bold text-white flex items-center">
                          <div className="bg-white/20 p-2 rounded-xl mr-3">
                            <FiCheck className="text-white" />
                          </div>
                          Order #{order.trackingId}
                        </h4>
                        <p className="text-emerald-100 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-2 capitalize text-white">{order.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h5 className="font-semibold text-slate-900 mb-4 flex items-center">
                          <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                            {getOrderTypeIcon(order.orderType)}
                          </div>
                          Order Information
                        </h5>
                        <div className="space-y-4">
                          {order.orderType === 'home-delivery' && (
                            <>
                              <div className="flex items-start">
                                <div className="bg-blue-100 p-2 rounded-xl mr-3 mt-1">
                                  <FiUser className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-slate-700 text-sm">Customer</p>
                                  <p className="text-slate-900 font-medium">{order.customerName}</p>
                                  <p className="text-slate-600">{order.customerPhone}</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="bg-green-100 p-2 rounded-xl mr-3 mt-1">
                                  <FiMapPin className="text-green-600" />
                                </div>
                                <div>
                                  <p className="text-slate-700 text-sm">Delivery Address</p>
                                  <p className="text-slate-900 font-medium">{order.deliveryAddress}</p>
                                </div>
                              </div>
                            </>
                          )}
                          {order.orderType === 'dine-in' && (
                            <div className="flex items-start">
                              <div className="bg-amber-100 p-2 rounded-xl mr-3 mt-1">
                                <FiHome className="text-amber-600" />
                              </div>
                              <div>
                                <p className="text-slate-700 text-sm">Table Number</p>
                                <p className="text-slate-900 font-medium">{order.tableNumber}</p>
                              </div>
                            </div>
                          )}
                          {/* {order.whatsappNumber && (
                            <div className="flex items-start">
                              <div className="bg-green-100 p-2 rounded-xl mr-3 mt-1">
                                <FaWhatsapp className="text-green-600" />
                              </div>
                              <div>
                                <p className="text-slate-700 text-sm">WhatsApp</p>
                                <a 
                                  href={`https://wa.me/${order.whatsappNumber.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:underline font-medium"
                                >
                                  {order.whatsappNumber}
                                </a>
                              </div>
                            </div>
                          )} */}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h5 className="font-semibold text-slate-900 mb-4 flex items-center">
                          <div className="bg-purple-100 p-2 rounded-xl mr-3">
                            <FiCreditCard className="text-purple-600" />
                          </div>
                          Payment & Status
                        </h5>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Order Total</span>
                            <span className="text-xl font-bold text-slate-900">₹{order.total}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Payment Status</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {order.paid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Order Status</span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <h5 className="font-semibold text-slate-900 mb-4 flex items-center">
                        <div className="bg-orange-100 p-2 rounded-xl mr-3">
                          <FiPackage className="text-orange-600" />
                        </div>
                        Order Items
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="py-3 text-left text-slate-700 font-medium">Item</th>
                              <th className="py-3 text-right text-slate-700 font-medium">Qty</th>
                              <th className="py-3 text-right text-slate-700 font-medium">Price</th>
                              <th className="py-3 text-right text-slate-700 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, index) => (
                              <tr key={index} className="border-b border-slate-100 last:border-0">
                                <td className="py-3 text-slate-900 font-medium">{item.name}</td>
                                <td className="py-3 text-right text-slate-700">{item.qty}</td>
                                <td className="py-3 text-right text-slate-700">₹{Number(item.price).toFixed(2)}</td>
                                <td className="py-3 text-right text-slate-900 font-semibold">₹{(item.price * item.qty).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="py-3 text-right text-slate-700 font-semibold">Total</td>
                              <td className="py-3 text-right text-slate-900 font-bold text-lg">₹{order.total}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security & Trust Badges */}
              {!order && (
                <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-white">
                      <h4 className="text-xl font-bold mb-2">Secure & Reliable Order Tracking</h4>
                      <p className="text-slate-300 max-w-md">Track your orders in real-time with our secure tracking system. Your information is protected with industry-standard encryption.</p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <div className="flex flex-col items-center p-4 bg-slate-700/50 rounded-xl">
                        <FiLock className="h-8 w-8 text-emerald-400 mb-2" />
                        <span className="text-white text-sm font-medium">Secure</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-slate-700/50 rounded-xl">
                        <FiShield className="h-8 w-8 text-blue-400 mb-2" />
                        <span className="text-white text-sm font-medium">Protected</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-slate-700/50 rounded-xl">
                        <FiAward className="h-8 w-8 text-amber-400 mb-2" />
                        <span className="text-white text-sm font-medium">Reliable</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
                  <FiTrash2 className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Remove Item</h3>
                  <p className="text-slate-600">
                    Are you sure you want to remove <span className="font-semibold">{confirmDelete.name}</span> from your cart?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-colors font-medium order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemove}
                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors font-medium order-1 sm:order-2"
                  >
                    Remove Item
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}