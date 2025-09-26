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

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    try {
      const res = await API.get('/menu');
      console.log("API response:", res.data);

      // Normalize the response to always be an array
      let menuItems = [];

      if (Array.isArray(res.data)) {
        menuItems = res.data;
      } else if (res.data && Array.isArray(res.data.menu)) {
        menuItems = res.data.menu;
      } else if (res.data && Array.isArray(res.data.items)) {
        menuItems = res.data.items;
      } else {
        console.warn("⚠️ Unexpected API format, setting empty menu:", res.data);
        menuItems = [];
      }

      // Filter out invalid items just in case
      menuItems = menuItems.filter(item => item && item.name);

      setItems(menuItems);

      // Extract categories safely
      const cats = Array.from(
        new Set(menuItems.map(item => item.category).filter(Boolean))
      );
      setCategories(cats);
    } catch (e) {
      console.error("❌ Fetch menu failed:", e);
      toast.error('Failed to fetch menu');
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
    toast.success(`${item.name} added to cart!`);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      className="container mx-auto p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />

      {/* Hero Banner */}
      <section className="mb-8 relative">
        <div
          className="h-48 sm:h-64 md:h-80 bg-cover bg-center rounded-lg flex items-center justify-center text-white text-center p-4"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1470&q=80')` }}
        >
          <div className="bg-black/40 p-4 sm:p-6 rounded-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 animate-pulse">Estate Cafe</h1>
            <p className="text-sm sm:text-lg md:text-xl">
              Chikkamagaluru, the land of coffee – fresh brews and exquisite flavors await!
            </p>
          </div>
        </div>
      </section>

      {/* Search & Cart */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search dishes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-3 border rounded-lg w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <Link
          to="/cart"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md"
        >
          Cart ({cart.reduce((s, i) => s + i.qty, 0)})
        </Link>
      </header>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-sm sm:text-base ${
            selectedCategory === 'All'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm sm:text-base ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map(it => (
            <motion.div
              key={it._id}
              className="bg-white rounded-xl shadow-md overflow-hidden relative cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition"
              whileHover={{ scale: 1.02 }}
            >
              <div className="h-32 sm:h-40 md:h-48 w-full overflow-hidden">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt={it.name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="bg-gray-300 rounded-full p-3 inline-block">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                      </div>
                      <p className="mt-2 text-sm">No Image</p>
                    </div>
                  </div>
                )}
              </div>
              {!it.available && (
                <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded-full">
                  Unavailable
                </span>
              )}
              <div className="p-3 sm:p-4 flex flex-col justify-between h-40 sm:h-44">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">{it.name}</h3>
                  <p className="text-gray-600 mt-1 text-sm line-clamp-2 sm:line-clamp-3">
                    {it.description || 'No description available'}
                  </p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm sm:text-lg font-bold text-gray-900">
                    ₹{Number(it.price).toFixed(2)}
                  </span>
                  <button
                    onClick={() => add(it)}
                    disabled={!it.available}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm text-white transition ${
                      it.available
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {it.available ? 'Add' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}