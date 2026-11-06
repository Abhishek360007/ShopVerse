import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux';
import GoogleSignIn from '../../components/Buttons/GoogleSignIn'
import { setLoading } from '../../store/features/common'
import { loginAPI } from '../../api/authentication';
import { saveToken } from '../../utils/jwt-helper';
import { safeRedirect } from '../../utils/redirect';


const Login = () => {
  const [values, setValues] = useState({ userName: '', password: '' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    dispatch(setLoading(true));
    loginAPI(values).then(res => {
      if (res?.token) {
        saveToken(res.token);
        navigate(redirect, { replace: true });
      } else {
        setError('Something went wrong. Please try again.');
      }
    }).catch(() => {
      setError('Incorrect email or password, or your email is not verified yet.');
    }).finally(() => {
      dispatch(setLoading(false));
    });
  };

  return (
    <>
      <div className="text-center">
        <Link to="/" className="gradient-text text-2xl font-extrabold">ShopVerse</Link>
        <p className="mt-1 text-sm text-muted">Sign in to continue shopping</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" name="userName" value={values.userName} onChange={onChange}
                 autoComplete="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="login-password">Password</label>
          <input id="login-password" type="password" name="password" value={values.password} onChange={onChange}
                 autoComplete="current-password" className="input" required />
        </div>
        {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full">Sign in</button>
      </form>

      <GoogleSignIn />

      <p className="mt-6 text-center text-sm text-muted">
        New to ShopVerse? <Link to={`/v1/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-pink hover:underline">Create an account</Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/" className="text-muted hover:text-white">Continue as guest</Link>
      </p>
    </>
  )
}

export default Login
