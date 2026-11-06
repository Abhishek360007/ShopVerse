import React, { useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/features/common";
import { fetchUserDetails } from "../../api/userInfo";
import { loadUserInfo, selectIsUserAdmin, selectUserInfo } from "../../store/features/user";
import { PackageIcon, SettingsIcon, UserIcon } from "../../components/common/Icons";

const links = [
  { to: "/account-details/profile", label: "Profile", icon: UserIcon },
  { to: "/account-details/orders", label: "Orders", icon: PackageIcon },
  { to: "/account-details/settings", label: "Settings", icon: SettingsIcon },
];

const Account = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(selectUserInfo);
  const isUserAdmin = useSelector(selectIsUserAdmin);

  useEffect(() => {
    dispatch(setLoading(true));
    fetchUserDetails()
      .then((res) => dispatch(loadUserInfo(res)))
      .catch(() => {})
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  return (
    <div className="shell py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Hello{userInfo?.firstName ? `, ${userInfo.firstName}` : ''}</h1>
        </div>
        {isUserAdmin && <Link to="/admin" className="btn-ghost">Manage store</Link>}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col" aria-label="Account">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-gradient-to-r from-brand-purple to-brand-pink' : 'bg-surface text-muted hover:text-white'}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="card min-w-0 rounded-2xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Account;
