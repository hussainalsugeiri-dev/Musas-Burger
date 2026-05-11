import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { I18nProvider } from "@/i18n";
import { CartProvider } from "@/cart";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Success from "@/pages/Success";
import Cancel from "@/pages/Cancel";
import Impressum from "@/pages/Impressum";
import Datenschutz from "@/pages/Datenschutz";

function App() {
  return (
    <div className="App">
      <I18nProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/success" element={<Success />} />
              <Route path="/cancel" element={<Cancel />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
            </Routes>
            <Toaster theme="dark" position="top-center" richColors />
          </BrowserRouter>
        </CartProvider>
      </I18nProvider>
    </div>
  );
}

export default App;
