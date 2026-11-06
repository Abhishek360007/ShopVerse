import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoading } from '../../store/features/common';
import { verifyAPI } from '../../api/authentication';

const VerifyCode = ({ email, loginLink = '/v1/login' }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const dispatch = useDispatch();

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    dispatch(setLoading(true));
    verifyAPI({ userName: email, code }).then(() => {
      setVerified(true);
    }).catch(() => {
      setError('That code is incorrect or has expired.');
    }).finally(() => {
      dispatch(setLoading(false));
    });
  };

  if (verified) {
    return (
      <div className="text-center">
        <p className="gradient-text text-2xl font-extrabold">Email verified!</p>
        <p className="mt-2 text-sm text-muted">You can now sign in to your account.</p>
        <Link to={loginLink} className="btn-primary mt-6 w-full">Sign in</Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <p className="gradient-text text-2xl font-extrabold">Check your email</p>
        <p className="mt-2 text-sm text-muted">We sent a 6-digit code to <span className="font-semibold text-white">{email}</span>.</p>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="verify-code">Verification code</label>
          <input id="verify-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                 inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}"
                 className="input text-center text-lg tracking-[0.5em]" required />
        </div>
        {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full">Verify</button>
      </form>
    </>
  )
}

export default VerifyCode
