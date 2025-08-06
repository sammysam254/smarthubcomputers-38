import React, { memo, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[];
  category: string;
  rating: number;
  reviews_count: number;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
}

interface VirtualizedProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  containerHeight?: number;
}

const VirtualizedProductGrid = memo(({ 
  products, 
  onAddToCart, 
  onProductClick,
  containerHeight = 800 
}: VirtualizedProductGridProps) => {
  // Calculate grid dimensions based on screen size
  const { columnCount, columnWidth, rowHeight } = useMemo(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    if (screenWidth >= 1280) {
      // xl screens - 4 columns
      return { columnCount: 4, columnWidth: 300, rowHeight: 420 };
    } else if (screenWidth >= 1024) {
      // lg screens - 3 columns
      return { columnCount: 3, columnWidth: 320, rowHeight: 420 };
    } else if (screenWidth >= 768) {
      // md screens - 2 columns
      return { columnCount: 2, columnWidth: 350, rowHeight: 400 };
    } else {
      // sm screens - 2 columns
      return { columnCount: 2, columnWidth: 180, rowHeight: 350 };
    }
  }, []);

  const rowCount = Math.ceil(products.length / columnCount);

  // Cell renderer for react-window
  const Cell = memo(({ columnIndex, rowIndex, style }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const productIndex = rowIndex * columnCount + columnIndex;
    const product = products[productIndex];

    if (!product) return null;

    return (
      <div style={style} className="p-2">
        <ProductCard
          product={product}
          onAddToCart={onAddToCart}
          onProductClick={onProductClick}
        />
      </div>
    );
  });

  Cell.displayName = 'VirtualizedCell';

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ width: '100%' }}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={Math.min(containerHeight, rowCount * rowHeight)}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={Math.min(columnCount * columnWidth, 1200)}
        className="mx-auto"
      >
        {Cell}
      </Grid>
    </div>
  );
});

VirtualizedProductGrid.displayName = 'VirtualizedProductGrid';

export default VirtualizedProductGrid;