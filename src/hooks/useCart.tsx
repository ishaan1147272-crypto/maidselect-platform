import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type PlanType = 'hourly' | 'weekly' | 'monthly';

export interface CartItem {
  id: string;
  name: string;
  city: string | null;
  profile_image_url: string | null;
  planType: PlanType;
  planPrice: number; // price for one unit of the selected plan
  quantity: number;  // number of hours/weeks/months
}

interface CartContextType {
  items: CartItem[];
  addItem: (maid: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  subtotal: number;
  platformFee: number;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [], addItem: () => {}, removeItem: () => {}, updateQuantity: () => {},
  clearCart: () => {}, isInCart: () => false, subtotal: 0, platformFee: 0, total: 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((maid: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      if (prev.find(i => i.id === maid.id)) return prev;
      return [...prev, { ...maid, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const isInCart = useCallback((id: string) => items.some(i => i.id === id), [items]);

  const subtotal = items.reduce((sum, i) => sum + i.planPrice * i.quantity, 0);
  const platformFee = Math.round(subtotal * 0.1);
  const total = subtotal + platformFee;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, isInCart, subtotal, platformFee, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
