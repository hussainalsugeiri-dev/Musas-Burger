import React, { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { useI18n } from "@/i18n";

const CookieBanner = () => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("musas_cookie");
    if (!consent) setVisible(true);
  }, []);

  const handle = (val) => {
    localStorage.setItem("musas_cookie", val);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-50 fade-up" data-testid="cookie-banner">
      <div className="bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <Cookie className="text-[#F5A623] mt-1 flex-shrink-0" size={20} />
          <p className="text-sm text-white/80 leading-relaxed">{t("cookie_text")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handle("accepted")} className="btn-primary !py-2 !px-4 text-sm flex-1 justify-center" data-testid="cookie-accept">{t("cookie_accept")}</button>
          <button onClick={() => handle("declined")} className="btn-secondary !py-2 !px-4 text-sm flex-1 justify-center" data-testid="cookie-decline">{t("cookie_decline")}</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
