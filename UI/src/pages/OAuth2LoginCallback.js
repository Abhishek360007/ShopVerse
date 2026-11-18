import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken } from '../utils/jwt-helper';
import { useDispatch } from 'react-redux';
import { syncWishlistAfterLogin } from '../store/actions/wishlistAction';

const OAuth2LoginCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(()=>{
    // The server puts the token in the URL fragment (#token=...), which is never sent to
    // a server. Read it, then remove it from the address bar and browser history.
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
    }

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