import React from "react";
import { Truck, ShoppingBag, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { useCart } from "@/cart";

const OrderSection = () => {
  const { t } = useI18n();
  const { orderType, setOrderType, setIsCartOpen, itemCount } = useCart();

  const options = [
    { id: "delivery", icon: Truck, label: t("order_type_delivery"), desc: "30–45 min" },
    { id: "pickup", icon: ShoppingBag, label: t("order_type_pickup"), desc: "15–20 min" },
  ];

  return (
    <section id="order" className="relative py-24 md:py-32 border-t border-white/5 bg-gradient-to-b from-transparent via-[#0E0E0E] to-transparent" data-testid="order-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="tag-gold inline-block mb-4">{t("nav_order")}</span>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.9] mb-4">{t("order_section_title")}</h2>
            <p className="text-white/60 text-lg max-w-md">{t("order_section_subtitle")}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })} className="btn-primary" data-testid="order-section-menu-btn">
                {t("cta_view_menu")} <ArrowRight size={18} />
              </button>
              <a href="tel:08932741934" className="btn-secondary" data-testid="order-section-call-btn">
                {t("cta_call")} · 089 32741934
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {options.map((opt) => {
              const Icon = opt.icon;
              const active = orderType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setOrderType(opt.id)}
                  className={`text-left p-6 rounded-2xl border transition-all flex items-center gap-5 ${
                    active
                      ? "border-[#F5A623] bg-[#F5A623]/10 shadow-[0_0_30px_rgba(245,166,35,0.15)]"
                      : "border-white/10 bg-[#141414] hover:border-white/30"
                  }`}
                  data-testid={`order-type-${opt.id}`}
                >
                  <div className={`p-3 rounded-xl ${active ? "bg-[#F5A623] text-black" : "bg-white/5 text-[#F5A623]"}`}>
                    <Icon size={26} />
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-2xl tracking-wide">{opt.label}</div>
                    <div className="text-sm text-white/55">{opt.desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${active ? "border-[#F5A623] bg-[#F5A623]" : "border-white/30"}`} />
                </button>
              );
            })}
            {itemCount > 0 && (
              <button onClick={() => setIsCartOpen(true)} className="btn-primary justify-center w-full mt-2" data-testid="order-section-checkout-btn">
                {t("checkout")} ({itemCount}) <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSection;
