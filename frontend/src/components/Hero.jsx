import React from "react";
import { Phone, MapPin, Flame, Star } from "lucide-react";
import { useI18n } from "@/i18n";

const Hero = () => {
  const { t } = useI18n();
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="hero-bg relative min-h-[100vh] flex items-end pb-16 md:pb-24 pt-28 overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 grain" />
      <div className="absolute top-1/2 -translate-y-1/2 right-[-10%] w-[600px] h-[600px] bg-[#F5A623] rounded-full blur-[180px] opacity-10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl fade-up">
          <div className="flex items-center gap-3 mb-6">
            <span className="tag-gold flex items-center gap-1.5"><Flame size={12} /> München · Schwanthalerstraße</span>
            <span className="flex items-center gap-1 text-sm text-white/80">
              <Star size={14} fill="#F5A623" stroke="#F5A623" /> 4,2 · 17
            </span>
          </div>
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] mb-6">
            {t("hero_title").split(" ").slice(0, -2).join(" ")}{" "}
            <span className="text-[#F5A623]">{t("hero_title").split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 max-w-2xl mb-10 leading-relaxed">{t("hero_subtitle")}</p>

          <div className="flex flex-wrap gap-3 md:gap-4">
            <button onClick={() => scrollTo("order")} className="btn-primary" data-testid="hero-order-btn">
              {t("cta_order_now")}
            </button>
            <button onClick={() => scrollTo("menu")} className="btn-secondary" data-testid="hero-menu-btn">
              {t("cta_view_menu")}
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-[#F5A623]" /> Schwanthalerstraße 126</span>
            <span className="flex items-center gap-2"><Phone size={16} className="text-[#F5A623]" /> 089 32741934</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> {t("hours_value")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
