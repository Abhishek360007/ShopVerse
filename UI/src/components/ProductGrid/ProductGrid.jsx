import React from 'react';
import ProductCard from '../../pages/ProductListPage/ProductCard';

const ProductGrid = ({ products, emptyMessage = 'No products found.' }) => {
  if (!products?.length) {
    return <p className="card p-8 text-center text-muted">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
