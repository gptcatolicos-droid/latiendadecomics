'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const CART_KEY = 'ltc_cart';
const CART_EMAIL_KEY = 'ltc_cart_email';
const CART_ID_KEY = 'ltc_cart_id';
const CART_TTL_DAYS = 7;

interface CartItem {
  id: string;
  line_id?: string;
  variant_id?: string;
  variant_title?: string;
  title: string;
  price_usd: number;
  price_cop: number;
  image_url?: string;
  supplier?: string;
  product_url?: string;
  quantity: number;
  added_at: number;
  is_preventa?: boolean;
}

interface CartState {
  items: CartItem[];
  cartId: string;
  addItem: (item: any, qty?: number, isPreventa?: boolean) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  count: number;
  totalUsd: number;
  setCustomerEmail: (email: string) => void;
}

const CartContext = createContext<CartState>({} as CartState);

function generateCartId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isExpired(addedAt: number): boolean {
  const days = (Date.now() - addedAt) / (1000 * 60 * 60 * 24);
  return days > CART_TTL_DAYS;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState('');

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      // Get or create cart ID
      let id = localStorage.getItem(CART_ID_KEY) || generateCartId();
      localStorage.setItem(CART_ID_KEY, id);
      setCartId(id);

      // Load items, filter expired ones
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const valid = stored.filter((item: CartItem) => !isExpired(item.added_at || 0));
      setItems(valid);
      if (valid.length !== stored.length) {
        localStorage.setItem(CART_KEY, JSON.stringify(valid));
      }
    } catch {}
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (cartId) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('cart-updated'));
    }
  }, [items, cartId]);

  const addItem = useCallback((product: any, qty = 1, isPreventa = false) => {
    const normalized: Omit<CartItem, 'quantity' | 'added_at'> = {
      id: product.id,
      line_id: product.variant_id ? `${product.id}:${product.variant_id}` : product.id,
      variant_id: product.variant_id,
      variant_title: product.variant_title,
      title: product.title,
      price_usd: Number(product.price_usd),
      price_cop: Number(product.price_cop || Math.round(Number(product.price_usd) * 4100)),
      image_url: product.image_url || product.images?.find((image: any) => image.is_primary)?.url || product.images?.[0]?.url,
      supplier: product.supplier,
      product_url: product.product_url || product.supplier_url,
      is_preventa: isPreventa,
    };
    setItems(prev => {
      const existing = prev.find(i => (i.line_id || i.id) === normalized.line_id && Boolean(i.is_preventa) === isPreventa);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(i => i === existing ? { ...i, quantity: i.quantity + qty } : i);
      } else {
        updated = [...prev, { ...normalized, quantity: qty, added_at: Date.now() }];
      }
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => (i.line_id || i.id) !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => (i.line_id || i.id) === id ? { ...i, quantity: qty } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const setCustomerEmail = useCallback((email: string) => {
    localStorage.setItem(CART_EMAIL_KEY, email);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, cartId, addItem, removeItem, updateQty,
      clearCart, totalItems, count: totalItems, totalUsd, setCustomerEmail,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
