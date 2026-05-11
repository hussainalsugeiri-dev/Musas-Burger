import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Phone } from "lucide-react";
import { useI18n } from "@/i18n";
import { useCart } from "@/cart";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { lang, setLang, t } = useI18n();
  const { itemCount, setIsCartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goSection = (id) => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-glass" : "bg-transparent"
      }`}
      data-testid="main-navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <span className="text-2xl md:text-3xl font-display tracking-wider">
            MUSA'S<span className="text-[#F5A623]">.</span>BURGER
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 ml-12 lg:ml-20">
          <button onClick={() => goSection("menu")} className="text-sm font-semibold hover:text-[#F5A623] transition-colors uppercase tracking-wide" data-testid="nav-menu-btn">{t("nav_menu")}</button>
          <button onClick={() => goSection("order")} className="text-sm font-semibold hover:text-[#F5A623] transition-colors uppercase tracking-wide" data-testid="nav-order-btn">{t("nav_order")}</button>
          <button onClick={() => goSection("trust")} className="text-sm font-semibold hover:text-[#F5A623] transition-colors uppercase tracking-wide" data-testid="nav-about-btn">{t("nav_about")}</button>
          <button onClick={() => goSection("location")} className="text-sm font-semibold hover:text-[#F5A623] transition-colors uppercase tracking-wide" data-testid="nav-location-btn">{t("nav_location")}</button>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="hidden sm:flex text-xs font-bold uppercase border border-white/15 rounded-full px-3 py-1.5 hover:border-[#F5A623] hover:text-[#F5A623] transition-colors"
            data-testid="lang-switcher"
          >
            {lang === "de" ? "EN" : "DE"}
          </button>
          <a href="tel:08932741934" className="hidden sm:flex items-center gap-2 text-sm font-semibold hover:text-[#F5A623] transition-colors" data-testid="nav-call">
            <Phone size={16} /> 089 32741934
          </a>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
            data-testid="cart-icon-btn"
            aria-label="cart"
          >
            <ShoppingBag size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F5A623] text-black text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center" data-testid="cart-count-badge">
                {itemCount}
              </span>
            )}
          </button>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/5 px-4 py-6 space-y-4" data-testid="mobile-menu">
          <button onClick={() => goSection("menu")} className="block w-full text-left text-lg font-semibold py-2">{t("nav_menu")}</button>
          <button onClick={() => goSection("order")} className="block w-full text-left text-lg font-semibold py-2">{t("nav_order")}</button>
          <button onClick={() => goSection("trust")} className="block w-full text-left text-lg font-semibold py-2">{t("nav_about")}</button>
          <button onClick={() => goSection("location")} className="block w-full text-left text-lg font-semibold py-2">{t("nav_location")}</button>
          <a href="tel:08932741934" className="block py-2 text-[#F5A623] font-semibold">089 32741934</a>
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="block text-sm font-bold uppercase border border-white/15 rounded-full px-4 py-2"
          >
            {lang === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
