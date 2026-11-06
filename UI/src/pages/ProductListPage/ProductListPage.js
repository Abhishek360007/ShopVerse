import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getAllProducts } from '../../api/fetchProducts'
import ProductGrid from '../../components/ProductGrid/ProductGrid'

const ProductListPage = () => {
  const { code } = useParams();
  const categories = useSelector((state)=> state?.categoryState?.categories);
  const [products,setProducts] = useState(null);
  const [typeId,setTypeId] = useState('');

  const category = useMemo(()=>{
    return categories?.find(element => element?.code === code);
  },[categories, code]);

  useEffect(()=> setTypeId(''), [code]);

  useEffect(()=>{
    if (!category?.id) return;
    setProducts(null);
    getAllProducts(category.id, typeId).then(setProducts);
  },[category?.id, typeId]);

  if (categories?.length && !category) {
    return (
      <div className="shell py-16 text-center">
        <h1 className="text-2xl font-extrabold">Category not found</h1>
        <Link to="/" className="btn-primary mt-6">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Categories">
        {categories?.map((item) => (
          <Link key={item.id} to={`/category/${item.code}`} className={`chip ${item.code === code ? 'chip-active' : ''}`}>
            {item.name}
          </Link>
        ))}
      </nav>

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{category?.name}</h1>
      <p className="mt-2 text-muted">{category?.description}</p>

      {category?.categoryTypes?.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setTypeId('')} className={`chip ${!typeId ? 'chip-active' : ''}`}>All</button>
          {category.categoryTypes.map((type) => (
            <button key={type.id} type="button" onClick={() => setTypeId(type.id)}
                    className={`chip ${typeId === type.id ? 'chip-active' : ''}`}>
              {type.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {products === null
          ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card h-[380px] animate-pulse" />)}
            </div>
          : <ProductGrid products={products} emptyMessage="No products in this category yet." />}
      </div>
    </div>
  )
}

export default ProductListPage
