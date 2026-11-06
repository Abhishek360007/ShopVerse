import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import GoogleSignIn from '../../components/Buttons/GoogleSignIn';
import { setLoading } from '../../store/features/common';
import { registerAPI } from '../../api/authentication';
import VerifyCode from './VerifyCode';

const Register = () => {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // form | verify | done
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const loginLink = `/v1/login${params.get('redirect') ? `?redirect=${encodeURIComponent(params.get('redirect'))}` : ''}`;

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    dispatch(setLoading(true));
    registerAPI(values).then(res => {
      if (res?.code === 200) {
        setStep(res?.verificationRequired === false ? 'done' : 'verify');
      }
    }).catch(() => {
      setError('This email is already registered, or the details are invalid.');
    }).finally(() => {
      dispatch(setLoading(false));
    });
  };

  if (step === 'verify') return <VerifyCode email={values.email} loginLink={loginLink} />;

  if (step === 'done') {
    return (
      <div className="text-center">
        <p className="gradient-text text-2xl font-extrabold">Welcome to ShopVerse!</p>
        <p className="mt-2 text-sm text-muted">Your account is ready.</p>
        <Link to={loginLink} className="btn-primary mt-6 w-full">Sign in</Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <Link to="/" className="gradient-text text-2xl font-extrabold">ShopVerse</Link>
        <p className="mt-1 text-sm text-muted">Create your account</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" autoComplete="on">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="reg-first">First name</label>
            <input id="reg-first" name="firstName" value={values.firstName} onChange={onChange} autoComplete="given-name" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="reg-last">Last name</label>
            <input id="reg-last" name="lastName" value={values.lastName} onChange={onChange} autoComplete="family-name" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="reg-email">Email</label>
          <input id="reg-email" type="email" name="email" value={values.email} onChange={onChange} autoComplete="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="reg-phone">Phone <span className="font-normal text-muted">(optional)</span></label>
          <input id="reg-phone" type="tel" name="phoneNumber" value={values.phoneNumber} onChange={onChange} autoComplete="tel" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="reg-password">Password</label>
          <input id="reg-password" type="password" name="password" value={values.password} onChange={onChange}
                 autoComplete="new-password" minLength={8} className="input" required />
          <p className="mt-1 text-xs text-muted">At least 8 characters</p>
        </div>
        {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full">Create account</button>
      </form>

      <GoogleSignIn />

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to={loginLink} className="font-semibold text-brand-pink hover:underline">Sign in</Link>
      </p>
    </>
  )
}

export default Register
