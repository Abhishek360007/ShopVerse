import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Navigation from '../components/Navigation/Navigation'
import Footer from '../components/Footer/Footer'
import Spinner from '../components/Spinner/Spinner'
import Toast from '../components/Toast/Toast'
import { fetchCategories } from '../api/fetchCategories'
import { loadCategories } from '../store/features/category'
import { loadWishlist } from '../store/actions/wishlistAction'

const ShopApplicationWrapper = () => {
  const isLoading = useSelector((state)=> state?.commonState?.loading);
  const dispatch = useDispatch();
  const { pathname } = useLocation();

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
