import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiShoppingCart, FiSearch, FiLayers, FiAlertTriangle } from 'react-icons/fi';
// Assuming '../api' is a configured axios instance or similar utility
import API from '../api';

/**
 * Utility function to format the last updated time.
 * @param {Date} date - The last updated Date object.
 * @returns {string} - Human-readable time ago string.
 */
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
};

/**
 * Cache menu in localStorage to improve loading speed
 */
const getCachedMenu = () => {
  try {
    const cachedData = localStorage.getItem('cachedMenu');
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Use cache if it's less than 10 minutes old (600,000 ms)
      if (Date.now() - timestamp < 10 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {
    console.error("Error reading cached menu:", e);
  }
  return null;
};

const cacheMenu = (data) => {
  try {
    localStorage.setItem('cachedMenu', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Error caching menu:", e);
  }
};

/**
 * Skeleton Loader component for improved perceived performance
 */
const SkeletonLoader = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
        <div className="h-56 bg-slate-200 animate-pulse"></div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="h-4 bg-slate-200 rounded w-full mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6 mb-4 animate-pulse"></div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded-lg w-1/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function CustomerMenu() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  /**
   * Processes the fetched menu data: sets items and extracts/sets unique categories.
   */
  const processMenuData = useCallback((menuItems) => {
    // Filter out any null or malformed items
    menuItems = menuItems.filter(item => item && item.name);
    setItems(menuItems);

    // Extract unique categories, filter out null/empty categories, and sort them
    const cats = Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    setCategories(cats);
  }, []);

  /**
   * Fetches the menu data from the API, handles caching and error reporting.
   * @param {boolean} isManual - True if triggered by a user's refresh button click.
   */
  const fetchMenu = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const res = await API.get('/menu', { signal: controller.signal });
      clearTimeout(timeoutId);

      let menuItems = [];

      // Handle common variations in API response structure
      if (Array.isArray(res.data)) {
        menuItems = res.data;
      } else if (res.data?.menu) {
        menuItems = res.data.menu;
      } else if (res.data?.items) {
        menuItems = res.data.items;
      } else {
        console.warn("⚠️ Unexpected API format:", res.data);
        menuItems = [];
      }

      processMenuData(menuItems);
      cacheMenu(menuItems); // Cache the fresh data

      // Update last refresh time
      setLastUpdated(new Date());

      if (isManual) {
        toast.success('Menu refreshed successfully!', {
          icon: '✅',
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
            fontWeight: '500'
          },
        });
      }
    } catch (e) {
      console.error("❌ Fetch menu failed:", e);
      if (e.name === 'AbortError') {
        if (isManual) {
          toast.error('Request timed out. Please check your connection.');
        }
      } else if (isManual) {
        toast.error('Failed to refresh menu. Server error.');
      }
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [processMenuData]);

  /**
   * Initial load and background polling effect.
   */
  useEffect(() => {
    // 1. Try to load from cache first for immediate display
    const cachedMenu = getCachedMenu();
    if (cachedMenu && cachedMenu.length > 0) {
      processMenuData(cachedMenu);
      setIsLoading(false);
    }

    // 2. Then fetch fresh data
    fetchMenu();

    // 3. Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchMenu(false); // Silent background refresh
    }, 30000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [fetchMenu, processMenuData]);

  /**
   * Cart state persistence effect.
   */
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Adds an item to the cart or increments its quantity.
   * @param {Object} item - The menu item to add.
   */
  const add = useCallback((item) => {
    if (!item.available) {
      toast.error(`${item.name} is currently unavailable`, {
        icon: '❌',
        style: {
          borderRadius: '12px',
          background: '#ef4444',
          color: '#fff',
          fontWeight: '500'
        },
      });
      return;
    }

    setCart(currentCart => {
      const idx = currentCart.findIndex(c => c._id === item._id);
      const newCart = [...currentCart];

      if (idx >= 0) {
        newCart[idx].qty += 1;
      } else {
        newCart.push({ ...item, qty: 1 });
      }

      toast.success(`${item.name} added to cart!`, {
        icon: '🍽️',
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#fff',
          fontWeight: '500'
        },
      });

      return newCart;
    });
  }, []);

  /**
   * Filtered items memoized to prevent unnecessary recalculations.
   */
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

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
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Banner Section */}
        <motion.section
          className="mb-10 sm:mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="h-64 md:h-80 bg-cover bg-center relative"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1470&q=80')` }}
          >
            <div className="absolute inset-0 bg-slate-900/70"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 text-white tracking-tight drop-shadow-lg">
                <span className="text-amber-400">My</span> Cafe
              </h1>
              <p className="text-lg sm:text-xl max-w-2xl text-slate-200 font-light drop-shadow">
                Chikkamagaluru, the land of coffee – fresh brews and exquisite flavors await!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Search, Refresh & Cart Header */}
        <motion.header
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative w-full sm:w-1/2 md:w-2/5">
            <input
              type="text"
              placeholder="Search for an item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-4 pl-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm transition-all text-slate-700"
            />
            <FiSearch className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => fetchMenu(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl shadow-md font-medium transition-all duration-300 border border-slate-200 disabled:opacity-50"
            >
              <FiRefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Menu'}
            </button>
            <Link
              to="/cart"
              className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-3 rounded-xl shadow-lg font-bold transition-all duration-300 transform hover:scale-[1.02] relative"
            >
              <FiShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                  {totalCartItems}
                </span>
              )}
            </Link>
          </div>
        </motion.header>

        {/* Real-time update indicator */}
        <motion.div
          className="mb-8 flex items-center text-sm text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="font-medium">Menu Updated: {formatTimeAgo(lastUpdated)}</span>
          </div>
        </motion.div>

        {/* Categories Filter */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <FiLayers className="w-5 h-5 mr-2 text-amber-500" /> Browse by Category
          </h2>
          <div className="flex flex-wrap gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 shadow-sm border ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white border-slate-800 transform scale-[1.03]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Menu Items Grid / Loading / No Results */}
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((it, index) => (
                <motion.div
                  key={it._id}
                  className={`bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 group ${!it.available ? 'opacity-70 grayscale' : 'hover:shadow-2xl hover:border-amber-300'}`}
                  variants={itemVariants}
                >
                  {/* Image container with overlay effect */}
                  <div className="relative h-56 overflow-hidden">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Missing';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <div className="text-center">
                          <FiAlertTriangle className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 font-medium">No Image</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Price Tag & Unavailable Overlay */}
                    <div className="absolute top-3 right-3 bg-slate-800 text-white px-3 py-1 rounded-full text-sm font-bold shadow-xl">
                      ₹{Number(it.price).toFixed(2)}
                    </div>
                    {!it.available && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform scale-105">
                          Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info section */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-extrabold text-slate-900 truncate pr-4">{it.name}</h3>
                      {it.category && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                          {it.category}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[3rem]">{it.description || 'A delicious item from our menu.'}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="text-2xl font-extrabold text-slate-900">₹{Number(it.price).toFixed(2)}</span>
                      <motion.button
                        onClick={() => add(it)}
                        disabled={!it.available}
                        className={`px-5 py-2.5 rounded-xl text-base font-semibold transition-all duration-300 ${
                          it.available
                            ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed shadow-inner'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {it.available ? 'Add to Cart' : 'Sold Out'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // No Results Found
              <motion.div
                className="col-span-full py-20 text-center bg-white rounded-2xl shadow-xl border border-slate-100 my-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6 border-4 border-white shadow-inner">
                  <FiAlertTriangle className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No items match your criteria</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  Try adjusting your search query: **"{search}"** or changing the **"{selectedCategory}"** filter.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                  }}
                  className="px-6 py-3 bg-amber-500 text-slate-900 rounded-xl hover:bg-amber-600 transition-colors font-bold shadow-md"
                >
                  Reset Filters
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}