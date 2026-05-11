import React from "react";
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

const Cancel = () => (
  <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A]">
    <div className="card-dark max-w-md w-full p-10 text-center" data-testid="cancel-page">
      <XCircle className="mx-auto text-red-400 mb-4" size={56} />
      <h1 className="font-display text-3xl mb-3">Zahlung abgebrochen</h1>
      <p className="text-white/70 mb-6">Deine Bestellung wurde nicht abgeschlossen. Du kannst es erneut versuchen.</p>
      <Link to="/" className="btn-primary inline-flex">Zurück zur Startseite</Link>
    </div>
  </div>
);

export default Cancel;
