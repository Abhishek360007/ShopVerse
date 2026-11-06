import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken } from '../utils/jwt-helper';
import { useDispatch } from 'react-redux';
import { syncWishlistAfterLogin } from '../store/actions/wishlistAction';

const OAuth2LoginCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if(token){
        saveToken(token);
        dispatch(syncWishlistAfterLogin());
        navigate('/');
    }
    else{
        navigate('/v1/login')
    }
  },[dispatch, navigate])
  return (
    <div></div>
  )
}

export default OAuth2LoginCallback