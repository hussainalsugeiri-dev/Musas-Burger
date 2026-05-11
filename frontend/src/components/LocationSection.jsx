import React, { useState } from "react";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import { useI18n } from "@/i18n";

const LocationSection = () => {
  const { t } = useI18n();
  const [mapLoaded, setMapLoaded] = useState(false);

  const address = "Schwanthalerstraße 126, 80339 München";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <section id="location" className="relative py-24 md:py-32 border-t border-white/5" data-testid="location-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="tag-gold inline-block mb-4">{t("nav_location")}</span>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.9] mb-6">{t("location_title")}</h2>
            <p className="text-white/60 text-lg max-w-md mb-10">{t("location_subtitle")}</p>

            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-xl h-fit"><MapPin size={20} /></div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-1">{t("address")}</div>
                  <div className="font-semibold text-lg">Musa's Burger</div>
                  <div className="text-white/70">Schwanthalerstraße 126</div>
                  <div className="text-white/70">80339 München</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-xl h-fit"><Phone size={20} /></div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-1">{t("phone_label")}</div>
                  <a href="tel:08932741934" className="font-semibold text-lg hover:text-[#F5A623]" data-testid="location-phone-link">089 32741934</a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-xl h-fit"><Clock size={20} /></div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-1">{t("hours")}</div>
                  <div className="font-semibold text-lg">{t("hours_value")}</div>
                  <div className="text-white/60 text-sm">Plus Code: 4GQW+5P München</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-primary" data-testid="route-btn">
                <Navigation size={18} /> {t("cta_route")}
              </a>
              <a href="tel:08932741934" className="btn-secondary" data-testid="location-call-btn">
                <Phone size={18} /> {t("cta_call")}
              </a>
            </div>
          </div>

          <div className="relative h-[450px] rounded-2xl overflow-hidden border border-white/10 bg-[#141414]" data-testid="map-container">
            {!mapLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0A0A0A]">
                <MapPin className="text-[#F5A623] mb-4" size={48} />
                <p className="text-white/70 max-w-sm mb-6">{t("map_consent")}</p>
                <button onClick={() => setMapLoaded(true)} className="btn-primary" data-testid="load-map-btn">
                  {t("show_map")}
                </button>
              </div>
            ) : (
              <iframe
                title="Musa's Burger location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg) saturate(0.7)" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
