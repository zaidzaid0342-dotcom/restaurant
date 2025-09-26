import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async () => {
    try {
      const res = await API.post('/auth/login', { email, password });
      // Use sessionStorage instead of localStorage
      sessionStorage.setItem('token', res.data.token);
      // Generate a unique tab ID for this session
      const tabId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('tabId', tabId);
      navigate('/admin');
    } catch (err) { 
      setError('Invalid login'); 
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Login</h2>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">{error}</div>}
        <input 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          placeholder="email" 
          className="w-full mb-4 px-4 py-2 border rounded-lg" 
        />
        <input 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          placeholder="password" 
          className="w-full mb-6 px-4 py-2 border rounded-lg" 
        />
        <button 
          onClick={submit} 
          className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}