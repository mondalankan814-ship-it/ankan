import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: MenuItem, portion: 'half' | 'full') => void;
  removeFromCart: (id: string, portion: 'half' | 'full') => void;
  updateQuantity: (id: string, portion: 'half' | 'full', delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: MenuItem, portion: 'half' | 'full') => {
    const price = portion === 'half' ? item.half_price : item.full_price;
    setItems((prev) => {
      const existing = prev.find(
        (ci) => ci.id === item.id && ci.portion === portion,
      );
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id && ci.portion === portion
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          image_url: item.image_url,
          portion,
          price,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string, portion: 'half' | 'full') => {
    setItems((prev) =>
      prev.filter((ci) => !(ci.id === id && ci.portion === portion)),
    );
  };

  const updateQuantity = (id: string, portion: 'half' | 'full', delta: number) => {
    setItems((prev) => {
      return prev
        .map((ci) => {
          if (ci.id === id && ci.portion === portion) {
            return { ...ci, quantity: ci.quantity + delta };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0);
    });
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
  const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
