import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Success = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking"); // checking, paid, expired, error

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let attempts = 0;
    const maxAttempts = 8;
    const poll = async () => {
      attempts++;
      try {
        const res = await axios.get(`${API}/payments/checkout/status/${sessionId}`);
        if (res.data.payment_status === "paid") {
          setStatus("paid");
          return;
        }
        if (res.data.status === "expired") {
          setStatus("expired");
          return;
        }
        if (attempts >= maxAttempts) {
          setStatus("timeout");
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        if (attempts >= maxAttempts) setStatus("error");
        else setTimeout(poll, 2000);
      }
    };
    poll();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A]">
      <div className="card-dark max-w-md w-full p-10 text-center" data-testid="success-page">
        {status === "checking" && (
          <>
            <Clock className="mx-auto text-[#F5A623] animate-pulse mb-4" size={56} />
            <h1 className="font-display text-3xl mb-2">Zahlung wird geprüft…</h1>
            <p className="text-white/60">Einen Moment bitte.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 className="mx-auto text-green-400 mb-4" size={64} />
            <h1 className="font-display text-3xl mb-3">Vielen Dank!</h1>
            <p className="text-white/70 mb-6">Deine Bestellung ist bei uns eingegangen. Wir bereiten alles vor.</p>
            <Link to="/" className="btn-primary inline-flex" data-testid="success-home-btn">Zurück zur Startseite</Link>
          </>
        )}
        {(status === "expired" || status === "error" || status === "timeout") && (
          <>
            <AlertCircle className="mx-auto text-red-400 mb-4" size={56} />
            <h1 className="font-display text-3xl mb-3">Es gab ein Problem</h1>
            <p className="text-white/70 mb-6">Bitte versuche es erneut oder ruf uns an: <a href="tel:08932741934" className="text-[#F5A623]">089 32741934</a></p>
            <Link to="/" className="btn-primary inline-flex">Zurück zur Startseite</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Success;
