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

    const orderRequest = createOrderRequest(cartItems,userId,addressId);
    dispatch(setLoading(true));
    setError('');

    const {error} = await elements.submit();
    if (error?.message) {
      setError(error?.message);
      dispatch(setLoading(false));
      return;
    }

    
    placeOrderAPI(orderRequest).then(res=>{
        return stripe.confirmPayment({
            elements,
            clientSecret: res?.credentials?.client_secret,
            
            confirmParams:{
                payment_method:'pm_card_visa',
                return_url:`${window.location.origin}/confirmPayment`
            }
        }).then(result=>{
            if (result?.error?.message) setError(result.error.message);
        })

        
        
    }).catch(()=>{
        setError('Unable to place your order. Please try again.');
    }).finally(()=>{
        dispatch(setLoading(false));
    })


  },[addressId, cartItems, dispatch, elements, stripe, userId]);

  return (
    <form className='items-center p-2 mt-4 w-[320px] h-[320px]' onSubmit={handleSubmit}>
      <PaymentElement />
      <button type='submit' disabled={!stripe} className='w-[150px] items-center h-[48px] bg-black border rounded-lg mt-4 text-white hover:bg-gray-800'>Pay Now</button>
      {error && <p className='text-sm pt-4 text-red-600'>{error}</p>}
    </form>
  );
};

export default CheckoutForm;