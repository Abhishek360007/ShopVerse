import React, { useCallback, useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { placeOrderAPI } from '../../api/order';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems } from '../../store/features/cart';
import { createOrderRequest } from '../../utils/order-util';
import { setLoading } from '../../store/features/common';

const CheckoutForm = ({userId,addressId}) => {

  const stripe= useStripe();
  const elements = useElements();
  const cartItems = useSelector(selectCartItems);
  const dispatch = useDispatch();
  const [error,setError] =useState('');

  const handleSubmit = useCallback(async (event)=>{
    event?.preventDefault();
    if (!stripe || !elements) return;

    const orderRequest = createOrderRequest(cartItems,userId,addressId,'CARD');
    dispatch(setLoading(true));
    setError('');

    const {error} = await elements.submit();
    if (error?.message) {
      setError(error?.message);
      dispatch(setLoading(false));
      return;
    }

    try {
      const res = await placeOrderAPI(orderRequest);
      const result = await stripe.confirmPayment({
        elements,
        clientSecret: res?.credentials?.client_secret,
        confirmParams:{
          return_url:`${window.location.origin}/confirmPayment`
        }
      });
      // Only reached when confirmation fails; on success Stripe redirects to return_url
      if (result?.error?.message) setError(result.error.message);
    } catch (err) {
      setError(err?.message || 'Unable to place your order. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  },[addressId, cartItems, dispatch, elements, stripe, userId]);

  return (
    <form className='max-w-md' onSubmit={handleSubmit}>
      <PaymentElement />
      <button type='submit' disabled={!stripe} className='btn-primary mt-6 w-full'>Pay now</button>
      {error && <p className='mt-4 text-sm font-semibold text-red-400'>{error}</p>}
    </form>
  );
};

export default CheckoutForm;
