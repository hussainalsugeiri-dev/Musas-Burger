import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("musas_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [orderType, setOrderType] = useState(() => localStorage.getItem("musas_order_type") || "delivery");
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("musas_cart", JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem("musas_order_type", orderType);
  }, [orderType]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          name: item.name_de,
          name_en: item.name_en,
          price: item.price,
          image_url: item.image_url,
          quantity: 1,
          extras: [],
        },
      ];
    });
  };

  const updateQty = (menu_item_id, delta) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.menu_item_id === menu_item_id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (menu_item_id) => {
    setItems((prev) => prev.filter((i) => i.menu_item_id !== menu_item_id));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = (orderType === "delivery" || orderType === "contactless") && subtotal < 25 && subtotal > 0 ? 2.5 : 0;
  const total = subtotal + deliveryFee;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        orderType,
        setOrderType,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
