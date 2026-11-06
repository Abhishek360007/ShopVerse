import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsWishlisted } from '../../store/features/wishlist';
import { toggleWishlist } from '../../store/actions/wishlistAction';
import { HeartIcon } from '../common/Icons';

/** Heart toggle. `variant="overlay"` sits on a product image; `"button"` sits beside Add to Cart. */
const WishlistButton = ({ product, variant = 'overlay', className = '' }) => {
  const dispatch = useDispatch();
  const saved = useSelector(selectIsWishlisted(product?.id));

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
  };

  const base = variant === 'overlay'
    ? 'h-9 w-9 rounded-full bg-surface/90 shadow-md backdrop-blur'
    : 'h-11 w-11 rounded-xl border border-line bg-raised';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product?.name} from wishlist` : `Save ${product?.name} to wishlist`}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`flex shrink-0 items-center justify-center transition hover:scale-105 ${base} ${className}`}
    >
      <HeartIcon filled={saved} className={`h-5 w-5 ${saved ? 'text-brand-pink' : 'text-fg'}`} />
    </button>
  );
};

export default WishlistButton;
