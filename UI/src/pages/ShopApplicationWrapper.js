import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Navigation from '../components/Navigation/Navigation'
import Footer from '../components/Footer/Footer'
import Spinner from '../components/Spinner/Spinner'
import Toast from '../components/Toast/Toast'
import { fetchCategories } from '../api/fetchCategories'
import { loadCategories } from '../store/features/category'
import { loadWishlist } from '../store/actions/wishlistAction'
import { waitForApi } from '../api/warmup'

const ShopApplicationWrapper = () => {
  const isLoading = useSelector((state)=> state?.commonState?.loading);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const [waking, setWaking] = useState(false);

  // The free API host sleeps when idle; if it takes a moment, say so instead of showing an empty store
  useEffect(() => {
    let done = false;
    const slow = setTimeout(() => { if (!done) setWaking(true); }, 2500);
    waitForApi().then(() => { done = true; clearTimeout(slow); setWaking(false); });
    return () => clearTimeout(slow);
  }, []);

  // Categories are used across the header, home page, footer and product pages
  useEffect(()=>{
    fetchCategories().then(res=>{
      if (res) dispatch(loadCategories(res));
    });
    dispatch(loadWishlist());
  },[dispatch]);

  useEffect(()=>{
    window.scrollTo(0, 0);
  },[pathname]);

  return (
    <div className="flex min-h-screen flex-col">
        <Navigation />
        {waking && (
          <div role="status" className="border-b border-line bg-brand-purple/10">
            <p className="shell flex items-center gap-3 py-2.5 text-sm">
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-fg/20 border-t-brand-pink" />
              Waking up the server after a quiet spell. This takes up to a minute on free hosting, so thanks for waiting!
            </p>
          </div>
        )}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toast />
        {isLoading && <Spinner />}
    </div>
  )
}

export default ShopApplicationWrapper
