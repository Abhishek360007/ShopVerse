import { Elements } from '@stripe/react-stripe-js';
import React from 'react'
import CheckoutForm from './CheckoutPayment';
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = process.env.REACT_APP_STRIPE_KEY || '';

export const stripeEnabled = Boolean(stripePublishableKey);

// Only load Stripe when a publishable key is configured
const stripePromise = stripeEnabled ? loadStripe(stripePublishableKey) : null;

const PaymentPage = ({ amount, ...props }) => {
  if (!stripeEnabled) return null;

  const options = {
    mode: 'payment',
    amount: Math.max(Math.round((Number(amount) || 0) * 100), 100), // paise
    currency: 'inr',
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#a855f7',
        colorBackground: '#1d1b27',
        borderRadius: '12px',
      },
    },
  };

  return (
    <div className="mt-6">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm {...props}/>
      </Elements>
    </div>
  )
}

export default PaymentPage
