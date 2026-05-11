import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Impressum = () => (
  <div className="min-h-screen bg-[#0A0A0A] text-white px-4 py-16">
    <div className="max-w-3xl mx-auto" data-testid="impressum-page">
      <Link to="/" className="text-white/60 hover:text-[#F5A623] inline-flex items-center gap-2 mb-8"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-5xl mb-8">Impressum</h1>
      <div className="prose prose-invert max-w-none text-white/75 space-y-6">
        <section>
          <h2 className="text-2xl font-display mb-2">Angaben gemäß § 5 TMG</h2>
          <p>
            Musa's Burger<br />
            Schwanthalerstraße 126<br />
            80339 München
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">Kontakt</h2>
          <p>
            Telefon: <a href="tel:08932741934" className="text-[#F5A623]">089 32741934</a>
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">Umsatzsteuer-ID</h2>
          <p className="text-white/60 italic">Hier folgt die Umsatzsteuer-Identifikationsnummer gemäß §27a UStG.</p>
        </section>
        <section>
          <h2 className="text-2xl font-display mb-2">Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer" className="text-[#F5A623]"> https://ec.europa.eu/consumers/odr/</a>.
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Impressum;
