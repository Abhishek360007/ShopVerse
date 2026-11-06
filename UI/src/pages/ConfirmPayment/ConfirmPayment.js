import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux';
import { confirmPaymentAPI } from '../../api/order';
import { clearCart } from '../../store/actions/cartAction';

const ConfirmPayment = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const redirectStatus = query.get('redirect_status');
    const paymentIntent = query.get('payment_intent');

    if (redirectStatus === 'succeeded') {
      confirmPaymentAPI({ paymentIntent, status: redirectStatus }).then(res => {
        dispatch(clearCart());
        navigate(`/orderConfirmed?orderId=${res?.orderId}`, { replace: true });
      }).catch(() => {
        setErrorMessage('Your payment went through, but we could not confirm the order. Please check My Orders.');
      });
    } else {
      setErrorMessage(`Payment was not completed (${redirectStatus ?? 'unknown status'}). You have not been charged.`);
    }
  }, [dispatch, location.search, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm rounded-3xl p-8 text-center">
        {errorMessage ? (
          <>
            <p className="text-lg font-extrabold">Something went wrong</p>
            <p className="mt-2 text-sm text-muted">{errorMessage}</p>
            <Link to="/cart-items" className="btn-primary mt-6 w-full">Back to cart</Link>
          </>
        ) : (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-fg/15 border-t-brand-pink" />
            <p className="mt-4 font-semibold">Confirming your payment…</p>
          </>
        )}
      </div>
    </div>
  )
}

export default ConfirmPayment
