import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaWhatsapp } from "react-icons/fa";
import API from '../api';

export default function Cart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [confirmDelete, setConfirmDelete] = useState(null); // item to confirm deletion
  const [trackingId, setTrackingId] = useState(''); // for tracking input
  const [whatsappNumber, setWhatsappNumber] = useState(''); // for WhatsApp tracking
  const [order, setOrder] = useState(null); // fetched order details
  const [loading, setLoading] = useState(false); // loading state for tracking
  const navigate = useNavigate();

  // Helper to persist cart state
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

  // Track order by trackingId
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

  // Track order by WhatsApp number
  const trackOrderByWhatsapp = async () => {
    if (!whatsappNumber) return toast.error('Please enter your WhatsApp number');
    setLoading(true);
    try {
      // Clean the WhatsApp number by removing non-digit characters
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
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Your Cart</h2>
        <Link to="/" className="text-indigo-600 hover:underline">Continue Dining</Link>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow text-center">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link to="/" className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition">Browse Menu</Link>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {cart.map(i => (
            <div key={i._id} className="bg-white p-4 rounded-2xl shadow flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {i.imageUrl ? (
                  <img
                    src={i.imageUrl}
                    alt={i.name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-1 text-xs">No Image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 truncate">{i.name}</div>
                    <div className="text-gray-600 text-sm mt-1">₹{Number(i.price).toFixed(2)} each</div>
                  </div>
                  <div className="text-gray-700 font-semibold ml-4">₹{(Number(i.price) * Number(i.qty)).toFixed(2)}</div>
                </div>

                {/* Quantity + Actions */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateQty(i._id, -1)}
                      className="px-3 py-1 text-lg disabled:opacity-50"
                      aria-label={`Decrease quantity of ${i.name}`}
                    >−</button>
                    <div className="px-3 py-1 font-medium">{i.qty}</div>
                    <button
                      onClick={() => updateQty(i._id, 1)}
                      className="px-3 py-1 text-lg"
                      aria-label={`Increase quantity of ${i.name}`}
                    >+</button>
                  </div>

                  <button
                    onClick={() => setConfirmDelete(i)}
                    className="ml-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    aria-label={`Remove ${i.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 bg-white p-4 rounded-2xl shadow gap-4">
            <div className="text-left">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-2xl font-bold text-gray-800">₹{total.toFixed(2)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { localStorage.removeItem('cart'); persistCart([]); toast.success('Cart cleared'); }}
                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
              >
                Clear Cart
              </button>

              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Section */}
      <div className="mt-8 max-w-md mx-auto bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Track Your Order</h3>
        
        {/* Track by Order ID */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">By Order ID</label>
          <div className="flex gap-2">
            <input
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              placeholder="Enter 4-digit Order ID"
              className="flex-1 border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={trackOrder}
              disabled={loading}
              className="px-4 bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Track'}
            </button>
          </div>
        </div>
        
        {/* Divider */}
        <div className="flex items-center mb-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        
        {/* Track by WhatsApp Number */}
        <div>
          <div className="flex items-center mb-1">
            <FaWhatsapp className="text-green-600 mr-1" />
            <label className="block text-sm font-medium text-gray-700">By WhatsApp Number</label>
          </div>
          
          <div className="flex gap-2">
            <input
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              placeholder="Enter your WhatsApp number"
              className="flex-1 border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={trackOrderByWhatsapp}
              disabled={loading}
              className="px-4 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Track'}
            </button>
          </div>
        </div>

        {order && (
          <div className="mt-4 text-gray-700">
            <p><span className="font-semibold">Order ID:</span> {order.trackingId}</p>
            {order.orderType === 'home-delivery' && (
              <>
                <p><span className="font-semibold">Customer:</span> {order.customerName} ({order.customerPhone})</p>
                <p><span className="font-semibold">Address:</span> {order.deliveryAddress}</p>
              </>
            )}
            {order.orderType === 'dine-in' && <p><span className="font-semibold">Table:</span> {order.tableNumber}</p>}
            
            {/* Show WhatsApp number for both order types */}
            {order.whatsappNumber && (
              <p>
                <span className="font-semibold">WhatsApp:</span>{' '}
                <FaWhatsapp className="text-green-600 mx-1" />
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
            
            <p>
              <span className="font-semibold">Status:</span>{' '}
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
            <p><span className="font-semibold">Total:</span> ₹{order.total}</p>
            <p>
              <span className="font-semibold">Paid:</span>{' '}
              <span className={order.paid ? 'text-green-600 font-semibold' : 'text-gray-600 font-semibold'}>
                {order.paid ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                {confirmDelete.imageUrl ? (
                  <img
                    src={confirmDelete.imageUrl}
                    alt={confirmDelete.name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-1 text-xs">No Image</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Remove item</h3>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to remove <span className="font-semibold">{confirmDelete.name}</span> from your cart?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}