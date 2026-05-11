import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import OrderSection from "@/components/OrderSection";
import MenuSection from "@/components/MenuSection";
import TrustSection from "@/components/TrustSection";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/Footer";
import CartSheet from "@/components/CartSheet";
import StickyMobileButton from "@/components/StickyMobileButton";
import CookieBanner from "@/components/CookieBanner";

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Musa's Burger München – Burger bestellen in der Schwanthalerstraße";
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Bestelle frische Burger bei Musa's Burger in München. Abholung, Lieferung und kontaktlose Lieferung direkt von der Schwanthalerstraße 126.");
    setMeta("keywords", "Burger München, Burger Schwanthalerstraße, Burger bestellen München, Musa's Burger München, Burger Lieferung München, Burger Restaurant München, Essen bestellen Schwanthalerstraße");
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        document.getElementById(location.state.scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.state]);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <OrderSection />
        <MenuSection />
        <TrustSection />
        <LocationSection />
      </main>
      <Footer />
      <CartSheet />
      <StickyMobileButton />
      <CookieBanner />
    </>
  );
};

export default Home;
