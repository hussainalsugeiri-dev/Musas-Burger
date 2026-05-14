import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Minus, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { useCart } from "@/cart";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartSheet = () => {
  const { t, lang } = useI18n();
  const { items, updateQty, removeItem, subtotal, deliveryFee, total, orderType, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const [step, setStep] = useState("cart"); // cart, checkout
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    delivery_address: "",
    notes: "",
    payment_method: "cash",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone) {
      toast.error(lang === "de" ? "Name und Telefon sind erforderlich" : "Name and phone are required");
      return;
    }
    if (orderType === "delivery" && !form.delivery_address) { 
      toast.error(lang === "de" ? "Lieferadresse erforderlich" : "Delivery address required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ menu_item_id: i.menu_item_id, name: i.name, price: i.price, quantity: i.quantity, extras: i.extras || [] })),
        order_type: orderType,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        delivery_address: form.delivery_address || null,
        notes: form.notes || null,
        payment_method: form.payment_method,
        origin_url: window.location.origin,
      };
      const res = await axios.post(`${API}/orders`, payload);
      if (form.payment_method === "stripe") {
        // Get checkout url
        const sessionRes = await axios.post(`${API}/payments/checkout/session`, {
          order_id: res.data.id,
          origin_url: window.location.origin,
        });
        window.location.href = sessionRes.data.url;
      } else {
        toast.success(t("order_success"), { description: t("order_success_desc") });
        clearCart();
        setIsCartOpen(false);
        setStep("cart");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Fehler beim Bestellen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="bg-[#0A0A0A] border-white/10 w-full sm:max-w-md p-0 flex flex-col" data-testid="cart-sheet">
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <SheetTitle className="font-display text-2xl tracking-wide text-white">
            {step === "cart" ? t("cart") : t("checkout")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === "cart" ? (
            <>
              {items.length === 0 ? (
                <div className="text-center py-16 text-white/50">{t("cart_empty")}</div>
              ) : (
                <div className="space-y-4">
                  {items.map((i) => (
                    <div key={i.menu_item_id} className="flex gap-3 items-center bg-[#141414] p-3 rounded-xl" data-testid={`cart-item-${i.menu_item_id}`}>
                      <img src={i.image_url} alt={i.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{lang === "de" ? i.name : (i.name_en || i.name)}</div>
                        <div className="text-[#F5A623] font-bold text-sm">{(i.price * i.quantity).toFixed(2)} €</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(i.menu_item_id, -1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md" data-testid={`qty-minus-${i.menu_item_id}`}><Minus size={14} /></button>
                        <span className="font-bold w-5 text-center">{i.quantity}</span>
                        <button onClick={() => updateQty(i.menu_item_id, 1)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md" data-testid={`qty-plus-${i.menu_item_id}`}><Plus size={14} /></button>
                        <button onClick={() => removeItem(i.menu_item_id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md ml-1" data-testid={`remove-${i.menu_item_id}`}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} id="checkout-form" className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">{t("checkout_name")} *</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="bg-[#141414] border-white/10 mt-1" required data-testid="checkout-name-input" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">{t("checkout_phone")} *</Label>
                <Input type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="bg-[#141414] border-white/10 mt-1" required data-testid="checkout-phone-input" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">{t("checkout_email")}</Label>
                <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="bg-[#141414] border-white/10 mt-1" data-testid="checkout-email-input" />
              </div>
              {orderType === "delivery" && (
                <div>
                  <Label className="text-white/70 text-sm">{t("address_label")} *</Label>
                  <Input value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} placeholder={t("address_placeholder")} className="bg-[#141414] border-white/10 mt-1" required data-testid="checkout-address-input" />
                </div>
              )}
              <div>
                <Label className="text-white/70 text-sm">{t("checkout_notes")}</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-[#141414] border-white/10 mt-1" data-testid="checkout-notes-input" />
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-2 block">{t("payment_method")}</Label>
                <RadioGroup value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })} className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-[#141414] border border-white/10 rounded-lg cursor-pointer hover:border-[#F5A623]/50">
                    <RadioGroupItem value="cash" data-testid="pay-cash-radio" />
                    <span>{t("pay_cash")}</span>
                  </label>
          
                  </RadioGroup>
				  <p className="mt-3 text-sm text-white/70 leading-relaxed">
                   Bei Lieferung ist aktuell nur Barzahlung möglich. Kartenzahlung bieten wir direkt im Restaurant bei Abholung an.
                  </p>
								 
              </div>
              <p className="text-white/40 text-xs">
                {lang === "de" ? "Telefonische Bestellung:" : "Phone orders:"} <a href="tel:08932741934" className="text-[#F5A623]">089 32741934</a>
              </p>
            </form>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/10 p-6 space-y-3 bg-[#0A0A0A]">
            <div className="flex justify-between text-white/70 text-sm">
              <span>{t("cart_subtotal")}</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-white/70 text-sm">
                <span>{t("cart_delivery_fee")}</span>
                <span>{deliveryFee.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>{t("cart_total")}</span>
              <span className="text-[#F5A623]" data-testid="cart-total">{total.toFixed(2)} €</span>
            </div>
            {step === "cart" ? (
              <button onClick={() => setStep("checkout")} className="btn-primary w-full justify-center" data-testid="proceed-checkout-btn">
                {t("checkout")}
              </button>
            ) : (
              <button type="submit" form="checkout-form" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-50" data-testid="place-order-btn">
                {submitting ? "..." : t("place_order")}
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
