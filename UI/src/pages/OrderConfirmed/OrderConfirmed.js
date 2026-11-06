import React from 'react'
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '../../components/common/Icons';

const OrderConfirmed = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const cod = params.get('method') === 'cod';

  return (
    <div className="shell flex min-h-[60vh] items-center justify-center py-16">
      <div className="card w-full max-w-sm rounded-3xl p-8 text-center">
        <CheckCircleIcon className="mx-auto h-14 w-14 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-extrabold">Thank you for your order!</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {cod
            ? 'Your order has been placed. Please keep the amount ready to pay when it arrives.'
            : 'Your payment was successful and your order is being processed.'}
        </p>
        {orderId && orderId !== 'undefined' && (
          <p className="mt-3 break-all text-xs text-muted">Order ID: <span className="text-fg">{orderId}</span></p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/" className="btn-primary">Continue shopping</Link>
          <Link to="/account-details/orders" className="text-sm text-muted hover:text-fg">View my orders</Link>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmed
