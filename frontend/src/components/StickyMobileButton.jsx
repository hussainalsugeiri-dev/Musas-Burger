import React, { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useI18n } from "@/i18n";
import { useCart } from "@/cart";

const StickyMobileButton = () => {
  const { t } = useI18n();
  const { itemCount, setIsCartOpen, total } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const scrollOrCart = () => {
    if (itemCount > 0) {
      setIsCartOpen(true);
    } else {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40" data-testid="sticky-mobile-order">
      <button onClick={scrollOrCart} className="btn-primary w-full justify-center !py-4 shadow-2xl glow-gold !text-base">
        <ShoppingBag size={20} />
        {itemCount > 0 ? `${t("checkout")} · ${total.toFixed(2)} €` : t("sticky_order")}
      </button>
    </div>
  );
};

export default StickyMobileButton;
