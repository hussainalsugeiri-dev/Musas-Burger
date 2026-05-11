# Musa's Burger München – PRD

## Original Problem Statement
Professionelle, moderne Website für „Musa's Burger" (Burger Restaurant, Schwanthalerstraße 126, 80339 München, 089 32741934, 4,2/17 Rezensionen). Voll funktionales Online-Bestellsystem (Lieferung/Abholung/Kontaktlose Lieferung), Warenkorb, Stripe-Checkout, Admin-Bereich, mehrsprachig DE/EN, DSGVO-konform, SEO-optimiert für lokale Suche München.

## User Choices
- Online-Bestellsystem: Voll funktional mit DB-Speicherung
- Zahlung: Stripe Integration (sk_test_emergent)
- Bilder: Nutzer lädt eigene hoch – aktuell hochwertige Unsplash/Pexels Bilder
- Admin-Bereich: Ja
- Sprache: Mehrsprachig DE/EN
- Design: Dunkler Hintergrund, Gold (#F5A623), Rot (#E02424) Akzente

## Architecture
- **Backend**: FastAPI + MongoDB + emergentintegrations (Stripe). Auto-Seed 61 echte Menüartikel auf Startup. Routen: /api/menu, /api/orders, /api/payments/checkout/session, /api/payments/checkout/status/{session_id}, /api/webhook/stripe.
- **Frontend**: React 19 + React Router 7 + TailwindCSS + shadcn/ui + sonner. Routes: /, /admin, /success, /cancel, /impressum, /datenschutz.
- **i18n**: Custom React Context, DE/EN.
- **State**: CartProvider Context mit LocalStorage Persistenz.

## User Personas
1. **Hungriger Gast (Hauptpersona)**: Mobil oder Desktop, will schnell bestellen für Lieferung/Abholung
2. **Stammkunde**: kennt die Burger, scrollt direkt zur Speisekarte
3. **Restaurantinhaber/Admin**: nutzt /admin um Bestellungen zu verwalten

## Core Requirements (statisch)
- Hero mit dualer CTA, Burger im Fokus
- Bestellbereich mit Lieferung/Abholung/Kontaktlos Toggle
- Speisekarte (9 Kategorien, 61 Artikel) mit echten Daten
- Vertrauensbereich (4,2 Sterne / 17)
- Standort mit Karte (Consent-basiert)
- Sticky Mobile Order Button
- Cookie Banner DSGVO
- Impressum & Datenschutz
- SEO Meta für München

## Implemented (2026-02)
- ✅ Backend mit Menu CRUD, Order CRUD, Stripe Checkout, Webhook
- ✅ 61 echte Menüpunkte aus User-Speisekarte (19 Beef, 3 Chicken, 2 Veggie, 3 Menüs, 4 Drehspieß, 4 Pommes, 3 Salate, 18 Getränke, 5 Desserts)
- ✅ Frontend Single-Page mit Hero, OrderSection, MenuSection, TrustSection, LocationSection, Footer
- ✅ Warenkorb (Sheet, LocalStorage), Checkout-Form, Zahlarten (Bar, Karte vor Ort, Stripe Online)
- ✅ Admin Dashboard (/admin): Bestellungen verwalten + Status, Menü ein/ausblenden
- ✅ DE/EN Sprachumschalter
- ✅ Sticky Mobile "Jetzt bestellen" Button
- ✅ DSGVO Cookie-Banner
- ✅ Impressum + Datenschutz Seiten
- ✅ SEO Meta-Tags
- ✅ Stripe Success/Cancel-Seiten mit Polling
- ✅ Backend Tests 23/24 passed; kritischer 500-Bug bei Stripe-Status mit Fallback gefixt
- ✅ Order Validation: keine leeren Items, Lieferadresse pflicht bei Delivery/Contactless

## P0 Backlog (sollte als nächstes)
- 🔒 Admin-Bereich mit Passwortschutz (aktuell offen)
- 📷 Echte Burger-Fotos hochladen (aktuell Unsplash)
- 📧 Bestellbestätigung per E-Mail (z.B. via Resend)

## P1 Backlog
- 🛎️ WhatsApp/SMS-Notification an Restaurant bei neuer Bestellung
- 🎁 Coupon/Rabattcode-System
- ⭐ Eigene Bewertungen sammeln (anstatt nur Google anzuzeigen)
- 🗺️ Dynamischer Liefergebiet-Checker (PLZ-basiert)

## P2 Backlog
- 📊 Admin-Statistiken (Umsatz, beliebteste Burger)
- 🔔 Push-Notifications für Stammkunden
- 🌐 Mehr Sprachen (TR, AR)

## Next Tasks
- User lädt eigene professionelle Burger-Bilder hoch
- Admin-Login implementieren
- E-Mail-Bestätigung integrieren
