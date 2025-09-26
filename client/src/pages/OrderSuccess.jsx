import React from 'react';
import { Link } from 'react-router-dom';
export default function OrderSuccess(){ return (
  <div className="container mx-auto p-6">
    <h2 className="text-2xl font-semibold">Order placed!</h2>
    <p className="mt-2">Your order has been received. Thank you.</p>
    <Link to="/" className="text-indigo-600 mt-3 inline-block">Back to menu</Link>
  </div>
);}
