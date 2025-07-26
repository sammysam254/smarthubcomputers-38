
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    if (user) {
      const cartKey = `cart_${user.id}`;
      const savedCart = localStorage.getItem(cartKey);
      const anonymousCart = localStorage.getItem('cart_anonymous');
      
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      } else if (anonymousCart) {
        // Merge anonymous cart with user cart
        const anonymousItems = JSON.parse(anonymousCart);
        setItems(anonymousItems);
        localStorage.removeItem('cart_anonymous');
      } else {
        setItems([]);
      }
    } else {
      // Load anonymous cart when user logs out
      const anonymousCart = localStorage.getItem('cart_anonymous');
      if (anonymousCart) {
        setItems(JSON.parse(anonymousCart));
      } else {
        setItems([]);
      }
    }
  }, [user]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (user) {
      const cartKey = `cart_${user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(items));
    } else {
      // Save anonymous cart
      localStorage.setItem('cart_anonymous', JSON.stringify(items));
    }
  }, [items, user]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        if (!user) {
          toast.success("✅ Cart Updated!", {
            description: `${product.name} quantity increased! Please sign in to continue with your order`,
          });
        } else {
          toast.success("✅ Cart Updated!", {
            description: `${product.name} quantity increased to ${existingItem.quantity + 1}`,
          });
        }
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (!user) {
          toast.success("🎉 Added to Cart!", {
            description: `${product.name} added successfully! Please sign in to continue with your order`,
          });
        } else {
          toast.success("🎉 Added to Cart!", {
            description: `${product.name} added successfully!`,
          });
        }
        return [...currentItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(item => item.id === productId);
      if (item) {
        toast.success("Removed from cart", {
          description: `${item.name} removed from cart`,
        });
      }
      return currentItems.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success("Cart cleared", {
      description: "All items removed from cart",
    });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
