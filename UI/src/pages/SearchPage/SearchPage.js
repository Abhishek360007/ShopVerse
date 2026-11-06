import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../../api/fetchProducts';
import ProductGrid from '../../components/ProductGrid/ProductGrid';

const SearchPage = () => {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const [products, setProducts] = useState(null);

  useEffect(() => {
    setProducts(null);
    searchProducts(query).then(setProducts);
  }, [query]);

  return (
    <div className="shell py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Results for <span className="gradient-text">“{query}”</span>
      </h1>
      {products !== null && (
        <p className="mt-2 text-muted">{products.length} {products.length === 1 ? 'product' : 'products'} found</p>
      )}
      <div className="mt-8">
        {products === null
          ? <div className="card h-40 animate-pulse" />
          : <ProductGrid products={products} emptyMessage="Nothing matched your search. Try another word." />}
      </div>
    </div>
  );
};

export default SearchPage;
