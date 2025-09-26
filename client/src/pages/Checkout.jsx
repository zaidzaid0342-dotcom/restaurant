// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp } from "react-icons/fa";
import API from '../api';
import toast, { Toaster } from 'react-hot-toast';

export default function Checkout() {
  const [orderType, setOrderType] = useState('dine-in'); 
  const [tableNumber, setTableNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const navigate = useNavigate();

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');

    if (orderType === 'dine-in' && !tableNumber) {
      return toast.error('Please enter table number');
      
    }
    if (orderType === 'dine-in' && !whatsappNumber) {
      return toast.error('Please enter whatsapp number');
      
    }
    if (orderType === 'home-delivery') {
      if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
        return toast.error('Please enter name, phone, and address');
      }
    }

    const items = cart.map(i => ({
      menuItem: i._id,
      name: i.name,
      price: i.price,
      qty: i.qty
    }));

    const payload = { orderType, items, total };
    if (orderType === 'dine-in') {
      payload.tableNumber = tableNumber;
       payload.whatsappNumber = whatsappNumber;
      }
    if (orderType === 'home-delivery') {
      payload.customerName = customerName;
      payload.customerPhone = customerPhone;
      payload.deliveryAddress = deliveryAddress;
      
    }

    try {
      setLoading(true);
      const res = await API.post('/orders', payload);
      setOrder(res.data.order);
      setTracking(res.data.order.trackingId);
      localStorage.removeItem('cart');
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error("Order placement failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.msg || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/orders/track/${tracking}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Tracking fetch failed:", err.response?.data || err.message);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [tracking]);

  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />

      {!order ? (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Checkout</h2>

          {/* Order Type */}
          <div className="mb-4 flex space-x-6 justify-center">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="dine-in"
                checked={orderType === 'dine-in'}
                onChange={() => setOrderType('dine-in')}
              />
              <span>Dine-in</span>
            </label>
           {/* <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="home-delivery"
                checked={orderType === 'home-delivery'}
                onChange={() => setOrderType('home-delivery')}
              />
              <span>Home Delivery</span>
            </label>*/}
          </div>

          {/* Dine-in */}
          {orderType === 'dine-in' && (
            <>
              <label className="block mb-2 font-semibold text-gray-700">Table Number</label>
              <input
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                placeholder="E.g., T12 or 5"
                className="w-full border p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
               {/* Add WhatsApp number field for dine-in */}
               
                <label className="block mb-2 font-semibold text-gray-700">WhatsApp Number</label>
                <input
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder="Enter your WhatsApp number (required)"
                  className="w-full border p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              
            </>
          )}

          {/* Home Delivery */}
          {orderType === 'home-delivery' && (
            <>
              <label className="block mb-2 font-semibold text-gray-700">Name</label>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <label className="block mb-2 font-semibold text-gray-700">Phone</label>
              <input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full border p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <label className="block mb-2 font-semibold text-gray-700">Delivery Address</label>
              <textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                className="w-full border p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              ></textarea>
            </>
          )}

          {/* Total */}
          <div className="bg-gray-100 p-4 rounded-xl mb-4 text-gray-800 font-semibold text-lg flex justify-between">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition font-semibold text-lg"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      ) : (
        // Confirmation
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Order Confirmation</h2>
          <div className="space-y-2 text-gray-700 text-center">
            <p>
              <span className="font-semibold">Tracking ID:</span>{' '}
              <span className="text-indigo-600 font-bold text-xl">{order.trackingId}</span>
            </p>
            <p><span className="font-semibold">Type:</span> {order.orderType}</p>
            {order.orderType === 'dine-in' && <p><span className="font-semibold">Table:</span> {order.tableNumber}</p>}
            {order.orderType === 'home-delivery' && (
              <>
                <p><span className="font-semibold">Customer:</span> {order.customerName} ({order.customerPhone})</p>
                <p><span className="font-semibold">Address:</span> {order.deliveryAddress}</p>
              </>
            )}
            <p>
              <span className="font-semibold">Status:</span>{' '}
              <span className={`capitalize font-semibold ${
                order.status === 'served'
                  ? 'text-green-600'
                  : order.status === 'preparing'
                  ? 'text-yellow-600'
                  : order.status === 'cancelled'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {order.status}
                
              </span>
            </p>
            <p>
              <span className="font-semibold">Paid:</span>{' '}
              <span className={order.paid ? 'text-green-600 font-semibold' : 'text-gray-600 font-semibold'}>
                {order.paid ? 'Yes' : 'No'}
              </span>
            </p>
          </div>

          {/* Items */}
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Items</h3>
            <ul className="divide-y divide-gray-200">
              {order.items.map((i, idx) => (
                <li key={idx} className="py-2 flex justify-between text-gray-700">
                  <span>{i.name} x{i.qty}</span>
                  <span>₹{(i.price * i.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-between items-center font-bold text-lg text-gray-800">
            <span>Total:</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>

          <p className="mt-3 text-sm text-gray-500 text-center">
            Use the tracking ID above to check your order status later.
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition font-semibold text-lg"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
