import React from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux';
import Spinner from '../components/Spinner/Spinner';

const AuthenticationWrapper = () => {
  const isLoading = useSelector((state)=> state?.commonState?.loading);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm rounded-3xl p-7 shadow-2xl shadow-black/40">
        <Outlet />
      </div>
      {isLoading && <Spinner />}
    </div>
  )
}

export default AuthenticationWrapper
