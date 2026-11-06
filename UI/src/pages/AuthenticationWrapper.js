import React from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux';
import Spinner from '../components/Spinner/Spinner';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';

const AuthenticationWrapper = () => {
  const isLoading = useSelector((state)=> state?.commonState?.loading);
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="card w-full max-w-sm rounded-3xl p-7 shadow-2xl shadow-black/40">
        <Outlet />
      </div>
      {isLoading && <Spinner />}
    </div>
  )
}

export default AuthenticationWrapper
