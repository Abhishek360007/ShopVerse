import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addItemToCartAction, toCartLine } from '../../store/actions/cartAction'
import { formatPrice } from '../../utils/format'
import { CartIcon } from '../../components/common/Icons'
import WishlistButton from '../../components/WishlistButton/WishlistButton'

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inStock = (product?.variants ?? []).filter((v) => v?.stockQuantity > 0);
  const needsChoice = inStock.length > 1;

  const onAdd = () => {
    if (needsChoice) {
      navigate(`/product/${product?.slug}`);
      return;
    }
    if (inStock.length === 1) {
      dispatch(addItemToCartAction(toCartLine(product, inStock[0])));
    }
  };

  return (
    <article className="card group relative flex flex-col overflow-hidden">
      <Link to={`/product/${product?.slug}`} className="relative block aspect-[330/256] overflow-hidden bg-raised">
        <img
          src={product?.thumbnail}
          alt={product?.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-brand-purple px-3 py-1 text-xs font-bold text-white shadow-lg">
          {formatPrice(product?.price)}
        </span>
      </Link>
      <WishlistButton product={product} className="absolute left-3 top-3" />

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/product/${product?.slug}`} className="truncate text-lg font-extrabold hover:text-brand-pink" title={product?.name}>
          {product?.name}
        </Link>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">{product?.description}</p>

        <button
          type="button"
          onClick={onAdd}
          disabled={inStock.length === 0}
          className="btn-cart mt-4 w-full"
        >
          <CartIcon className="h-4 w-4" />
          {inStock.length === 0 ? 'Out of stock' : needsChoice ? 'Choose size' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

export default ProductCard
