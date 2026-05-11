import React from "react";
import { Star, Flame, MapPin, Clock, ShieldCheck, Heart } from "lucide-react";
import { useI18n } from "@/i18n";

const TrustSection = () => {
  const { t } = useI18n();
  const stars = [1, 2, 3, 4, 5];
  const items = [
    { icon: Flame, title: t("trust_p1"), desc: t("trust_p1_desc") },
    { icon: MapPin, title: t("trust_p2"), desc: t("trust_p2_desc") },
    { icon: Clock, title: t("trust_p3"), desc: t("trust_p3_desc") },
    { icon: ShieldCheck, title: t("trust_p4"), desc: t("trust_p4_desc") },
  ];

  return (
    <section id="trust" className="relative py-24 md:py-32 border-t border-white/5 overflow-hidden" data-testid="trust-section">
      <div className="absolute inset-0 opacity-25 grain" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1770629681079-86c4d2adb83f?crop=entropy&cs=srgb&fm=jpg&q=85')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/85 to-[#0A0A0A]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <span className="tag-gold inline-block mb-4">Bewertungen</span>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-display text-7xl md:text-9xl text-[#F5A623] leading-none">4,2</span>
              <span className="text-white/50 text-lg">/ 5</span>
            </div>
            <div className="flex items-center gap-1 mb-3" data-testid="rating-stars">
              {stars.map((s) => (
                <Star key={s} size={22} fill={s <= 4 ? "#F5A623" : "transparent"} stroke="#F5A623" />
              ))}
            </div>
            <p className="text-white/70 text-lg">
              <span className="text-white font-semibold">17</span> {t("reviews")} · Google
            </p>
            <p className="text-white/50 mt-6 italic leading-relaxed">
              „Frische Burger, knusprige Pommes und freundlicher Service — auch zu später Stunde. Genau der Spot, den die Schwanthalerstraße brauchte."
            </p>
          </div>

          <div className="lg:col-span-7">
            <h2 className="font-display text-5xl md:text-6xl leading-[0.9] mb-10 flex items-center gap-3">
              <Heart className="text-[#E02424]" fill="#E02424" size={40} />
              {t("trust_title")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((it, i) => {
                const Icon = it.icon;
                return (
                  <div key={i} className="card-dark p-6" data-testid={`trust-item-${i}`}>
                    <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-xl w-fit mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-display text-xl tracking-wide mb-2">{it.title}</h3>
                    <p className="text-white/55 text-sm">{it.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
