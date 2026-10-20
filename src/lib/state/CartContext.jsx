import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);
const KEY = "fsc_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) return prev.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product_id: product.id, name: product.name, sku: product.sku, price: product.price, mrp: product.mrp, qty, image_url: product.image_url, vendor_id: product.vendor_id, vendor_name: product.vendor_name }];
    });
  };
  const remove = (id) => setItems((prev) => prev.filter((i) => i.product_id !== id));
  const setQty = (id, qty) => setItems((prev) => prev.map((i) => i.product_id === id ? { ...i, qty: Math.max(1, qty) } : i));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};