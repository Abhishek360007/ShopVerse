import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { countCartItems } from '../../store/features/cart';
import { isTokenValid } from '../../utils/jwt-helper';
import { BagIcon, SearchIcon, UserIcon } from '../common/Icons';

const Navigation = () => {
  const cartCount = useSelector(countCartItems);
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const loggedIn = isTokenValid();

  // Keep the box in sync with the current search page
  useEffect(() => {
    if (location.pathname === '/search') {
      setQuery(new URLSearchParams(location.search).get('q') ?? '');
    }
  }, [location]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="shell flex flex-wrap items-center gap-x-8 gap-y-3 py-3 md:flex-nowrap">
        <Link to="/" className="gradient-text shrink-0 text-2xl font-extrabold tracking-tight">
          ShopVerse
        </Link>

        <form onSubmit={onSearch} role="search" className="order-last w-full md:order-none md:max-w-xl md:flex-1">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across electronics, fashion, home & more"
              className="input h-10 rounded-full pl-11"
            />
          </label>
        </form>

        <nav className="ml-auto flex items-center gap-5">
          {loggedIn ? (
            <Link to="/account-details/profile" className="flex items-center gap-2 text-sm font-semibold hover:text-brand-pink">
              <UserIcon className="h-5 w-5" /> Account
            </Link>
          ) : (
            <Link to="/v1/login" className="flex items-center gap-2 text-sm font-semibold hover:text-brand-pink">
              <UserIcon className="h-5 w-5" /> Sign in
            </Link>
          )}
          <Link
            to="/cart-items"
            aria-label={`Cart, ${cartCount} items`}
            className="relative flex h-10 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-pink hover:brightness-110"
          >
            <BagIcon className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-ink">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
