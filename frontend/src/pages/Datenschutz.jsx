import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Datenschutz = () => (
  <div className="min-h-screen bg-[#0A0A0A] text-white px-4 py-16">
    <div className="max-w-3xl mx-auto" data-testid="datenschutz-page">
      <Link to="/" className="text-white/60 hover:text-[#F5A623] inline-flex items-center gap-2 mb-8"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-5xl mb-8">Datenschutzerklärung</h1>
      <div className="text-white/75 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-2xl font-display mb-2">1. Verantwortlicher</h2>
          <p>Musa's Burger, Schwanthalerstraße 126, 80339 München. Telefon: 089 32741934.</p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">2. Erhebung personenbezogener Daten</h2>
          <p>
            Wir verarbeiten personenbezogene Daten ausschließlich zur Abwicklung deiner Bestellung
            (Name, Telefonnummer, Lieferadresse, optional E-Mail). Die Daten werden nicht an Dritte weitergegeben,
            ausgenommen Zahlungsdienstleister (Stripe) und Lieferpersonal.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">3. Cookies</h2>
          <p>
            Wir verwenden technisch notwendige Cookies (z. B. Warenkorb, Sprache).
            Externe Dienste wie Google Maps werden ausschließlich nach deiner Einwilligung geladen.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">4. Zahlungsdienstleister</h2>
          <p>
            Für Online-Zahlungen nutzen wir Stripe Payments Europe Ltd. Die Datenübermittlung erfolgt
            verschlüsselt. Es gelten ergänzend die Datenschutzbestimmungen von Stripe.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">5. Deine Rechte</h2>
          <p>
            Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung
            deiner Daten sowie ein Beschwerderecht bei der zuständigen Aufsichtsbehörde.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Datenschutz;
