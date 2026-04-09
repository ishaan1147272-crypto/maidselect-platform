import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface CartItem {
  id: string;
  name: string;
  hourly_rate: number;
  city: string | null;
  profile_image_url: string | null;
  hours: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (maid: Omit<CartItem, 'hours'>) => void;
  removeItem: (id: string) => void;
  updateHours: (id: string, hours: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  subtotal: number;
  platformFee: number;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [], addItem: () => {}, removeItem: () => {}, updateHours: () => {},
  clearCart: () => {}, isInCart: () => false, subtotal: 0, platformFee: 0, total: 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((maid: Omit<CartItem, 'hours'>) => {
    setItems(prev => {
      if (prev.find(i => i.id === maid.id)) return prev;
      return [...prev, { ...maid, hours: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateHours = useCallback((id: string, hours: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, hours: Math.max(1, hours) } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const isInCart = useCallback((id: string) => items.some(i => i.id === id), [items]);

  const subtotal = items.reduce((sum, i) => sum + i.hourly_rate * i.hours, 0);
  const platformFee = Math.round(subtotal * 0.1);
  const total = subtotal + platformFee;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateHours, clearCart, isInCart, subtotal, platformFee, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
