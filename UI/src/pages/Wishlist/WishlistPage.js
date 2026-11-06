import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectWishlist } from '../../store/features/wishlist';
import { removeFromWishlist } from '../../store/actions/wishlistAction';
import { addItemToCartAction, toCartLine } from '../../store/actions/cartAction';
import { showToast } from '../../store/features/common';
import { isTokenValid } from '../../utils/jwt-helper';
import { formatPrice } from '../../utils/format';
import { CartIcon, HeartIcon, TrashIcon } from '../../components/common/Icons';

const WishlistPage = () => {
  const items = useSelector(selectWishlist);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const moveToCart = (product) => {
    const inStock = (product?.variants ?? []).filter((v) => v?.stockQuantity > 0);
    if (inStock.length === 0) {
      dispatch(showToast(`${product.name} is out of stock`));
      return;
    }
    if (inStock.length > 1) {
      // Several sizes: let the customer pick one on the product page
      dispatch(showToast('Choose a size to add it to your cart'));
      navigate(`/product/${product.slug}`);
      return;
    }
    dispatch(addItemToCartAction(toCartLine(product, inStock[0])));
    dispatch(removeFromWishlist(product));
  };

  if (!items.length) {
    return (
      <div className="shell py-20">
        <div className="card mx-auto flex max-w-md flex-col items-center p-10 text-center">
          <span className="icon-tile h-14 w-14 rounded-2xl"><HeartIcon className="h-7 w-7" /></span>
          <h1 className="mt-5 text-2xl font-extrabold">Your wishlist is empty</h1>
          <p className="mt-2 text-muted">Tap the heart on any product to save it for later.</p>
          <Link to="/" className="btn-primary mt-6">Explore products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Wishlist</h1>
          <p className="mt-1 text-muted">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        {!isTokenValid() && (
          <p className="text-sm text-muted">
            <Link to="/v1/login?redirect=/wishlist" className="font-semibold text-brand-pink hover:underline">Sign in</Link> to keep your wishlist on all your devices.
          </p>
        )}
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => {
          const inStock = (product?.variants ?? []).some((v) => v?.stockQuantity > 0);
          return (
            <li key={product.id} className="card flex flex-col overflow-hidden">
              <Link to={`/product/${product.slug}`} className="relative block aspect-[330/256] overflow-hidden bg-raised">
                <img src={product.thumbnail} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <Link to={`/product/${product.slug}`} className="truncate text-lg font-extrabold hover:text-brand-pink" title={product.name}>
                  {product.name}
                </Link>
                <p className="mt-1 font-semibold">{formatPrice(product.price)}</p>
                {!inStock && <p className="mt-1 text-sm text-amber-500">Out of stock</p>}
                <div className="mt-auto flex gap-2 pt-4">
                  <button type="button" onClick={() => moveToCart(product)} disabled={!inStock} className="btn-cart flex-1">
                    <CartIcon className="h-4 w-4" /> Move to cart
                  </button>
                  <button type="button" onClick={() => dispatch(removeFromWishlist(product))}
                          aria-label={`Remove ${product.name} from wishlist`} title="Remove"
                          className="btn-ghost w-11 px-0">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WishlistPage;
