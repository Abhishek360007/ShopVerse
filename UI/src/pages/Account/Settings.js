import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logOut } from '../../utils/jwt-helper';
import { loadUserInfo } from '../../store/features/user';
import { clearWishlistOnLogout } from '../../store/actions/wishlistAction';
import { LogoutIcon } from '../../components/common/Icons';

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onLogOut = () => {
    logOut();
    dispatch(loadUserInfo({}));
    dispatch(clearWishlistOnLogout());
    navigate("/");
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold">Settings</h2>
      <p className="mt-1 text-sm text-muted">Sign out of ShopVerse on this device.</p>
      <button type="button" onClick={onLogOut} className="btn-ghost mt-6"><LogoutIcon className="h-4 w-4" /> Sign out</button>
    </div>
  )
}

export default Settings
