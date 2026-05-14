import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  received: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  preparing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  ready: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
const [isAuthenticated, setIsAuthenticated] = useState(
  localStorage.getItem("musas_admin_authenticated") === "true"
);

const handleLogin = (e) => {
  e.preventDefault();

  if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
    localStorage.setItem("musas_admin_authenticated", "true");
    setIsAuthenticated(true);
  } else {
    toast.error("Falsches Admin-Passwort");
  }
};

const handleLogout = () => {
  localStorage.removeItem("musas_admin_authenticated");
  setIsAuthenticated(false);
  setPassword("");
};

  const loadData = async () => {
    try {
      const [ord, m] = await Promise.all([axios.get(`${API}/orders`), axios.get(`${API}/menu`)]);
      setOrders(ord.data);
      setMenu(m.data);
    } catch (e) {
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!isAuthenticated) return;

  loadData();
  const id = setInterval(loadData, 15000);
  return () => clearInterval(id);
}, [isAuthenticated]);
if (!isAuthenticated) {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
        <p className="text-white/60 mb-6">
          Bitte Admin-Passwort eingeben, um Bestellungen zu sehen.
        </p>

        <input
          type="password"
          placeholder="Admin-Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-[#F5A623]"
        />

        <Button type="submit" className="w-full bg-[#F5A623] text-black font-bold hover:bg-[#F5A623]/90">
          Einloggen
        </Button>

        <Link to="/" className="block text-center text-white/50 text-sm mt-4 hover:text-white">
          Zurück zur Website
        </Link>
      </form>
    </div>
  );
}

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      toast.success("Status aktualisiert");
      loadData();
    } catch {
      toast.error("Fehler");
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await axios.put(`${API}/menu/${item.id}`, { ...item, available: !item.available });
      toast.success("Aktualisiert");
      loadData();
    } catch {
      toast.error("Fehler");
    }
  };

  useEffect(() => { document.title = "Admin · Musa's Burger"; }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-12">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-xl z-10" data-testid="admin-header">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-white/60 hover:text-white flex items-center gap-2"><ArrowLeft size={18} /> Zurück</Link>
          <h1 className="font-display text-2xl tracking-wide">Admin Dashboard</h1>
        </div>
        <button onClick={loadData} className="btn-secondary !py-2 !px-4 text-sm" data-testid="admin-refresh-btn"><RefreshCw size={16} /> Neu laden</button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="orders">
          <TabsList className="bg-[#141414] border border-white/10 mb-6">
            <TabsTrigger value="orders" data-testid="admin-tab-orders">Bestellungen ({orders.length})</TabsTrigger>
            <TabsTrigger value="menu" data-testid="admin-tab-menu">Speisekarte ({menu.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loading ? <p>Laden...</p> : orders.length === 0 ? (
              <p className="text-white/50 text-center py-16">Noch keine Bestellungen</p>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="card-dark p-6" data-testid={`admin-order-${o.id}`}>
                    <div className="flex flex-wrap justify-between gap-4 mb-4">
                      <div>
                        <div className="font-display text-xl">#{o.id.slice(0, 8)}</div>
                        <div className="text-sm text-white/50">{new Date(o.created_at).toLocaleString("de-DE")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#F5A623]">{o.total.toFixed(2)} €</div>
                        <Badge className={`${statusColors[o.order_status]} border`}>{o.order_status}</Badge>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-white/40">Kunde:</span> <span className="font-semibold">{o.customer_name}</span><br />
                        <span className="text-white/40">Tel:</span> <a href={`tel:${o.customer_phone}`} className="text-[#F5A623]">{o.customer_phone}</a><br />
                        <span className="text-white/40">Typ:</span> {o.order_type} · <span className="text-white/40">Zahlung:</span> {o.payment_method} ({o.payment_status})
                      </div>
                      <div>
                        {o.delivery_address && <><span className="text-white/40">Adresse:</span> {o.delivery_address}<br /></>}
                        {o.notes && <><span className="text-white/40">Notiz:</span> {o.notes}</>}
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-3 mb-4 text-sm">
                      {o.items.map((it, i) => (
                        <div key={i} className="flex justify-between py-1">
                          <span>{it.quantity}× {it.name}</span>
                          <span className="text-white/60">{(it.price * it.quantity).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={o.order_status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="w-48 bg-[#1a1a1a] border-white/10" data-testid={`status-select-${o.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-white/10">
                          <SelectItem value="received">Eingegangen</SelectItem>
                          <SelectItem value="preparing">In Zubereitung</SelectItem>
                          <SelectItem value="ready">Fertig</SelectItem>
                          <SelectItem value="delivered">Ausgeliefert</SelectItem>
                          <SelectItem value="cancelled">Storniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.map((m) => (
                <div key={m.id} className="card-dark overflow-hidden" data-testid={`admin-menu-${m.id}`}>
                  <img src={m.image_url} alt={m.name_de} className="w-full h-32 object-cover" />
                  <div className="p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">{m.name_de}</h3>
                      <span className="text-[#F5A623] font-bold">{m.price.toFixed(2)} €</span>
                    </div>
                    <div className="text-xs text-white/40 mb-3">{m.category}</div>
                    <button onClick={() => toggleAvailable(m)} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${m.available ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`} data-testid={`toggle-available-${m.id}`}>
                      {m.available ? "Verfügbar" : "Nicht verfügbar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
