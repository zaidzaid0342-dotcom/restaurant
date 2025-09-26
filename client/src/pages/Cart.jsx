import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaWhatsapp } from "react-icons/fa";
import API from '../api';

export default function Cart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    toast.success('Item removed from cart');
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
      toast.success('Order found');
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
      toast.success('Order found');
    } catch (err) {
      console.error(err);
      toast.error('No orders found for this WhatsApp number');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-gray-600 mt-1">Review your items before checkout</p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Continue Dining
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              to="/" 
              className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cart Items ({cart.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {cart.map(i => (
                  <div key={i._id} className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
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
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{i.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">₹{Number(i.price).toFixed(2)} each</p>
                          </div>
                          <div className="text-lg font-bold text-gray-900 ml-0 sm:ml-4">₹{(Number(i.price) * Number(i.qty)).toFixed(2)}</div>
                        </div>

                        {/* Quantity + Actions */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center bg-gray-100 rounded-xl">
                            <button
                              onClick={() => updateQty(i._id, -1)}
                              className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-200 rounded-l-xl transition-colors"
                              aria-label={`Decrease quantity of ${i.name}`}
                            >
                              −
                            </button>
                            <div className="px-4 py-2 font-medium text-gray-900 min-w-[3rem] text-center">{i.qty}</div>
                            <button
                              onClick={() => updateQty(i._id, 1)}
                              className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-200 rounded-r-xl transition-colors"
                              aria-label={`Increase quantity of ${i.name}`}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => setConfirmDelete(i)}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                            aria-label={`Remove ${i.name}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-3xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                  <button
                    onClick={() => { 
                      localStorage.removeItem('cart'); 
                      persistCart([]); 
                      toast.success('Cart cleared'); 
                    }}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Clear Cart
                  </button>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-md"
                  >
                    Proceed to Checkout
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Track Order Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Track Your Order</h3>
          </div>
          
          {/* Track by Order ID */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">By Order ID</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                placeholder="Enter 4-digit Order ID"
                className="flex-1 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={trackOrder}
                disabled={loading}
                className="px-6 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium whitespace-nowrap flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Track Order
              </button>
            </div>
          </div>
          
          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          {/* Track by WhatsApp Number */}
          <div>
            <div className="flex items-center mb-2">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <FaWhatsapp className="text-green-600 text-lg" />
              </div>
              <label className="block text-sm font-medium text-gray-700">By WhatsApp Number</label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="Enter your WhatsApp number"
                className="flex-1 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              <button
                onClick={trackOrderByWhatsapp}
                disabled={loading}
                className="px-6 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors font-medium whitespace-nowrap flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Track via WhatsApp
              </button>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="flex">
                    <span className="font-medium text-gray-700 w-32">Order ID:</span>
                    <span className="text-gray-900">#{order.trackingId}</span>
                  </p>
                  {order.orderType === 'home-delivery' && (
                    <>
                      <p className="flex">
                        <span className="font-medium text-gray-700 w-32">Customer:</span>
                        <span className="text-gray-900">{order.customerName} ({order.customerPhone})</span>
                      </p>
                      <p className="flex">
                        <span className="font-medium text-gray-700 w-32">Address:</span>
                        <span className="text-gray-900">{order.deliveryAddress}</span>
                      </p>
                    </>
                  )}
                  {order.orderType === 'dine-in' && (
                    <p className="flex">
                      <span className="font-medium text-gray-700 w-32">Table:</span>
                      <span className="text-gray-900">{order.tableNumber}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="flex">
                    <span className="font-medium text-gray-700 w-32">Status:</span>
                    <span className={`capitalize font-semibold ${
                      order.status === 'served'
                        ? 'text-green-600'
                        : order.status === 'preparing'
                        ? 'text-yellow-600'
                        : order.status === 'ready'
                        ? 'text-blue-600'
                        : order.status === 'cancelled'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {order.status}
                    </span>
                  </p>
                  <p className="flex">
                    <span className="font-medium text-gray-700 w-32">Total:</span>
                    <span className="text-gray-900 font-medium">₹{order.total}</span>
                  </p>
                  <p className="flex">
                    <span className="font-medium text-gray-700 w-32">Payment:</span>
                    <span className={order.paid ? 'text-green-600 font-semibold' : 'text-gray-600 font-semibold'}>
                      {order.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </p>
                  {order.whatsappNumber && (
                    <p className="flex items-center">
                      <span className="font-medium text-gray-700 w-32">WhatsApp:</span>
                      <a 
                        href={`https://wa.me/${order.whatsappNumber.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline flex items-center"
                      >
                        <FaWhatsapp className="mr-1" />
                        {order.whatsappNumber}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Item</h3>
                <p className="text-gray-600">
                  Are you sure you want to remove <span className="font-semibold">{confirmDelete.name}</span> from your cart?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium order-1 sm:order-2"
                >
                  Remove Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}