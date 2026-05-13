import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { useCart } from "@/cart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = ["beef", "chicken", "veggie", "menus", "drehspiess", "pommes", "salate", "drinks", "desserts"];

const MenuSection = () => {
  const { t, lang } = useI18n();
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState("beef");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/menu`).then((res) => {
      setItems(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAdd = (item) => {
    addItem(item);
    toast.success(`${lang === "de" ? item.name_de : item.name_en} ${t("added")}`);
  };

  const filtered = items.filter((i) => i.category === activeCat);

  return (
    <section id="menu" className="relative py-24 md:py-32 border-t border-white/5" data-testid="menu-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="tag-gold inline-flex items-center gap-1.5 mb-4"><Flame size={12} /> 100% Frisch</span>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.9]">{t("menu_title")}</h2>
            <p className="text-white/60 mt-4 max-w-xl text-lg">{t("menu_subtitle")}</p>
          </div>
        </div>

        <Tabs value={activeCat} onValueChange={setActiveCat} className="w-full">
          <TabsList className="bg-transparent border border-white/10 rounded-full p-1 mb-10 flex flex-wrap h-auto justify-start overflow-x-auto" data-testid="category-tabs">
            {categories.map((c) => (
              <TabsTrigger
                key={c}
                value={c}
                className="rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider data-[state=active]:bg-[#F5A623] data-[state=active]:text-black text-white/70"
                data-testid={`cat-tab-${c}`}
              >
                {t(`cat_${c}`)}
              </TabsTrigger>
            ))}
          </TabsList>
		  
		  <div className="mb-8 rounded-2xl border-2 border-[#F5A623] bg-[#F5A623]/10 p-5 text-center shadow-lg">
  <p className="text-[#F5A623] font-black uppercase tracking-wide text-lg md:text-xl">
    Wichtiger Hinweis zu den Burger-Bildern
  </p>
  <p className="text-white font-bold text-base md:text-lg mt-2">
    Die Burger-Bilder sind nur Beispielbilder. Der echte Burger kann anders aussehen.
  </p>
  <p className="text-white/70 text-sm mt-1">
    Verbindlich sind Name, Preis, Beschreibung und Zutaten — nicht das Foto.
  </p>
</div>

          {categories.map((c) => (
            <TabsContent key={c} value={c} className="mt-0">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card-dark animate-pulse h-96" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((item) => (
                    <article key={item.id} className="card-dark overflow-hidden group flex flex-col" data-testid={`menu-item-${item.id}`}>
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name_de}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {item.featured && (
                          <span className="absolute top-3 left-3 tag-gold">★ Beliebt</span>
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h3 className="font-display text-2xl tracking-wide">{lang === "de" ? item.name_de : item.name_en}</h3>
                          <span className="text-[#F5A623] font-bold text-xl whitespace-nowrap">{item.price.toFixed(2)} €</span>
                        </div>
                        <p className="text-white/60 text-sm mb-3 flex-1">{lang === "de" ? item.description_de : item.description_en}</p>
                        {item.ingredients?.length > 0 && (
                          <p className="text-white/40 text-xs mb-4 italic">{item.ingredients.join(" · ")}</p>
                        )}
                        <button
                          onClick={() => handleAdd(item)}
                          className="btn-primary w-full justify-center !py-3"
                          data-testid={`add-to-cart-${item.id}`}
                        >
                          <Plus size={18} /> {t("add_to_cart")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default MenuSection;
