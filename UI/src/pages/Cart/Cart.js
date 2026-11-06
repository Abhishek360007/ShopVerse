import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Modal from 'react-modal'
import { selectCartItems } from '../../store/features/cart'
import { delteItemFromCartAction, updateItemToCartAction } from '../../store/actions/cartAction'
import { customStyles } from '../../styles/modal'
import { isTokenValid } from '../../utils/jwt-helper'
import { cartTotal, formatPrice } from '../../utils/format'
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from '../../components/common/Icons'

const variantLabel = (variant) =>
  [variant?.size && variant.size !== 'One Size' ? variant.size : null,
   variant?.color && variant.color !== 'Standard' ? variant.color : null].filter(Boolean).join(' · ');

const Cart = () => {
  const cartItems = useSelector(selectCartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const total = cartTotal(cartItems);

  const changeQuantity = (item, quantity) => {
    dispatch(updateItemToCartAction({ variant_id: item?.variant?.id, quantity }));
  };

  const confirmRemove = () => {
    dispatch(delteItemFromCartAction({ variantId: pendingRemoval?.variant?.id }));
    setPendingRemoval(null);
  };

  if (!cartItems?.length) {
    return (
      <div className="shell py-20">
        <div className="card mx-auto flex max-w-md flex-col items-center p-10 text-center">
          <span className="icon-tile h-14 w-14 rounded-2xl"><BagIcon className="h-7 w-7" /></span>
          <h1 className="mt-5 text-2xl font-extrabold">Your cart is empty</h1>
          <p className="mt-2 text-muted">Looks like you haven't added anything yet.</p>
          <Link to="/" className="btn-primary mt-6">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Shopping cart</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {cartItems.map((item) => {
            const maxQty = Math.min(item?.variant?.stockQuantity ?? 10, 10);
            return (
              <li key={item?.variant?.id} className="card flex gap-4 rounded-2xl p-4">
                <Link to={item?.slug ? `/product/${item.slug}` : '#'} className="shrink-0">
                  <img src={item?.thumbnail} alt={item?.name} className="h-24 w-28 rounded-xl object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item?.name}</p>
                      {variantLabel(item?.variant) && <p className="text-sm text-muted">{variantLabel(item?.variant)}</p>}
                    </div>
                    <button type="button" aria-label={`Remove ${item?.name}`} onClick={() => setPendingRemoval(item)}
                            className="rounded-lg p-1.5 text-muted hover:bg-fg/10 hover:text-fg">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex h-9 items-center rounded-lg border border-line bg-raised">
                      <button type="button" aria-label="Decrease quantity" className="px-2.5 disabled:opacity-40"
                              disabled={item.quantity <= 1} onClick={() => changeQuantity(item, item.quantity - 1)}>
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" aria-label="Increase quantity" className="px-2.5 disabled:opacity-40"
                              disabled={item.quantity >= maxQty} onClick={() => changeQuantity(item, item.quantity + 1)}>
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-extrabold">{formatPrice(item?.subTotal)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card h-fit rounded-2xl p-6">
          <h2 className="text-lg font-extrabold">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="text-emerald-400">FREE</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          {isTokenValid()
            ? <button type="button" className="btn-primary mt-6 w-full" onClick={() => navigate('/checkout')}>Proceed to checkout</button>
            : <Link to="/v1/login?redirect=/checkout" className="btn-primary mt-6 w-full">Sign in to checkout</Link>}
          <Link to="/" className="mt-3 block text-center text-sm text-muted hover:text-fg">Continue shopping</Link>
        </aside>
      </div>

      <Modal isOpen={!!pendingRemoval} onRequestClose={() => setPendingRemoval(null)} style={customStyles}
             contentLabel="Remove item" ariaHideApp={false}>
        <p className="text-lg font-bold">Remove this item?</p>
        <p className="mt-1 text-sm text-muted">{pendingRemoval?.name}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={() => setPendingRemoval(null)}>Cancel</button>
          <button type="button" className="btn-primary" onClick={confirmRemove}>Remove</button>
        </div>
      </Modal>
    </div>
  )
}

export default Cart
