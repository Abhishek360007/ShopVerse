import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getAllProducts } from './api/fetchProducts'
import ProductGrid from './components/ProductGrid/ProductGrid'
import { ReturnIcon, ShieldIcon, TruckIcon } from './components/common/Icons'

const features = [
  { icon: TruckIcon, title: 'Free & fast delivery', text: 'On thousands of items nationwide' },
  { icon: ShieldIcon, title: 'Secure payments', text: 'Encrypted, PCI-compliant checkout' },
  { icon: ReturnIcon, title: 'Easy 7-day returns', text: 'Hassle-free refunds & exchanges' },
];

const Shop = () => {
  const categories = useSelector((state) => state?.categoryState?.categories) ?? [];
  const [products, setProducts] = useState(null);

  useEffect(() => {
    getAllProducts().then(setProducts);
  }, []);

  return (
    <div className="shell space-y-10 py-8">
      {/* Hero */}
      <section className="card relative overflow-hidden px-6 py-12 sm:px-14 sm:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-pink">The everything store</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Shop smarter across <span className="gradient-text">every category</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
          Electronics, fashion, home essentials, books, sports gear and beauty — all in one place with secure
          checkout and fast delivery.
        </p>
        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.code}`} className="chip">
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Store promises */}
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex items-center gap-4 rounded-2xl p-5">
            <span className="icon-tile"><Icon className="h-5 w-5" /></span>
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured products */}
      <section>
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight">Featured products</h2>
        {products === null
          ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card h-[380px] animate-pulse" />)}
            </div>
          : <ProductGrid products={products} emptyMessage="No products yet. Add some from the admin panel." />}
      </section>
    </div>
  )
}

export default Shop
