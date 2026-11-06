import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getAllProducts } from '../../api/fetchProducts'
import { addItemToCartAction, toCartLine } from '../../store/actions/cartAction'
import { formatPrice } from '../../utils/format'
import ProductGrid from '../../components/ProductGrid/ProductGrid'
import Rating from '../../components/Rating/Rating'
import { CartIcon, MinusIcon, PlusIcon, ReturnIcon, ShieldIcon, TruckIcon } from '../../components/common/Icons'

const promises = [
  { icon: TruckIcon, label: 'Free & fast delivery' },
  { icon: ShieldIcon, label: 'Secure payments' },
  { icon: ReturnIcon, label: 'Easy 7-day returns' },
];

const ProductDetails = () => {
  const { product } = useLoaderData() ?? {};
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector((state)=> state?.categoryState?.categories);
  const [image, setImage] = useState(product?.thumbnail);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [similar, setSimilar] = useState([]);

  const variants = useMemo(() => product?.variants ?? [], [product]);
  const hasChoice = variants.length > 1;
  const selected = hasChoice ? variants.find((v) => v.id === variantId) : variants[0];
  const maxQty = Math.min(selected?.stockQuantity ?? 10, 10);
  const category = categories?.find((c) => c?.id === product?.categoryId);

  useEffect(() => {
    setImage(product?.thumbnail);
    setVariantId('');
    setQuantity(1);
    setError('');
  }, [product]);

  useEffect(()=>{
    if (!product?.categoryId) return;
    getAllProducts(product.categoryId).then(res=>{
      setSimilar(res?.filter((item)=> item?.id !== product?.id) ?? []);
    });
  },[product?.categoryId, product?.id]);

  if (!product) {
    return (
      <div className="shell py-16 text-center">
        <h1 className="text-2xl font-extrabold">Product not found</h1>
        <Link to="/" className="btn-primary mt-6">Back to shop</Link>
      </div>
    );
  }

  const addToCart = (goToCheckout = false) => {
    if (!selected) {
      setError('Please choose a size');
      return;
    }
    if (!(selected.stockQuantity > 0)) {
      setError('This option is out of stock');
      return;
    }
    dispatch(addItemToCartAction(toCartLine(product, selected, quantity)));
    if (goToCheckout) navigate('/cart-items');
  };

  const images = product?.productResources?.length ? product.productResources : [{ url: product.thumbnail }];

  return (
    <div className="shell py-8">
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-white">Shop</Link>
        {category && <> <span className="mx-2">/</span><Link to={`/category/${category.code}`} className="hover:text-white">{category.name}</Link></>}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="card overflow-hidden">
            <img src={image} alt={product.name} className="aspect-[330/256] w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((item, index) => (
                <button key={item.url + index} type="button" onClick={() => setImage(item.url)}
                        className={`overflow-hidden rounded-xl border-2 ${image === item.url ? 'border-brand-purple' : 'border-transparent'}`}>
                  <img src={item.url} alt={`${product.name} view ${index + 1}`} className="h-16 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-pink">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          {product.rating ? <div className="mt-3"><Rating rating={product.rating} /></div> : null}
          <p className="mt-5 text-3xl font-extrabold">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-muted">Inclusive of all taxes</p>

          <p className="mt-6 leading-relaxed text-white/80">{product.description}</p>

          {hasChoice && (
            <fieldset className="mt-6">
              <legend className="label">Size</legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button key={variant.id} type="button" disabled={!(variant.stockQuantity > 0)}
                          onClick={() => { setVariantId(variant.id); setError(''); setQuantity(1); }}
                          className={`chip disabled:cursor-not-allowed disabled:opacity-40 ${variantId === variant.id ? 'chip-active' : ''}`}>
                    {variant.size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {selected?.color && selected.color !== 'Standard' && (
            <p className="mt-4 text-sm text-muted">Colour: <span className="font-semibold text-white">{selected.color}</span></p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center rounded-xl border border-line bg-raised">
              <button type="button" aria-label="Decrease quantity" className="px-3 disabled:opacity-40"
                      disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}><MinusIcon className="h-4 w-4" /></button>
              <span className="w-8 text-center font-semibold" aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Increase quantity" className="px-3 disabled:opacity-40"
                      disabled={quantity >= maxQty} onClick={() => setQuantity((q) => q + 1)}><PlusIcon className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => addToCart(false)} className="btn-cart flex-1 sm:flex-none sm:px-8">
              <CartIcon className="h-4 w-4" /> Add to Cart
            </button>
            <button type="button" onClick={() => addToCart(true)} className="btn-primary flex-1 sm:flex-none sm:px-8">
              Buy now
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>}
          {selected && selected.stockQuantity > 0 && selected.stockQuantity <= 5 && (
            <p className="mt-3 text-sm text-amber-300">Only {selected.stockQuantity} left in stock</p>
          )}

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {promises.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-sm font-semibold">
                <Icon className="h-5 w-5 text-brand-pink" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight">You may also like</h2>
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  )
}

export default ProductDetails
