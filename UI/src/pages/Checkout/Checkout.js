import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { selectCartItems } from '../../store/features/cart';
import { fetchUserDetails } from '../../api/userInfo';
import { placeOrderAPI } from '../../api/order';
import { setLoading } from '../../store/features/common';
import { loadUserInfo, selectUserInfo } from '../../store/features/user';
import { clearCart } from '../../store/actions/cartAction';
import { createOrderRequest } from '../../utils/order-util';
import { cartTotal, formatPrice } from '../../utils/format';
import PaymentPage, { stripeEnabled } from '../PaymentPage/PaymentPage';
import AddAddress from '../Account/AddAddress';

const Checkout = () => {
  const cartItems = useSelector(selectCartItems);
  const userInfo = useSelector(selectUserInfo);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(stripeEnabled ? 'CARD' : 'COD');
  const [error, setError] = useState('');
  const orderPlaced = useRef(false);
  const total = cartTotal(cartItems);
  const addresses = useMemo(() => userInfo?.addressList ?? [], [userInfo?.addressList]);

  useEffect(() => {
    dispatch(setLoading(true));
    fetchUserDetails().then(res => dispatch(loadUserInfo(res)))
      .catch(() => setError('We could not load your account. Please sign in again.'))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  // Pick the first saved address by default
  useEffect(() => {
    if (!addressId && addresses.length) setAddressId(addresses[0].id);
  }, [addresses, addressId]);

  // An empty cart means nothing to check out, unless we just placed the order and are moving to the confirmation
  if (!cartItems.length && !orderPlaced.current) return <Navigate to="/cart-items" replace />;

  const placeCodOrder = () => {
    if (orderPlaced.current) return;
    setError('');
    dispatch(setLoading(true));
    placeOrderAPI(createOrderRequest(cartItems, userInfo?.id, addressId, 'COD'))
      .then(res => {
        orderPlaced.current = true;
        navigate(`/orderConfirmed?orderId=${res?.orderId}&method=cod`, { replace: true });
        dispatch(clearCart());
      })
      .catch(err => setError(err.message))
      .finally(() => dispatch(setLoading(false)));
  };

  return (
    <div className="shell py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">1. Delivery address</h2>
              {addresses.length > 0 && !addingAddress && (
                <button type="button" onClick={() => setAddingAddress(true)} className="text-sm font-semibold text-brand-pink hover:underline">
                  + Add new
                </button>
              )}
            </div>
            {(addingAddress || addresses.length === 0) ? (
              <div className="mt-4">
                {addresses.length === 0 && <p className="mb-4 text-sm text-muted">Add an address to deliver your order to.</p>}
                <AddAddress onCancel={addresses.length ? () => setAddingAddress(false) : undefined}
                            onSaved={(address) => { setAddressId(address?.id); setAddingAddress(false); }} />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <label key={address.id}
                         className={`cursor-pointer rounded-2xl border p-4 text-sm transition ${addressId === address.id ? 'border-brand-purple bg-brand-purple/10' : 'border-line bg-raised hover:border-fg/20'}`}>
                    <input type="radio" name="address" className="sr-only" checked={addressId === address.id}
                           onChange={() => setAddressId(address.id)} />
                    <p className="font-bold">{address.name}</p>
                    <p className="mt-1 text-muted">{address.street}, {address.city}, {address.state} {address.zipCode}</p>
                    <p className="text-muted">{address.phoneNumber}</p>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="card rounded-2xl p-6">
            <h2 className="text-lg font-extrabold">2. Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { value: 'CARD', title: 'Credit / Debit card', text: stripeEnabled ? 'Pay securely with Stripe' : 'Not configured for this store', disabled: !stripeEnabled },
                { value: 'COD', title: 'Cash on delivery', text: 'Pay when your order arrives' },
              ].map((option) => (
                <label key={option.value}
                       className={`rounded-2xl border p-4 text-sm transition ${option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${paymentMethod === option.value ? 'border-brand-purple bg-brand-purple/10' : 'border-line bg-raised hover:border-fg/20'}`}>
                  <input type="radio" name="payment" className="sr-only" disabled={option.disabled}
                         checked={paymentMethod === option.value} onChange={() => setPaymentMethod(option.value)} />
                  <p className="font-bold">{option.title}</p>
                  <p className="mt-1 text-muted">{option.text}</p>
                </label>
              ))}
            </div>

            {!addressId && <p className="mt-4 text-sm text-amber-300">Choose a delivery address to continue.</p>}

            {addressId && paymentMethod === 'CARD' && (
              <PaymentPage userId={userInfo?.id} addressId={addressId} amount={total} />
            )}
            {addressId && paymentMethod === 'COD' && (
              <button type="button" onClick={placeCodOrder} className="btn-primary mt-6 w-full sm:w-auto sm:px-10">
                Place order · {formatPrice(total)}
              </button>
            )}
            {error && <p className="mt-4 text-sm font-semibold text-red-400">{error}</p>}
          </section>
        </div>

        <aside className="card h-fit rounded-2xl p-6">
          <h2 className="text-lg font-extrabold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {cartItems.map((item) => (
              <li key={item?.variant?.id} className="flex items-center gap-3 text-sm">
                <img src={item?.thumbnail} alt="" className="h-12 w-14 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate">{item?.name} <span className="text-muted">× {item?.quantity}</span></span>
                <span className="font-semibold">{formatPrice(item?.subTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="text-emerald-400">FREE</dd></div>
            <div className="flex justify-between pt-2 text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
