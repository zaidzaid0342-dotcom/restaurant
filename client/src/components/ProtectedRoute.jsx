  import React, { useEffect, useState } from 'react';
  import { Navigate } from 'react-router-dom';
  import API from '../api';

  export default function ProtectedRoute({ children, adminOnly = false }) {
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
      const check = async () => {
        try {
          // First check if token exists in sessionStorage
          const token = sessionStorage.getItem('token');
          const tabId = sessionStorage.getItem('tabId');
          
          if (!token || !tabId) {
            setAllowed(false);
            setLoading(false);
            return;
          }

          // Then verify with server
          const res = await API.get('/auth/me');
          
          if (adminOnly && res.data.role !== 'admin') {
            setAllowed(false);
          } else {
            setAllowed(true);
          }
        } catch (err) {
          // Clear sessionStorage on error
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('tabId');
          setAllowed(false);
        } finally {
          setLoading(false);
        }
      };
      check();
    }, [adminOnly]);

    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
    if (!allowed) return <Navigate to="/admin/login" replace />;
    return children;
  }