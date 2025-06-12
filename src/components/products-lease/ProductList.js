'use client'

import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'

export default function ProductList({ products }) {
  return (
    <div className="col-lg-12">
      <div className="row row-cols-1 row-cols-md-4 g-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
