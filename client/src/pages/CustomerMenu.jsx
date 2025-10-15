import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiShoppingCart, FiSearch, FiLayers, FiAlertTriangle, FiWifi } from 'react-icons/fi';
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
  const [networkError, setNetworkError] = useState(false);

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
    if (isManual) {
      setIsRefreshing(true);
      setNetworkError(false);
    }

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        if (!isManual) setNetworkError(true);
      }, 8000); // 8 second timeout

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
      setNetworkError(false);

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
        setNetworkError(true);
        if (isManual) {
          toast.error('Request timed out. Please check your connection.');
        }
      } else {
        setNetworkError(true);
        if (isManual) {
          toast.error('Failed to refresh menu. Server error.');
        }
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
              <div className="flex items-center justify-center mb-3">
                <img 
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABL1BMVEUEBwf////8vDsAAADj5B8AAAYAAAMAAAf/wDzp6iAABAfn6B//wTz/wz3/xT7s7SD/yD74+Pjf4B/+vTTw8SD09PSTcCXu7u7V1h7//Pb4uzs6OzuztBrLzB3g4OD9ui3Nzc3Y2R7/+e7+xEatra3n5+dMTU1xcnLosDjCwxy7vBswMTHGxsaam5t/gIC/v79nThvTnzOamxh/gBRlZxEfICBgYWFWV1cdHgmPkJAiIyOpqhn+3Jf+7tH/+e9YQxiEZCEsIg5KSw61iSz+zGSGhxWlfSlvVB0bFQr+6MFDNBRCQw2qrBlxchNeXxAzKBAwMQsmJwrFlDD/yVb+4q7cpzVRUg48PQ0hIwqIaCP+7Mv+1H/+3qD+0XNMOhWQkhb+1octLwvbsDghGAoREwmGEwXXAAAgAElEQVR4nMV9CV/iPLt3IaaUsgm4oiIqKu7i7qg3Kor7hqLjjI4zz/D9P8ObK0nTpAsUZd6Tc37PPSq0/ffal1zRQv98DU9OTh4cXDw9ve3vv0+Fp97399+eni4ODsjvh//97bV/evXJg4u33z9PHqeM7Pj4eJascDgM/4GfjKnHk5+/354OJv/pM/wrhMOTB28/H6cScQ7Le8EfE4mpx59vB/+MnP8C4fDBBWHH8VbQXEjHp072Lw7+BcquIxz+sX/yGA8OTkIZJyh/dB1kdxFOXvwE2nWMTqJl/OdFdxm2iwiHL34+eqIzDCOR7IWVTJD/S1r/jhuGJ8rHnxf/de+xuoXwv4OfhgueEY8buVKpUa7XBg5XK5d3R3//nv/dObq7rKweDtTq5UaplAvHE06g2azx80e3NGx3EE4+nTjhxZOJcKNeez2r3DV1RJZOFmYL/kl/pd39Onut1RvhRDLuBHnydNCVZ+sCwuGD31MqPoNQrj5QufurMVim5r1MBlb7e1cZqJdyKtNms1M/u6Fcv4xw+OJdhZeIAzqNUMgfmhsoQhqgVDk2m33/ukR+FeHFSVzCZxjJXPXsUiPoAmGTFyGndnlWzSVlUmbjJxf/lwiHLx7HJXxxo1RdjSAUkHRexCRfXq2WwpJQZscfv0bHryC8eDdsfEYyUT681D9BPBcpLw/L8aRNSODV/xOEB7L8GUapdqd/nnpOkHc1mZBEsf74/45wcj9h40vEy4dHSO8KPLpMHR0dlg0Z4/5n7ePnEA4/TUn0C9cr56gNd5rYudq8D4zOK/WwrXWyU2+fMx2fQvjjZNymX65aaak6OaBI8+H+5fj4mazjq5c/O1pboMSE/KrmEjYdP8eqn0A4/GYzaLy3WsF+7Bmh7kukebVxujc6NzY0NDExkSFrYmJoaGxsfnRt/fZPBINLEPG5gq5Xqra3k018hoydIzyYEgSM5+qXPuIHXNl8uV3fm8uk+vr6ojFYPWLBT1H4Q2xo9OPm+QFehudldHRZzQmM41Odk7FThMNvQgKNZPkM616PRQiDHzbW5od6oqmohMtrEaCxibHR0+MI0NKTjqtlYTuyxn6nZOwQ4cGJYFCjdBbxoh+hxsPzx1wsGpWJRqgWJb/iy03RaHTi+ubl3EsuTR2flYTKyZ506JB3htBWofFc7chDfxJu29nYG4v1RWUi9aVimaGxufnR6+s9sq5H54lUZnoIl6akz6X6MvOElB4gTXRUEyonO/X0zxAO71t3MRLlilt/EtlrHq8R1owJskWjPUPza+sbz1f3f76fN7VIBEciZrO5A4r19ubjei4Tiwp6kn9k5m4ePLgV65WycMqz+524cR0gPBA2Ip4b0JEHvuPTMUIu9rREvIbm99aPd4g+ZeaCLJMt+CcPFHHkfuNjdCwj5DXW17N3s+PWOzp6LVkaZ/yxA04NjvDg0eLQ3nLFxaDkia/2JqzHjPb1ja1tXDWDWHYAf/98OtpjvZxYtGdunQif44tAxl6Lio/BdWpghE+WF2rkasipQSNEdc5ZsheNTcyvf8c+qtFrgWnRI8drYxn+iggh145ddNTRQE5w6luXEQ6/WQRMlFadEkhk62YsFuXPFptfP25POvci3/l+uzbE31MslVm7cl7F1CuNpBDGgGYjGMLhn8II1u+Q6Xiy5saQ9e5jQx8vzU/AEyB3bkc5IYna2Xtx0NHUj6qW3ci+B4MYCOHkO9cxhjHg5B2MN+a4AKV65m+aemDe9FrEWcAva2PWBTNr947LYV1w6vh7oHAjCMLJEyGChw4OJc8z2sNeeTR2fdz09r3khfjyB4nxn3WOMRYdOnX4c1g/syBmT4JADIBw0lKi8ZKDQ018/8FtdnRi7SEI+dDIzMjCt02tJUbiwG3M9USZXI9tqBCJ+bfMRjaI1WiPUFAwUb5Unwrrt2MMXyr2cdWefABQKw7m8/lCobC46Q8R3t35xlgfpWO0Z8/BGvplOREcYluEk5ajFq/ruvoQL9eMl6KZtQe3dvEkEtosWBf+1gohNbC3YzF+/fWIClGvWlRMtIXYDqGgYLyqqfKAN4ZS9P7R62c3/QgXjnhAQNpSYZrfGTk+7/x4BO+sD/Uxcdz7o7xBrFUDM2obhEIGkzUFhYmbe/QFx6JjtxG3dSBIpvMLnhA3Z/Kh9PbIjApweWlGc32cRClrTByjE7fK/TGuWYw61UbdtEZoa9EaUgE+j/UxBjpteukXtJkPhZY9+RSNTIcGN1WKoS1ysyWPjxNfcI6ax1hsralARLVcMI3aEuHwu0XBAUUQsH6ToRKSmntW8QlDgJZCoaKnpKGZ6dC0qmbQCHkfoRU3EeFeO+vMXYrOf1epOJC0ILY0/a0QDgtDP6BYCfywxwm47hBAtLlVLFLmRDODobQXm2poezCUVxBSgodCPto1ov+ZpwIRzdzItzOJl8pNf0uIrRBavmhClUG8M0dfap+TgMBt6VAoP0LIiBBRmrOeCLf6QwWZXAgV6e0KftoVN08Zp/bcyDc0bVnc/xxCC2BckUET3w5FmWC4NQxjt/5dgDhLsHpZDDSbDi0qCAlDh7byIU/NRFeEiH2U6VRZGIksxttD9Ed4IMyETEFiJDIWy3hpGEaO4jcijgTqtg9CWeQo3Ze0QguEwDej1DT1XX9XHsYyGuP+lQ1fhAePnEXr8muL4HUGcMzDBlqPS1Z+m/Kel3pEy0Sp2MRFC4PwM/EEph0GVGEA3Pxgwjh3L0PUqlzd+JtFP4T/cTsRL6sU/KASkRr97u2jIUTYlNr0XbAAXmRBu7KWRd+IvBYImMVQv9NEKnKJ9Y0McGpq7EV+IL0c55bfz2b4IdxnatQoXUquWgQzkU9d70h3Ud41PP8KlcZF0DVbbRAyLbNEeHollFYQkhdUWJAvTWzwRJSyjwxRvyyxSGP8d2cIn7I8XLqT7oHxWorK+6lMVzQjq0y0kA5Nz6AlwqyDeWA/N8IliXsBLqzCMnkdstSCtQGfQSGjRvVNtEeGiO54MOWX1/BGeDDFDeGhAvCUAoypAEfy/ZIAIW0FOBTNDtILpd1WXEYIliOUtu4qERyhRforVZDx/XyKUvFKfoBDDtHHCfdEOMyF0BiQktoRIoPcKMkyCGwmUwoUSQH8bvaIbs+N0De9i2xCrXzbKk5TlBIvAG37C2mnScWRUfoMQxIVTX2AE/HR0/B7IuSWMFmXsJh4PcUBKlYQfetX3/4C0TMjYPKL8NgFFxHRt5ktroDg7RTAsGgEpPw20HYaOGHX9X3cvGayKGlUrNeTLayiF8IfU1zL3Mla6wayFQ6AiL/uguRwWVYCoa1B6uA4EEqBElrYWqJ/J7/ZlRBaCpa8LOf3cZMaxuj8gwTxjmsbw8sqeiAc5jFvblUWwg0GcEPiW/II4LxAULsrIRwJMc+a/Lm42zKSl8HOyvoHFGyRuUVOe8MZNTUvxQL6KvNQjbhHut8D4RszFL2yEOL7CeoZrisUXM4vwzMSJ6VfMuFoOpRm4tMy4+TAOmvbELRNn6OwOOgVn+CHOaBias32qYgosmz4uAefuhH+SHBTL8UT+IXq6ZTKouShqPNCbJn8JNQkBkUmvvRtZZB/CQJI5jWE+oserwhjZjQ+7IcxETf8cTefuhByPWrkKrp0zXl6zTWlXgiBHtH1xU00Qoi4JamJ6cXZDgHSyHibE568sPy3GWJNi9uePICvhkBiorcSn1aYKHroUxfCJ8ajiQEZ4AfEg9E9zRENLtFvDC7DP+RwYcEzlm2Pkf2HmJv+WQTivOTD5PgYnOPY0LEEcSDho0+dCCenOI9KqV98E3PKNhUw9G2a2etFEvso1uwzAK3vkgCZ6eJp7+iLPhHVe9E523nEiGcYp5x234lwn8dMkh5lWiYqW1m0uQQMRF1MIOQgBL6fIpwbIehR8Ei/EZUsI5S1lsm8D6JthNigCnNtsr+HWyLkQaFRsyUuooHuimWeJYALYCA2EdqcDk0vcO/FJy3TMULq06aLu9PqFdFIUTKNGO9Rs3gj8WnN8AwVHQi5mpFsvUniCQg911VfFF70CLXThKOWqRM6ONMliLM8oyr5uwht50MrknHFO5BpkN03fMSVzUkrhBfcXTuTLnVLWX5PdUY1cMnSu5qWh3wTYVoQx92uIKQhFfEEwRDZvyHqJ5SWYzESS8VAOdhWEZ1x5+3JH+F/LHsYL5v2m4mA8YmN/XGoUbRFY8AFZqjJj4uhYmv/pSOIM7tLy5sSQBDOaTXYxOt9zERbvzAxM4qOBKqCkJMwd6bb3/qgDsSxK6QnLhlwJmHQQWAmtLndHU1jYUJyomORCYXyEYzBQ40N2ZGUfpbzIKKCkKXw43VbQ+HbDHUfPFqfiLzkLRWDVFXX3YW2QC6LrheI78HwR0fF05q8YGNMDfsgvOAO6S+BhzkzsbEHFwnprUdWnBqh+4sF0+ldL/fthupA27XRL5kkjj95I+TJp0RVUjOU13vcPCruTsnYsRcafBGdBiI448Uhpr5H+dR+/6iacKWlJIQXzHmVHFL8B/igb82/9slC+f5/x6ELwCYFHzuEX0CfxmwXXOdmXw4UbYS8DGNUbb7Ga1H1HXk8AloenPZK/LZagVs1iBNvybnnwuuAMCOUjYmr3CYOeyC03BmJhFfUwV1vAZBqdl9Lj9neH2dzExLFZBNhjfw/+dmzjVOzco1+N8dNKKGk9mwi/mJO5/gPD4S/mRRKYSG+ToF7q7VE6O9nY/3v6kCtdnapNhHj5kC5wi5pNs/u9MNLVFnVL8+8CIu+5ZUEufsez6AoYraiQHUmie9uhFZQIZHwmYYUV20A+i39rpaD7Xi98fqqFDhjrZxMlpv0F/gut4r/94qqZfRaanpChBi0BRFNHTJT0dGm5dnoFcMRYgiELAdslM8tQDgCX06NKqk1qxumveChu1Kc970kclL1CtHCJvN7iSu5ihsEYR29NjwR0upw2pmSVJw3MNg9IizA52UmiW9OhLyebRzaJLyFr8ohBVx6a6mQLxSXR9ph1Fdz0valXtHmQMgGji/jFHyUO8P/G0B1grB07s0rNEJTf4MkiEwbRufEY6NDdl9hMCyEP3hQcWSbT8hpRa/lNno0s8IT1HkvCywt/LekbLWLv/KP668UMXPtCdwz3KgBwgFfhJtF+V6EfRaWZA8Y34Ms9YkYQ4QYFw6ErDUvWUP2N2kCWCkRzAC+dH8/s/KtIHLTa68ce3WmVgerm3zlCMNnGkeY80GoIU3O42kzENXIbKtDMUWiBKolFV3DEQ7z1P+d0OM0xExdS0qc5uAHi1sj27uFllYKlHZOBWi9O568TQ7wn+Jn5/+ronKZIPzrp9EkfJvLLNqWXy9L2tjSpN/xjM2kgvCCh01Cr+MXcGd6pHQWDWHAfSJrs+iI1pwIa649zCyo5qqOI9QvE4d/GcKaP0Lr9ujb7rRVxZE8YZNqxKhIaJi8pGhFGJrMpFKpiSZCYqOaXcmG5Ncg914o2kV/Q3zUcCFkOgwdJmWEv3oPj0p11CjrtXhLhLS0QeENFiFsKyrqFMQpI2q2XNdY/acM4eQj0zOX1qcitFQXu5GlcBa4w7TgDnpVzvhyMym0A1CENSfCO4oQ1+JHLX3D2UI/owURjoWQ0pBjYnBs+sSzYl405YVvTWJSo2oz6W0fRE1ynxCQTUr7EoHw9dasfIKCkFpaVFa4tNL7elkqo0ZDqyZaIEQazdwMLu72QyED7i1nTBwPS8JEehMeQ2myJj2z9QyYCiX7pEEqWkoNFdWarfpEA26E1BCZeimsIhwAhKXGebX3rhUNVyDDP0OxzSLgJrn5JrIzpugM/UzWphThMGOqnCAZfskAayvJmU5oWHUjDOeICOBmTkaIVnsHfuXKuFT6W++99PS9+QVn09BHxbARlVMobMl/ZkpD6BqMeSlqWCD8QYN7KfTFpyy/pjhsy3KHAdRBfTNPLmtIF4FAzIOC8Ky39ivXiJRKR2Ups+BxQY11WEFdi7xm5Gj8o65bbOyPpRb5/VnmlCJkie6E0KSRJq3R3Sh8I+tSnZZFfQ2iL0JiHhSEh721Sq6hlUp35d5KC4S8dk59OEi5OW4cicwBRQSbojNmL35bCHm5ydak+KonRt7JjioZ1B5uM8cb0peeXWscoQ+X6hUV4WtvtRIu/c3lLhu9qy0Rov5QehvKsZ7lKHzTJ7snRJtShDQOBoSs/cmoC79Jp19wJi+4T0PknXpO3s2S7JN+msaJcKC3vmqU7gjCUu+Z7+XoR5dYOsg7rMFNEMQJoU21OtWmNIQChCxBY9TssIIamBencmN+aShN/9efR4FL3FxKrYW+qiKs9ZbPjFIll6uUeg9bI5zJ55f9/8zCBFubsvYM6tZoQgxzgk3wDu3o8OhtnuFFmFC62KoRXa+4mTQO+R8XwmSuYeQauXA53PvaEqGmeXRJ2wuvM89NPADVprSYqIkUlO0Y4g0Ifde8ssDEd8r39+eXPLN79v08vLbwq665uJRoJCPM/p//yn+1vuPVBNEccztcm2LNFkTNyl8YZesKJKwATbrh2XsYLMj38rxBj+m/OEJGMFS3Zwq0RdhyYW0+JlcA+ZXjkxThAbWGdmiId4juVdqOnCjb3pBzibQSdfAI9UsGiQudrHPbcqn6CM53TI2+XU7kug5SbprVAZW0xfCZBFyxUb898sEewWEvDOMILo+PGHKuOPVV+1PxVj6NDYz9d3N2aVf1qPBxVLYXXBxAEDXLKQ3b1hDKAdHTT6bY+DXucmoWgylqfK4gxM2yxaaJavstfSRmo7BYLWpQyU/hCJBFaEd8R68KrqnGK05GQygalhZQaxUdV5asShcHyDNROML9Ut4mgO+4SorX/ZIY0jNsFmiTP+3SdYTB3F6krCAR/2UXfgSETNHE6yLXThtyMkoeGC2MdFj+NHmsy56/wUuuJuKxheWioV+8WPI3AI9CTwTkGIhv1b+04mgc0E/7pDoUsfmUTacmCcKDhMRGADBCGzlUEhb78y2SFt4QrUZ6wh9CxhB7tQnhhLJPxQMoUrorg4SFtJV8GX1Lq80o+DYl+2E6u3viB0HIS06vAuFVn8saklipVVrGc2HMIRole1efpcVFIIF/kYDcaLQK8K2vLvRDRwsFukIDfRUh1KFi85Z+1F/Zq3wiCFmy265sUy+2zxFX5KGWHdAYintqDQZH8ji5jrUVp4mJC2lU2/MobeovQDMK7fpAjmSNFnkYg2jBEkSuB7JvBCHz2Uq/hCoFex9TU93Esw8NFopLy7Nb2zMLmwEx6tTFN2QOtHzyOylHnZCLJS0QaoSRlhaWaeMwWiCUVBozTRNSbhlLQeq/mFfzO6Txbdqig8aMgHcwodh7JNVR+6fzhcWWXqkEccDJgUz/GDkptU5CxlwziGmiXe+0kQdijJGCYzMHTe8LTwzfMYQ/hzVW2zYaorAASY/o3IO8IQaYnocU3PFusb1FvulRyXLQLDzM9ZaKB8SAGA0UxLugTfIh2hIGP206PHFWLbXMOG5SnZY9mdR4IrEsbOXLhFKuoteegUrz7PJScWWxkCccOx2MhuBaJxRDx6IOoyQlR1EpWQ94NQRloSXNytmqf6WVJJEYNjHL6j0ShMzvFjeh/SUxR4qG9gXR1VwYmdme3dKCLXTYW1I39l3mKMdIsFG5txpQTRNFurDppwPwVQbqF9aDIx4ET2oHzG7YfvdNDy3+K1feKuSXrTcXXJnSdKFKH+bExMtSsRDVe2uBDVGLW+PvhPlicxbzIbZ1zzjQWPnejl0YOztq9+TlBX0GZel3Dvrgv8A8kgPVIcIWC0fAXAxZISLX2tkDjbUJ2TkE1rnpDA4/2U6C/zrCPlZdi9f17iM0MQR9GatxhAgIABu/0FjXs8gDsZqqXHP6ysLNsMMfo41ZcTmQ6BZCjebpRcETrTKETxZCy+ayAD/j1wXV6U21nCOwRZAjilf/AQ01VvG0GiuICuAIWfwrcupYgzeR8Q3wO7ypVnKk0PRDxc3XqC7tEkJoo+yznDH9spe5bdq+ijDShF69iVZtUB0s040Qtrf8I4RK/ESUHEW4zxEm7wRCSJBP7PwzhOCr/huE+rocMuCjJEfIC2tHFsIdqnMDOYrtF5FDB0L81wNhUIvf5mZKUETUOHNMNbahORBC2uptBprSYn3DpWlMTEz+VxCygTxeD4E3+qSaJ0cYftTCToRDgNCrlw1XyIOZZq1VGcz5lXPDGb1DFTg+ICNsdIIQn9egOnB25n4IB8JzhnBK0JD/gSM0PRDqAyUE4UKQYM666d+kU8Ygz/0VhEfQ/4qqHjGzHw0tOQyAsEZ8TP1XLkDGQdz0zqVFwJtyIAwaW9AraiVCPlSru5tUPRESOdx3Ihzz4VJTr5J3rZ/l2nVjSosYJSd9wJtSEQaOnthTNMiX0WvDnX10IBS6lNvDu7aaxtTKRKb011IHE5FdsQXzpqRCHiQYO0FI5Jh8GZ2V3I0Nqi617eGb0+KDPRzysIdms0EQooFSoIBcwCk7nh68KVmXmnop4fxMy0vWiQjqqx4IVXto+zQOvzRC+4q9fBpTa7wyhB08zllvw4nwV9KBMNcpQgQbKj1oqPo0vxyetxVbcL/03pNLKULnI7d8nNdeJ1ND5klBGMnFO7okRehFQ7oP1PZLRWzhiA9NTJNyHq3PXA4741KiONVBZLThREaIzbDRiWhThMgTIdRbxP4lwj48PnTE+P7xoYnrRPPrh7kO5j6iajLuUFq6E+E5QRj8kqBLCcLDhrvRzxEfihj/wHDkaTxjfPps1Fqs+ra6eixUjSePnDQ0eBcf//koLjVjtV24WToEe1h22UMTdjDZfVx2nsYqPbXM0/DvEI2AL3MBSpniK2XD2c3FENpEg7JwsIww//oU+DR1t0/jzNOwCsmUR77UI9fGn+UQEJ43gvul4GY7e50AoVwOhdJ+B24SvgP+RLUBN8KdISnXJuVLXTlvj3wpf94mPAg+8t424Pk4Wins7ASicij5XPoqoWEHbKHBQ5jn526nDboNo6OmyW8tct7OugW+cue8+WLOaifBE2T1HcEFBmsh5UvRYTyc6CBcYfc33W9ZzXlbdYv3Ybv2ZJn877Ru8f0rk2TFTUlAn6g5g/yEkvNGr4SmLXvagt4MpgaI9gNs156c9UOv2tNnFzSdxB2uN/g0ct1CH4iHDY9or+OFP2JSP6VcP+RdbUJ0Wf2wK+lEuI1RV825XkkqtSdoLjI66aXxWTwNKlwaunMlHH/yquODA5u66QrCQ9BhjplE1JuyPRJUNcKuRMAnVuQ77XOyHGqrjn/g0YvB6vhee5s7XqxCqho7mm03HFXuLiTbWB1/jvsOplnl5tCjnwZr0DA03xUaQntbSTV26JVwqa08g9fx2yz8HJV6MZR+GmdPlInBN8gEd6R8l0nHGtqtx3RRf1FqMYPddEa9A1/XZ7F+GrvIzRTNu9zXJnwPtkO6C8rUpNN+c6pTQ/eU2G4AbdQ0PLIunS7aE9VneaVUn4m+Nt6baFcQu9DXxi50Dr5hTjUFCFDbxX3aki3t6/z0vWhf24SoACu9iS7fm/b2f603kV2INdIeqgih+iy1egbuGGpzryuYAzIqWq2U/lLeI1yydB7rvfHvLw1+V7oVz1CcZFMHj9je2sE6URuXX0YIM2aiItGm9gg7+7yJ7YQAyrNHuLO7XkILppxYA5epZMgMw0at2f1Kn72VOSpvQnT0ebt69akgevZ5ixWoWYFtjleKFEQ2aZ+UyD3pZ/TtVr6KELZLxsasLiBnr77Yb2HZ/O8QIk74a3CEvi0HGCikV2jfodIby3x+O28BoQVZX3W9mdstmmmc+y2ce2aoRfTYb8GfCfYa51vsr7Q/SbddKI0X1tbEkhWEoQFAaLTeTtJ+UQsXlVq+WHD4n9++J5pbde2ZYU+EFvhe3PZtUdR9kbuPNTHiMGc5piydEm+9nURr1wyCIzHZS3Hte7L2rtn24hjY1LnviXYLbRd5C3KAqVBsw6ihuG08qslZbhvbBJZou9lidqEVRrrH0u5jd+9d4zu5RcorsjPvTrgBdy7n2V7cFfdkUa/HYjfKyalNnW3SFYqbGS5XDc55pZnpfveQIbHYhtDUhpAyPsPF3n/o2kPqsf8Qbc6usMm5MK0UFcROvRbPVXY0BGtCywk3gH0m0aaCSPd1+SPEx9DwNXRvadJV1x5S1z5g2gUXm5BTGWiXkW+R9ldDi67n0QfKczH/Pik7pnw3jeUGmIjqhHjrygVCg/LoSTdClSB8XFRW3gfs3MvtsQ8YBlwOLs7SiTHLdEis//5DfhG+9UDZlWYh5EbSZBtajdblHjosctd3FkdkZ0zO01t7uafkvdyu/fi02hibU4Y+F2FWIh132b9SoMMHWiN0bPrliNg+aysixBpXAa2KIXyDRX7pm8/uw2cIhsas2QG6135810wF3Bxyem7W3tE0U6aukSquZW1ykoXM5MenWPESr9SGjVYBIlpO85HYxW0Ps0HT+TbDmXrda6aCcy4GGy4ZvVbr+bClOrSkLfWH0oV2PMpyvWrUAlnlOkfI4iVexwwnW+T16aDipWV6BE96ZdZFRz5T4UGYez6HXp2L4ZptwtST2sEHokh7hUe2ZwJsoUGvfOuTVFqyBuRY8RKv8tlVdk+EKzASenOrQEer5GdVX4MFCrae8Zlt4ppPw5JzqT25pWDTGtokuoRbehp8tEFYLkvgI46Q59itvUOt96qjbbpTHc0wezWt7ulSZ5tYk3Fc82lcM4Zoyq0nJvk1SHOcskFcgBY20TTrFkJp9hTfXWqpbWv/Ra9/Tpi9Uv7PGfeQTboRLTYfEXqG3dQ1Y8g9J0oH+VWsPlpWjqAAveM8k0JFyDc+5aQxhdZw8TBDjWqcS31db7QpvVSq7PKDym6gezpa0CpaEzFgesY1J8o96wtvgDadkOrdsIj5fW0AAA6DSURBVBleBgjbHxb9GdWacJKUBtqa52xPmZFjMS9HHC/5pvbQUl7ZdEwYRzZTYk6UZe39Z31xXWPPa4s0IWxOKUSU3+YWsxotHHDi4huGkajL5SoMI8CMuEhPoQr5Od7wLa/BrC+YDC3/SpHC54xi1niCxmtem3vmHr6l89o8w0REnbg0iaNaeFMmHmg0GnX16VGF/K5xKCw8Oms0yqu+16DD+dO+E9tYY0V03ioGWnzjOXPPNTeRWdLoqNehat+AQ6e3YJ9O3t9wYO3o6MjZUoDJ746kcerY/RHlXjC63GN6Kb/YFZ3XJTZWtpyb6J59ScLEmGsACAVIZ6bCCSKwhayF00/PjHc9lfPMxtYdq2y7U8FzpxWfmyim5rWefWnNL7ULfmaEFtrGHPVgNo86xI6umgm+Ceqzi40wdQ7ZZQghPROzS4HWUBWf+aViBq0QHDbHtk+tQ6EZ8J8KMyssUNxtQcKvQuM7kOhQbThvwXkjNkvdnl+q37WeQRsKTTnnCNNWMbVDioo+HFk1Qmc2/tP5wcXd2ZlvzOPv95i0y2bKkchX+Nz8gKuE3xxh9yzoCPSoEIdhRxpqNhNi0+joiX5iuln3cbJXmU4P5leWlrfoWWCOIXjUYksbeq2DPFrMghbzvIXss/GQ0VPZPSUhInVlSDC8QkWQ+I3Ls8H2XHaCsBByrRVZGPEfeP1RMbM8yDxv90x2omyAEWL3smfDT9ki3j47aAYV+8mrXu4yGZmZCOWnpb2rspNoModUmvYRYCa7PVdfRAM4MuScd402+zmf8sMc2WlyXRs6L+5D3cICHC40u1RcLOSnFS+YpiF6UiLTIoZePoZaIfwhzkawLxSTO3HorZUpUWAT08WVUCsv/JMQNciZFGa4Sl1QBhazwY6pOTFXP+DZCHyasHQGC2/HVDboE1G0h9zDbKVFmnxrH/Z3CpEmFbiZULUZs/VSYGAZ++zP1udbWOeRSQOTcZOOUJw4liPFJft1AkJiGJf5aUZfRakAYd6Tx0B262AYwaNm4DNKrLOQ4q82n1LnTTkeQXmKEXru1EyxSAepffuawkGbSwoe6he6ZqWaeJ0e9Lpn8+grz860PWdGnBVUksLWdXbmoTuGY6fNFCDAYO+exKe7LSsM7QBug6OrJBI2aRiqyjg/dMOurPARCoHOCgpduM57ikTo2bHyAUv87syxWhEiSDPF08uft//stMC8/JK4W6oEhQ9UwduGoqPznsThjtKZXZgOcINGKbWBC02nIcNvH/eHRhbBeg3uftb+81M+08uKMC73p2cVNcrO1xLN6OLMrqzHMY9e564lXOeuWWdIbaiDCDTiV4HTmLYPFNOW6STVfNt8sQ/Chf5QGmLeogJxVpZN633bBswavGUkPI7q9Dw7j59EV7KTmHzEvuPkPJhEuUBVujj/geZU0x2Zf1V5kkt+o2wpGz/5I/xY2aitZcR4uKBn54lDnxLS+Yf8cMDMrQIRpgmPgCqwj70jPyzOFkTWsY1PzuYuS5MgYC7qCE2REIvrGfTSwcjE1IvsD9b5YDHXUU/+CIf5iepxO0tm0goWMYvyTgw0AnNrBqW50GimH55wc8T6xObydguZRNrI8sr04OCKIBgI9TI7OrHf81wS6igT2/UiCaF1hqXncbKtzyGV6usRfgppRqnWsHSG4EmqV1ekGeNUN8qnGgn3hP53xCqZ91t5Aj5kZIQGFkXXy8HN65TjPFl0xgenxX94Yml9lmw4Z494st5e5lkOpUaKg+mC0HxAQnmgFMyrks+m3NpdXoCgZKlAbR4MfSWLhtTiCpCD3eVnWrnPB6IsKtdT9KNPnSVL/FP3ecARdjJSrGddSaHKs07YSYg2yTRGCvFnPiv3W54dbwyDkeBsB6JALbcdpkH1A+TpXXoSmAIRP9CzZOVD88R5wNmfPkj8EE5aoiid6YzpkR4kWrzxyY7RWURSXpyf9luQXkCaIizwI8yYKQXeFrPQN1ngSyST+DfTy8pJD9TbJq/YBmif6TzV6ZnO0rncdso6Elljx6p/eO66sKRQ/LydJrY7bR+BBwiX2cml7IhqNNsPwfTMoKgos+O58lSPok3ZyTXxMTtgfcie0mWfy+1yuNsj5E026tnqmIRS1Efd86poou1+eQQ2LU4Xyf/0Wzlj8vQUIWHeNJ+AOB1KL630S2cBsHG6PLaWCBjRb9mh1dIhXV87W12cCkxshn3CCI7wI87n7z1G1BbVU9Nhstomko4U5x0cdC4ZP5KTD7XNi5yrCMPUhcWh7hJAMdbP+yTgtgjFaY+JAamIq1PT35Mitt+xrQbUYL9kGbaoXiU4hVMJCGEuIODiCJfZrWwXCM6wdPfM4Z29lPNQdxPzkzl9TH0AhMPvnFFzA0iqM7BT3GOZU4e+AVNhF9sojy6y5oZdiQMthMymgG4aJD+lxZsBxh10mPqI/kKVaE/fqF2xNdEAH68pVyk6Q2gVa6BhBEuv7juVeHK7F8dmEbQ8YgPkfSm70vg/KwoBjcQQmsQPHRwp0gqaeDN5RzoEazexqPPMc4ytkdqsBfFzCK3aN6WiTTD8h1oNIvQOsyGf6LfVb1/GEk43Qs64i9IJmMiReo3gh2sm+5kbXZJBQcFHXzUaAKEwiyCLEsTIKRXGWOz6xSmN/DFpV8NuYZDN/uZ6hB/qqSBchhewqUBUw3lzg+pQqmNsdWDLoL+dCISQmEWhUSUbGMG3Y5SMqYkbzavZxzo1XdvaXewXx4dbhw/ICGfgsFYqtF7nmEbwy2iUvUzZQGFNaNE2FGyPMHSQsCBWddshNfGf+RS78/yLRwkVshnUL0NIMhfsmBNEnTkLIfx7m7jaiwV3YiBCbMQQI2DsRmpe0q0STDgbbwewPUKbismyXK/G+IZzT3TtysWqcO6NZCIsOLReNTNTlE6VFxbEHUhibWOsj77G6Oi9bt9Cvywng1IwCEKJUUtHUoMd8aLm6f2JxjnVdCcdbbOxJKIL5pJBQCmFzNvFZc/iJ9avRnvY9XtOJQKa6KgUDyiDARHaGtXInclIBBljqcz6H79aNfS9S/EjyzTJAYhXFsDE5vFolF08NvpH4hGsW/FgIAoGQxiatEy/kRtQIb6s8cdIjZ3uYO8GQyQdlIbQbHFxsegu5yqLyN/zdYaqsljfmGKSsD4gAJ4EARgMoW36DaN+J7eCYnw7R3UdedVDHw/Yx3bIqSYYrdr6FACs3RL+ZAKY+djBCofWDQGwpaHvEGFo2PJRw8nSqpw1NQmrjnGMfZm9W88pXL543Ytc7/50ro8yBnF+9+7ld2aiSsmaEj7eyhf9BEJRz6CcipR9PvhhPZNiGKOZuZuI7sOt7VcE6/hqb4i9sJ5o3+izUkjQkeDQ8Ph+QIDBEYZ+WCo13FuuKKoT65H1oRh7rFhfbHTjvk2LjA88vPP8MdYnXtb1la7sJ9Ir5d6wpUT948HPIyRWwyJjvKSSkdDxz/oYZ62eVGxsb6Op6zjwRluToNMjxx9znBfgPe3dqm9JR6+WkQiPB1KinSMMTf62qGgkHGSk6mG+h/NXjFBgdP34D21/asOx8BG887KxNhGNWnxAlNa9+kUgoHXoJwkH/XIyX0VIhHHKwpjI1Y6QghFU/NpYihOSSFHP2PXHzUuTQsCRSMQ0rWkW5B/wC/aHh+f1tfmJFKceIV/P6LrD8BAVWstZh/Nk4z5pw64gtP0bYjdKZ+oxuKAH/2yM9likILIU68kMze+t31497DQZtayla83vL883H6NjE4Rm9jeiQx/HTZU/TR2flQxBwE449BMIidkwBMZk+cxxUDERKH3nZnQoZlEEHjrV19cXy4zNzV/vra19fHysre3tjc4TZOQPqaj4YE80lRlbeyaqWLWpun5WThrivXbEoZ9BGApdJC2FE47n6pfuI5tx5OVmbaivT3p4kC1Cn1QqFY3Cf6IgczH5r6m+2Pzp84NTCZs6uqvmxHk744ngOvTzCAkZ41mBsbdawU6MhFt1/OcGGFBoD99FgEczQ3Mfz2AMHR6RqeuValLgyyb2OyXg5xASMp4IiETlVCvIFVnQztLmMchZhjGjCyghKrDv0Nza6e19xKsPVUe/qjn79K/sY+cE/CzC0LCtVOE0qnrlHLltH22fNZt/rjZO9+bHhiYyErxMZmJo7nrt5vnlO1O2rm9jdF6ph4WCIUY+sBfTDYREqf7OSnSMlw+J7fCyfGDMMVh/bef+6vn2doOs2+fjl4dmxDIjHl8j4nd0WDbs866y2d8dqtAvIyRe3ImEMR4u1e50N7OqBFWXrytA3shdrRSW8Z1cfI6AX0JIxdE+1MlIxuuHl61ABlsE3uVhOZ6Urpw9eWr/MP8EYei/p6lxm47huFGqrmLkza5BlglfXq2WJPYMZ8ennj6hQbuEkKici5O4hNGIJ3PVs0vNQ7kGIZ52eVbNJeOGhC9+8vRp/uwKQuKOX8jyCE55vFQfqDQRChwngv0kYXFloF6KJ+TDzLLjJxdfol9XEBI6Hvw0FJBEx+cA5d1fHZY/UIBGlvb3DtDlDEOGF84aP398kX5dQkjWwZtKSBDKZCLXqNZez37dNTHk0yhYHWwHhUV/pR39Onut1Ru5pMKbVH0+vn3WPqirOwgJs/54zzpBErGMh3OlUqNcrw0crlYu747Yurv8tXo2UKuWG6VSLqxyJoOXff86e/LVLYRkTT79fHSBZExrJJK9sJJs8X/Hncgs6v38mvZUVxcREomcfHqPj3uiDLay2XHj/emgC9Jnr64ihDV8sX8y5WbYIOiyUyf7n/dd/FbXEYZAuRKUHdGS0C5+st9l4vH1LxDCGp788fb+OJVIZFvRE/6YSEw9vu//mPwX6GD9K4RsTR48vf1+P3mcMrLj41kOlhhP8tN41ph6PHn//fb0o4tqxWP9W4R0DU9OTh4cXDw9ve3/fs+Fcye/99+eni5+HJDf/yvCSev/ARhSxh9RUBbPAAAAAElFTkSuQmCC" 
                  alt="Town Tables Logo" 
                  className="w-[100px] h-[100px] md:w-28 md:h-28 rounded-full mr-3 border-2 border-amber-400 shadow-lg"
                />
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
                  <span className="text-amber-400">Town</span> Tables
                </h1>
              </div>
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
            ) : networkError ? (
              // Network Error / Slow Network
              <motion.div
                className="col-span-full py-20 text-center bg-white rounded-2xl shadow-xl border border-slate-100 my-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-6 border-4 border-amber-100 shadow-inner">
                  <FiWifi className="h-10 w-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Slow network connection</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  We're having trouble loading the menu due to a slow network. Please check your connection and try again.
                </p>
                <button
                  onClick={() => fetchMenu(true)}
                  disabled={isRefreshing}
                  className="px-6 py-3 bg-amber-500 text-slate-900 rounded-xl hover:bg-amber-600 transition-colors font-bold shadow-md flex items-center justify-center mx-auto"
                >
                  <FiRefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh to Load Menu'}
                </button>
              </motion.div>
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