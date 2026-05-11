import React from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, Instagram } from "lucide-react";
import { useI18n } from "@/i18n";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/5 py-16" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-display text-3xl tracking-wider mb-3">
            MUSA'S<span className="text-[#F5A623]">.</span>BURGER
          </div>
          <p className="text-white/50 max-w-xs">{t("footer_tagline")}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">{t("nav_location")}</div>
          <p className="text-white/70 flex items-start gap-2"><MapPin size={16} className="text-[#F5A623] mt-1" /> Schwanthalerstraße 126<br />80339 München</p>
          <a href="tel:08932741934" className="text-white/70 flex items-center gap-2 mt-3 hover:text-[#F5A623]" data-testid="footer-phone"><Phone size={16} className="text-[#F5A623]" /> 089 32741934</a>
          <a href="mailto:musasburger@outlook.de" className="text-white/70 flex items-center gap-2 mt-2 hover:text-[#F5A623] break-all" data-testid="footer-email"><span className="text-[#F5A623]">@</span> musasburger@outlook.de</a>
          <a href="https://www.instagram.com/musasburger" target="_blank" rel="noreferrer" className="text-white/70 flex items-center gap-2 mt-2 hover:text-[#F5A623]" data-testid="footer-instagram"><Instagram size={16} className="text-[#F5A623]" /> Musa's Burger</a>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">{t("footer_legal")}</div>
          <ul className="space-y-2">
            <li><Link to="/impressum" className="text-white/70 hover:text-[#F5A623]" data-testid="footer-impressum">{t("footer_impressum")}</Link></li>
            <li><Link to="/datenschutz" className="text-white/70 hover:text-[#F5A623]" data-testid="footer-privacy">{t("footer_privacy")}</Link></li>
            <li><Link to="/admin" className="text-white/40 hover:text-[#F5A623] text-sm" data-testid="footer-admin">{t("nav_admin")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="divider-line my-10 max-w-7xl mx-auto" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white/40 text-sm text-center">
        © {new Date().getFullYear()} Musa's Burger · München
      </div>
    </footer>
  );
};

export default Footer;
