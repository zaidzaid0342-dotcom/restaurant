import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import API from '../api';
import { motion } from 'framer-motion';

export default function CustomerMenu() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/menu');
      let menuItems = [];
      if (Array.isArray(res.data)) menuItems = res.data;
      else if (res.data?.menu) menuItems = res.data.menu;
      else if (res.data?.items) menuItems = res.data.items;
      else {
        console.warn("⚠️ Unexpected API format:", res.data);
        menuItems = [];
      }
      menuItems = menuItems.filter(item => item && item.name);
      setItems(menuItems);
      const cats = Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)));
      setCategories(cats);
    } catch (e) {
      console.error("❌ Fetch menu failed:", e);
      toast.error('Failed to fetch menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const add = (item) => {
    if (!item.available) return;
    const idx = cart.findIndex(c => c._id === item._id);
    const copy = [...cart];
    if (idx >= 0) copy[idx].qty += 1;
    else copy.push({ ...item, qty: 1 });
    setCart(copy);
    toast.success(`${item.name} added to cart!`, {
      icon: '🍽️',
      style: { 
        borderRadius: '12px', 
        background: '#1e293b', 
        color: '#fff',
        fontWeight: '500'
      },
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Banner */}
        <motion.section
          className="mb-10 sm:mb-16 rounded-3xl overflow-hidden shadow-2xl relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="h-64 sm:h-80 md:h-96 bg-cover bg-center relative"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1470&q=80')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-800/60"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-slate-100 tracking-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                My Cafe
              </motion.h1>
              <motion.p
                className="text-lg sm:text-xl md:text-2xl max-w-2xl text-slate-200 font-light"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Chikkamagaluru, the land of coffee – fresh brews and exquisite flavors await!
              </motion.p>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
        </motion.section>

        {/* Search & Cart */}
        <motion.header
          className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="relative w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Search our delicious menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-4 pl-12 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent shadow-sm bg-white/90 backdrop-blur-sm transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link
            to="/cart"
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg font-medium transition-all duration-300 whitespace-nowrap transform hover:scale-[1.02]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Cart ({cart.reduce((s, i) => s + i.qty, 0)})
          </Link>
        </motion.header>

        {/* Categories */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCategory === 'All'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid of Items / Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600 font-medium">Loading our delicious menu...</p>
            </div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((it, index) => (
                <motion.div
                  key={it._id}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                  whileHover={{ y: -8 }}
                >
                  {/* Image container with overlay effect */}
                  <div className="relative h-56 overflow-hidden">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <div className="text-center">
                          <div className="bg-slate-200 rounded-full p-4 inline-block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">No Image</p>
                        </div>
                      </div>
                    )}
                    {/* Overlay with price tag */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {!it.available && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                    {it.available && (
                      <div className="absolute top-3 right-3 bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        ₹{Number(it.price).toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {/* Info section */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">{it.name}</h3>
                      {it.category && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
                          {it.category}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{it.description || 'No description available'}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-slate-900">₹{Number(it.price).toFixed(2)}</span>
                      <button
                        onClick={() => add(it)}
                        disabled={!it.available}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          it.available
                            ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {it.available ? 'Add to Cart' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="col-span-full py-16 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No items found</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                  }}
                  className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-md"
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