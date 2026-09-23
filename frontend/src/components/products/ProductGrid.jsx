import React from 'react';
import { PRODUCTS } from '../../config/products';
import { ProductCard } from './ProductCard';

export const ProductGrid = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full">
            {PRODUCTS.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};
