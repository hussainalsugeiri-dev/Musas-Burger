from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Musa's Burger API")
api_router = APIRouter(prefix="/api")


# ============ MODELS ============
class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_de: str
    name_en: str
    description_de: str
    description_en: str
    ingredients: List[str] = Field(default_factory=list)
    price: float
    category: str  # beef, chicken, veggie, menus, sides, drinks
    image_url: str
    available: bool = True
    featured: bool = False


class MenuItemCreate(BaseModel):
    name_de: str
    name_en: str
    description_de: str
    description_en: str
    ingredients: List[str] = []
    price: float
    category: str
    image_url: str
    available: bool = True
    featured: bool = False


class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int
    extras: List[str] = []


class OrderCreate(BaseModel):
    items: List[OrderItem]
    order_type: str  # delivery, pickup, contactless
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    payment_method: str  # cash, card_on_delivery
    origin_url: str


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[OrderItem]
    order_type: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    payment_method: str
    payment_status: str = "pending"  # pending, paid, failed
    order_status: str = "received"  # received, preparing, ready, delivered, cancelled
    subtotal: float
    delivery_fee: float = 0.0
    total: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str


# ============ HELPERS ============
def calculate_totals(items: List[OrderItem], order_type: str) -> Dict[str, float]:
    subtotal = sum(i.price * i.quantity for i in items)
    delivery_fee = 2.50 if order_type in ("delivery", "contactless") and subtotal < 25 else 0.0
    return {"subtotal": round(subtotal, 2), "delivery_fee": delivery_fee, "total": round(subtotal + delivery_fee, 2)}

def format_order_type(order_type: str) -> str:
    return {
        "delivery": "Lieferung",
        "pickup": "Abholung",
        "contactless": "Kontaktlose Lieferung",
    }.get(order_type, order_type)


def format_payment_method(payment_method: str) -> str:
    return {
        "cash": "Barzahlung",
        "card_on_delivery": "Kartenzahlung bei Abholung/Lieferung",
    }.get(payment_method, payment_method)


async def send_telegram_order_notification(order: Order):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        return

    items_text = []
    for item in order.items:
        line = f"{item.quantity}x {item.name} — {item.price:.2f} €"
        if item.extras:
            line += f" | Extras: {', '.join(item.extras)}"
        items_text.append(line)

    message = "\n".join([
        "🍔 NEUE BESTELLUNG BEI MUSA'S BURGER!",
        "",
        f"Bestellart: {format_order_type(order.order_type)}",
        f"Zahlung: {format_payment_method(order.payment_method)}",
        "",
        f"Name: {order.customer_name}",
        f"Telefon: {order.customer_phone}",
        f"E-Mail: {order.customer_email or 'Keine E-Mail angegeben'}",
        f"Adresse: {order.delivery_address or 'Keine Adresse / Abholung'}",
        "",
        "Artikel:",
        *items_text,
        "",
        f"Zwischensumme: {order.subtotal:.2f} €",
        f"Liefergebühr: {order.delivery_fee:.2f} €",
        f"Gesamt: {order.total:.2f} €",
        "",
        f"Notiz: {order.notes or 'Keine Notiz'}",
        "",
        "Bitte im Adminbereich prüfen."
    ])

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    try:
        response = await asyncio.to_thread(
            requests.post,
            url,
            json={"chat_id": chat_id, "text": message},
            timeout=10
        )

        if not response.ok:
            logging.getLogger(__name__).error("Telegram notification failed: %s", response.text)

    except Exception as e:
        logging.getLogger(__name__).error("Telegram notification error: %s", e)
MENU_VERSION = "v21_fix_remaining_images"


async def seed_menu():
    # Check version-based reseed
    meta = await db.app_meta.find_one({"key": "menu_version"}, {"_id": 0})
    if meta and meta.get("value") == MENU_VERSION:
        return
    # Drop and reseed
    await db.menu_items.delete_many({})

    BEEF_IMG_1 = "https://images.unsplash.com/photo-1571091718767-18b5b1457add?crop=entropy&cs=srgb&fm=jpg&q=85"
    BEEF_IMG_2 = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&q=85"
    BEEF_IMG_3 = "https://images.pexels.com/photos/12325012/pexels-photo-12325012.jpeg"
    BEEF_IMG_4 = "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?crop=entropy&cs=srgb&fm=jpg&q=85"
    BEEF_IMG_5 = "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?crop=entropy&cs=srgb&fm=jpg&q=85"
    BEEF_IMG_6 = "https://images.unsplash.com/photo-1561758033-d89a9ad46330?crop=entropy&cs=srgb&fm=jpg&q=85"
    BEEF_IMG_7 = "https://images.unsplash.com/photo-1550317138-10000687a72b?crop=entropy&cs=srgb&fm=jpg&q=85"
    BEEF_IMG_8 = "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?crop=entropy&cs=srgb&fm=jpg&q=85"
    CHICKEN_IMG = "https://images.unsplash.com/photo-1606755962773-d324e0a13086?crop=entropy&cs=srgb&fm=jpg&q=85"
    CHICKEN_IMG_2 = "https://images.unsplash.com/photo-1637710847214-f91d99669e18?crop=entropy&cs=srgb&fm=jpg&q=85"
    CHICKEN_IMG_3 = "https://images.unsplash.com/photo-1671106571674-a89083d27e60?crop=entropy&cs=srgb&fm=jpg&q=85"
    VEGGIE_IMG = "https://images.unsplash.com/photo-1585238340764-c6f1f6fe1a6d?crop=entropy&cs=srgb&fm=jpg&q=85"
    VEGGIE_IMG_2 = "https://images.unsplash.com/photo-1520072959219-c595dc870360?crop=entropy&cs=srgb&fm=jpg&q=85"
    DREH_IMG = "https://customer-assets.emergentagent.com/job_frisch-vom-grill/artifacts/4d0yfkbr_OIP%20%282%29.webp"
    DREH_IMG_2 = "https://images.unsplash.com/photo-1638537125835-82acb38d3531?crop=entropy&cs=srgb&fm=jpg&q=85"
    DREH_IMG_3 = "https://customer-assets.emergentagent.com/job_frisch-vom-grill/artifacts/8s1a4ndh_Download.webp"
    DREH_IMG_4 = "https://customer-assets.emergentagent.com/job_frisch-vom-grill/artifacts/yfxu1q7k_OIP%20%281%29.webp"
    POMMES_IMG = "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?crop=entropy&cs=srgb&fm=jpg&q=85"
    SWEET_POMMES = "https://images.unsplash.com/photo-1598679253544-2c97992403ea?crop=entropy&cs=srgb&fm=jpg&q=85"
    SALAT_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=srgb&fm=jpg&q=85"
    SALAT_IMG_2 = "https://images.unsplash.com/photo-1540420773420-3366772f4999?crop=entropy&cs=srgb&fm=jpg&q=85"
    CAESAR_SALAD_IMG = "/images/salads/caesar-salad.webp"
    GREEK_SALAD_IMG = "/images/salads/greek-salad.webp"
    COLESLAW_IMG = "/images/salads/coleslaw.webp"
    BEN_JERRYS_CARAMEL_SUTRA_IMG = "/images/desserts/ben-jerrys-caramel-sutra.webp"
    BEN_JERRYS_COOKIE_DOUGH_IMG = "/images/desserts/ben-jerrys-cookie-dough.webp"
    AYRAN_IMG = "/images/drinks/ayran.webp"
    ULUDAG_IMG = "/images/drinks/uludag.webp"
    SPEZI_IMG = "/images/drinks/spezi.webp"
    COCA_COLA_033_IMG = "/images/drinks/coca-cola-033.webp"
    COCA_COLA_1L_IMG = "/images/drinks/coca-cola-1l.webp"
    COCA_COLA_ZERO_033_IMG = "/images/drinks/coca-cola-zero-033.webp"
    COCA_COLA_ZERO_1L_IMG = "/images/drinks/coca-cola-zero-1l.webp"
    FANTA_033_IMG = "/images/drinks/fanta-033.webp"
    FANTA_1L_IMG = "/images/drinks/fanta-1l.webp"
    SPRITE_033_IMG = "/images/drinks/sprite-033.webp"
    SPRITE_1L_IMG = "/images/drinks/sprite-1l.webp"
    MEZZO_MIX_033_IMG = "/images/drinks/mezzo-mix-033.webp"
    MEZZO_MIX_1L_IMG = "/images/drinks/mezzo-mix-1l.webp"
    RED_BULL_IMG = "/images/drinks/red-bull.webp"
    RED_BULL_ZERO_IMG = "/images/drinks/red-bull-zero.webp"
    CAPRI_SUN_IMG = "/images/drinks/capri-sun.webp"
    WATER_STILL_IMG = "/images/drinks/wasser-still.webp"
    WATER_SPARKLING_IMG = "/images/drinks/wasser-sprudel.webp"
    DESSERT_CAKE = "https://images.unsplash.com/photo-1565958011703-44f9829ba187?crop=entropy&cs=srgb&fm=jpg&q=85"
    DESSERT_CHOCO = "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?crop=entropy&cs=srgb&fm=jpg&q=85"
    DESSERT_LAVA = "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?crop=entropy&cs=srgb&fm=jpg&q=85"
    DESSERT_BJ = "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?crop=entropy&cs=srgb&fm=jpg&q=85"
    MENU_IMG = "https://images.unsplash.com/photo-1550547660-d9450f859349?crop=entropy&cs=srgb&fm=jpg&q=85"

    items = [
        # BEEF BURGER
        {"name_de": "Alaska Burger", "name_en": "Alaska Burger", "price": 10.90, "category": "beef",
         "description_de": "Saftiger Beef-Burger mit Fries, Onion Rings und Spezialsoße.",
         "description_en": "Juicy beef burger with fries, onion rings and signature sauce.",
         "ingredients": ["Rindfleisch", "Tomaten", "Zwiebeln", "Bacon", "Fries", "Onion Rings", "Cheddar", "Spezialsoße"],
         "image_url": BEEF_IMG_1, "featured": True},
        {"name_de": "Ancora Burger", "name_en": "Ancora Burger", "price": 10.90, "category": "beef",
         "description_de": "Klassisch mit Ei, Bacon und Honig-Senf-Sauce.",
         "description_en": "Classic with egg, bacon and honey mustard sauce.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Zwiebeln", "Gurken", "Ei", "Bacon", "Burgersauce", "Honig-Senf-Sauce"],
         "image_url": BEEF_IMG_2},
        {"name_de": "Avocado Burger", "name_en": "Avocado Burger", "price": 11.90, "category": "beef",
         "description_de": "Cremige Avocado, Jalapeños und Onion Rings.",
         "description_en": "Creamy avocado, jalapeños and onion rings.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Gurken", "Jalapeños", "Zwiebeln", "Avocado", "Onion Rings", "Käse", "Mayonnaise"],
         "image_url": BEEF_IMG_5},
        {"name_de": "BBQ Bacon Burger", "name_en": "BBQ Bacon Burger", "price": 10.50, "category": "beef",
         "description_de": "Rauchige BBQ-Sauce trifft auf knusprigen Bacon.",
         "description_en": "Smoky BBQ sauce meets crispy bacon.",
         "ingredients": ["Rindfleisch", "Barbecuesauce", "Bacon", "Tomaten", "Salat", "Zwiebeln"],
         "image_url": BEEF_IMG_3},
        {"name_de": "Blue Bacon Burger", "name_en": "Blue Bacon Burger", "price": 10.90, "category": "beef",
         "description_de": "Mit kräftigem Gorgonzola und Bacon.",
         "description_en": "With bold gorgonzola and bacon.",
         "ingredients": ["Rindfleisch", "Bacon", "Gurken", "Zwiebeln", "Blaue Gorgonzola", "Salat", "Tomaten"],
         "image_url": BEEF_IMG_4},
        {"name_de": "Breakfast Burger", "name_en": "Breakfast Burger", "price": 11.90, "category": "beef",
         "description_de": "Doppelter Käse, Ei und Bacon — der Frühstücks-Hit.",
         "description_en": "Double cheese, egg and bacon — the breakfast hit.",
         "ingredients": ["Rindfleisch", "Brooklyn-Sauce", "Röstzwiebeln", "doppelter Käse", "Tomaten", "Ei", "Bacon"],
         "image_url": BEEF_IMG_6},
        {"name_de": "Brooklyn Burger", "name_en": "Brooklyn Burger", "price": 10.90, "category": "beef",
         "description_de": "New York Style mit Brooklyn-Spezialsauce.",
         "description_en": "New York style with Brooklyn special sauce.",
         "ingredients": ["Rindfleisch", "Brooklyn-Spezialsauce", "Tomaten", "Gurken", "Zwiebeln", "Cheddar", "Bacon"],
         "image_url": BEEF_IMG_7},
        {"name_de": "Burger Xtreme scharf", "name_en": "Burger Xtreme (spicy)", "price": 10.90, "category": "beef",
         "description_de": "Nur für Hartgesottene — Jalapeños und scharfe Sauce.",
         "description_en": "Only for the brave — jalapeños and hot sauce.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "saure Gurken", "Jalapeños", "Käse", "scharfe Sauce"],
         "image_url": BEEF_IMG_5},
        {"name_de": "Cheeseburger", "name_en": "Cheeseburger", "price": 8.50, "category": "beef",
         "description_de": "Der zeitlose Klassiker mit geschmolzenem Käse.",
         "description_en": "The timeless classic with melted cheese.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Zwiebeln", "saure Gurken", "Ketchup", "Mayonnaise", "Käse"],
         "image_url": BEEF_IMG_8},
        {"name_de": "Chilpancingo Cheeseburger (scharf)", "name_en": "Chilpancingo Cheeseburger (spicy)", "price": 10.90, "category": "beef",
         "description_de": "Doppelter Cheddar und scharfe Peperoni.",
         "description_en": "Double cheddar and hot peppers.",
         "ingredients": ["Rindfleisch", "doppelter Cheddar", "Zwiebeln", "Gurken", "scharfe Peperoni", "Ketchup", "Senf"],
         "image_url": BEEF_IMG_2},
        {"name_de": "Elif Burger", "name_en": "Elif Burger", "price": 10.90, "category": "beef",
         "description_de": "Mit Ei, Bacon und Röstzwiebeln.",
         "description_en": "With egg, bacon and crispy onions.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Zwiebeln", "Gurken", "Ei", "Bacon", "Röstzwiebeln", "Honig-Senf-Sauce"],
         "image_url": BEEF_IMG_1},
        {"name_de": "Hamburger", "name_en": "Hamburger", "price": 8.00, "category": "beef",
         "description_de": "Schlicht und perfekt — der Original Hamburger.",
         "description_en": "Simple and perfect — the original.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Zwiebeln", "saure Gurken", "Ketchup", "Mayonnaise"],
         "image_url": BEEF_IMG_8},
        {"name_de": "Hot Cheeseburger (scharf)", "name_en": "Hot Cheeseburger (spicy)", "price": 11.90, "category": "beef",
         "description_de": "Jalapeños, Chipotle und Remoulade.",
         "description_en": "Jalapeños, chipotle and remoulade.",
         "ingredients": ["Rindfleisch", "Salat", "Zwiebeln", "saure Gurken", "Jalapeños", "Chipotle", "Käse", "Tomaten", "Burgersauce", "Remoulade"],
         "image_url": BEEF_IMG_4},
        {"name_de": "Hulk Burger", "name_en": "Hulk Burger", "price": 11.90, "category": "beef",
         "description_de": "Mit Avocado, Bacon und Onion Rings.",
         "description_en": "With avocado, bacon and onion rings.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Gurken", "Avocado", "Bacon", "Onion Rings", "Mayonnaise"],
         "image_url": BEEF_IMG_5},
        {"name_de": "Jeff's Ancora Burger", "name_en": "Jeff's Ancora Burger", "price": 11.90, "category": "beef",
         "description_de": "Mit knusprigen Röstzwiebeln und Bacon.",
         "description_en": "With crispy fried onions and bacon.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Gurken", "Zwiebeln", "Röstzwiebeln", "Bacon", "Ketchup", "Mayonnaise"],
         "image_url": BEEF_IMG_2},
        {"name_de": "New York Cheeseburger", "name_en": "New York Cheeseburger", "price": 10.50, "category": "beef",
         "description_de": "Doppelter Cheddar — pur und kräftig.",
         "description_en": "Double cheddar — pure and bold.",
         "ingredients": ["Rindfleisch", "doppelter Cheddar", "Zwiebeln", "Gurken", "Ketchup", "Senf"],
         "image_url": BEEF_IMG_3},
        {"name_de": "Smokey Jeff's Ancora Burger", "name_en": "Smokey Jeff's Ancora Burger", "price": 11.90, "category": "beef",
         "description_de": "Rauchig, würzig und absolut süchtig machend.",
         "description_en": "Smoky, spicy and absolutely addictive.",
         "ingredients": ["Rindfleisch", "Smokey Sauce", "Tomaten", "Gurken", "Zwiebeln", "Bacon", "Cheddar", "Röstzwiebeln"],
         "image_url": BEEF_IMG_6},
        {"name_de": "Texas Burger", "name_en": "Texas Burger", "price": 10.90, "category": "beef",
         "description_de": "Smokey BBQ, Onion Rings und Bacon.",
         "description_en": "Smoky BBQ, onion rings and bacon.",
         "ingredients": ["Rindfleisch", "Salat", "Tomaten", "Gurken", "Zwiebeln", "Onion Rings", "Bacon", "Smokey BBQ"],
         "image_url": BEEF_IMG_1},
        {"name_de": "Viva Italy Burger", "name_en": "Viva Italy Burger", "price": 10.90, "category": "beef",
         "description_de": "Italienische Note mit Rucola und Parmesan.",
         "description_en": "Italian flair with arugula and parmesan.",
         "ingredients": ["Rindfleisch", "Zwiebeln", "Tomaten", "Rucola", "Parmesan", "Salat", "Paprika", "Gurken", "Mayonnaise"],
         "image_url": BEEF_IMG_7},

        # CHICKEN BURGER
        {"name_de": "Chicken Avocado Burger", "name_en": "Chicken Avocado Burger", "price": 11.90, "category": "chicken",
         "description_de": "Crispy Chicken mit Avocado und Honig-Senf-Sauce.",
         "description_en": "Crispy chicken with avocado and honey mustard.",
         "ingredients": ["Crispy Chicken", "Salat", "Tomaten", "Gurken", "Avocado", "Bacon", "Cheddar", "Honig-Senf-Sauce"],
         "image_url": CHICKEN_IMG, "featured": True},
        {"name_de": "Country Chicken Burger", "name_en": "Country Chicken Burger", "price": 11.90, "category": "chicken",
         "description_de": "Mit BBQ-Sauce, Röstzwiebeln und Cheddar.",
         "description_en": "With BBQ sauce, crispy onions and cheddar.",
         "ingredients": ["Crispy Chicken", "Salat", "Röstzwiebeln", "Tomaten", "Cheddar", "BBQ-Sauce", "Bacon"],
         "image_url": CHICKEN_IMG_2},
        {"name_de": "Crispy Chicken Burger", "name_en": "Crispy Chicken Burger", "price": 9.50, "category": "chicken",
         "description_de": "Knuspriges Hähnchenfilet im Bun.",
         "description_en": "Crispy chicken fillet in a bun.",
         "ingredients": ["Crispy Chicken", "Salat", "Tomaten", "Gurken", "Mayonnaise"],
         "image_url": CHICKEN_IMG_3},

        # VEGGIE BURGER
        {"name_de": "Jeff's Ancora Veggie Burger", "name_en": "Jeff's Ancora Veggie Burger", "price": 11.90, "category": "veggie",
         "description_de": "Hausgemachtes Gemüsepatty mit Avocado und Rucola.",
         "description_en": "Homemade veggie patty with avocado and arugula.",
         "ingredients": ["Gemüsepatty", "Spezialsauce", "Avocado", "Tomaten", "Zwiebeln", "Gurken", "Rucola"],
         "image_url": VEGGIE_IMG, "featured": True},
        {"name_de": "Veggie Burger", "name_en": "Veggie Burger", "price": 10.50, "category": "veggie",
         "description_de": "Klassisches Gemüsepatty mit Rucola und Balsamico.",
         "description_en": "Classic veggie patty with arugula and balsamic.",
         "ingredients": ["Gemüsepatty", "Salat", "Tomaten", "Gurken", "Zwiebeln", "Rucola", "Balsamico", "Mayonnaise"],
         "image_url": VEGGIE_IMG_2},

        # MENÜS
        {"name_de": "Beef Burger Menü", "name_en": "Beef Burger Combo", "price": 17.90, "category": "menus",
         "description_de": "Beef Burger nach Wahl + Pommes + Coleslaw + Getränk.",
         "description_en": "Beef burger of choice + fries + coleslaw + drink.",
         "ingredients": ["Beef Burger nach Wahl", "Pommes", "Coleslaw Salat", "Getränk nach Wahl"],
         "image_url": MENU_IMG, "featured": True},
        {"name_de": "Chicken Burger Menü", "name_en": "Chicken Burger Combo", "price": 17.90, "category": "menus",
         "description_de": "Chicken Burger nach Wahl + Pommes + Coleslaw + Getränk.",
         "description_en": "Chicken burger of choice + fries + coleslaw + drink.",
         "ingredients": ["Chicken Burger nach Wahl", "Pommes", "Coleslaw Salat", "Getränk nach Wahl"],
         "image_url": MENU_IMG},
        {"name_de": "Veggie Burger Menü", "name_en": "Veggie Burger Combo", "price": 17.90, "category": "menus",
         "description_de": "Veggie Burger nach Wahl + Pommes + Coleslaw + Getränk.",
         "description_en": "Veggie burger of choice + fries + coleslaw + drink.",
         "ingredients": ["Veggie Burger nach Wahl", "Pommes", "Coleslaw Salat", "Getränk nach Wahl"],
         "image_url": MENU_IMG},

        # DREHSPIESS
        {"name_de": "Drehspieß-Sandwich", "name_en": "Kebab Sandwich", "price": 8.00, "category": "drehspiess",
         "description_de": "Drehspießfleisch im frischen Fladenbrot.",
         "description_en": "Rotisserie meat in fresh flatbread.",
         "ingredients": ["Drehspießfleisch", "Salat", "Tomaten", "Zwiebeln", "Soße", "Fladenbrot"],
         "image_url": DREH_IMG_2},
        {"name_de": "Drehspieß-Dürüm", "name_en": "Kebab Dürüm", "price": 9.00, "category": "drehspiess",
         "description_de": "Drehspieß im gerollten Yufka-Wrap.",
         "description_en": "Kebab rolled in yufka wrap.",
         "ingredients": ["Drehspießfleisch", "Salat", "Tomaten", "Zwiebeln", "Soße", "Yufka-Wrap"],
         "image_url": DREH_IMG},
        {"name_de": "Drehspieß-Box", "name_en": "Kebab Box", "price": 8.50, "category": "drehspiess",
         "description_de": "Drehspieß mit Pommes und Salat in der Box.",
         "description_en": "Kebab with fries and salad in a box.",
         "ingredients": ["Drehspießfleisch", "Pommes", "Salat", "Soße"],
         "image_url": DREH_IMG_3},
        {"name_de": "Drehspieß-Teller", "name_en": "Kebab Plate", "price": 11.50, "category": "drehspiess",
         "description_de": "Großer Teller mit Drehspieß, Pommes und Salat.",
         "description_en": "Large plate with kebab, fries and salad.",
         "ingredients": ["Drehspießfleisch", "Pommes", "Salat", "Soße"],
         "image_url": DREH_IMG_4},

        # POMMES
        {"name_de": "Pommes Frites (klein)", "name_en": "French Fries (small)", "price": 3.50, "category": "pommes",
         "description_de": "Knusprige Pommes mit Meersalz.", "description_en": "Crispy fries with sea salt.",
         "ingredients": ["Kartoffeln", "Meersalz"], "image_url": POMMES_IMG},
        {"name_de": "Pommes Frites (groß)", "name_en": "French Fries (large)", "price": 5.50, "category": "pommes",
         "description_de": "Große Portion knusprige Pommes.", "description_en": "Large portion crispy fries.",
         "ingredients": ["Kartoffeln", "Meersalz"], "image_url": POMMES_IMG},
        {"name_de": "Süßkartoffel Pommes (klein)", "name_en": "Sweet Potato Fries (small)", "price": 3.50, "category": "pommes",
         "description_de": "Süßkartoffel-Pommes mit Aioli.", "description_en": "Sweet potato fries with aioli.",
         "ingredients": ["Süßkartoffeln", "Meersalz"], "image_url": SWEET_POMMES},
        {"name_de": "Süßkartoffel Pommes (groß)", "name_en": "Sweet Potato Fries (large)", "price": 5.50, "category": "pommes",
         "description_de": "Große Portion Süßkartoffel-Pommes.", "description_en": "Large portion sweet potato fries.",
         "ingredients": ["Süßkartoffeln", "Meersalz"], "image_url": SWEET_POMMES},

        # SALATE
        {"name_de": "Caesar Salat", "name_en": "Caesar Salad", "price": 9.00, "category": "salate",
         "description_de": "Klassischer Caesar mit Crispy Chicken und Parmesan.",
         "description_en": "Classic Caesar with crispy chicken and parmesan.",
         "ingredients": ["Salat", "Cherrytomaten", "Croutons", "Crispy Chicken", "Parmesan", "Oregano", "Caesar Dressing"],
         "image_url": CAESAR_SALAD_IMG},
        {"name_de": "Griechischer Salat", "name_en": "Greek Salad", "price": 9.00, "category": "salate",
         "description_de": "Frisch mit Feta, Oliven und Joghurtdressing.",
         "description_en": "Fresh with feta, olives and yogurt dressing.",
         "ingredients": ["Salat", "Cherrytomaten", "Gurken", "Feta-Käse", "Oliven", "Oregano", "Joghurtdressing"],
         "image_url": GREEK_SALAD_IMG},
        {"name_de": "Coleslaw Salat", "name_en": "Coleslaw", "price": 3.50, "category": "salate",
         "description_de": "Hausgemachter Krautsalat — die perfekte Beilage.",
         "description_en": "Homemade coleslaw — the perfect side.",
         "ingredients": ["Weißkohl", "Karotten", "Joghurt", "Essig"],
         "image_url": COLESLAW_IMG},

        # GETRÄNKE
        {"name_de": "Ayran (0,25l)", "name_en": "Ayran (0.25l)", "price": 2.00, "category": "drinks",
         "description_de": "Erfrischender Joghurtdrink.", "description_en": "Refreshing yogurt drink.",
         "ingredients": [], "image_url": AYRAN_IMG},
        {"name_de": "Uludag Gazoz (0,33l)", "name_en": "Uludag Gazoz (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Türkische Limonade.", "description_en": "Turkish soda.",
         "ingredients": [], "image_url": ULUDAG_IMG},
        {"name_de": "Spezi (0,33l)", "name_en": "Spezi (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Cola-Orange Mix.", "description_en": "Cola-orange mix.",
         "ingredients": [], "image_url": SPEZI_IMG},
        {"name_de": "Coca-Cola (0,33l)", "name_en": "Coca-Cola (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Coca-Cola gekühlt.", "description_en": "Chilled Coca-Cola.",
         "ingredients": [], "image_url": COCA_COLA_033_IMG},
        {"name_de": "Coca-Cola (1,0l)", "name_en": "Coca-Cola (1.0l)", "price": 3.50, "category": "drinks",
         "description_de": "Familienflasche.", "description_en": "Family bottle.",
         "ingredients": [], "image_url": COCA_COLA_1L_IMG},
        {"name_de": "Coca-Cola Zero (0,33l)", "name_en": "Coca-Cola Zero (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Zero Sugar.", "description_en": "Zero sugar.",
         "ingredients": [], "image_url": COCA_COLA_ZERO_033_IMG},
        {"name_de": "Coca-Cola Zero (1,0l)", "name_en": "Coca-Cola Zero (1.0l)", "price": 3.50, "category": "drinks",
         "description_de": "Familienflasche zuckerfrei.", "description_en": "Sugar-free family bottle.",
         "ingredients": [], "image_url": COCA_COLA_ZERO_1L_IMG},
        {"name_de": "Fanta Orange (0,33l)", "name_en": "Fanta Orange (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Fruchtige Orangenlimo.", "description_en": "Fruity orange soda.",
         "ingredients": [], "image_url": FANTA_033_IMG},
        {"name_de": "Fanta Orange (1,0l)", "name_en": "Fanta Orange (1.0l)", "price": 3.50, "category": "drinks",
         "description_de": "Familienflasche.", "description_en": "Family bottle.",
         "ingredients": [], "image_url": FANTA_1L_IMG},
        {"name_de": "Sprite (0,33l)", "name_en": "Sprite (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Zitronen-Limettenlimo.", "description_en": "Lemon-lime soda.",
         "ingredients": [], "image_url": SPRITE_033_IMG},
        {"name_de": "Sprite (1,0l)", "name_en": "Sprite (1.0l)", "price": 3.50, "category": "drinks",
         "description_de": "Familienflasche.", "description_en": "Family bottle.",
         "ingredients": [], "image_url": SPRITE_1L_IMG},
        {"name_de": "Mezzo Mix (0,33l)", "name_en": "Mezzo Mix (0.33l)", "price": 2.50, "category": "drinks",
         "description_de": "Cola-Orange Mix.", "description_en": "Cola-orange mix.",
         "ingredients": [], "image_url": MEZZO_MIX_033_IMG},
        {"name_de": "Mezzo Mix (1,0l)", "name_en": "Mezzo Mix (1.0l)", "price": 3.50, "category": "drinks",
         "description_de": "Familienflasche.", "description_en": "Family bottle.",
         "ingredients": [], "image_url": MEZZO_MIX_1L_IMG},
        {"name_de": "Red Bull (0,25l)", "name_en": "Red Bull (0.25l)", "price": 3.50, "category": "drinks",
         "description_de": "Energy zum Burger.", "description_en": "Energy for your burger.",
         "ingredients": [], "image_url": RED_BULL_IMG},
        {"name_de": "Red Bull Zero (0,25l)", "name_en": "Red Bull Zero (0.25l)", "price": 3.50, "category": "drinks",
         "description_de": "Zero Sugar Energy.", "description_en": "Zero sugar energy.",
         "ingredients": [], "image_url": RED_BULL_ZERO_IMG},
        {"name_de": "Capri-Sun (0,20l)", "name_en": "Capri-Sun (0.20l)", "price": 2.00, "category": "drinks",
         "description_de": "Fruchtsaftgetränk für Kids.", "description_en": "Fruit drink for kids.",
         "ingredients": [], "image_url": CAPRI_SUN_IMG},
        {"name_de": "Mineralwasser still (0,5l)", "name_en": "Still Water (0.5l)", "price": 2.50, "category": "drinks",
         "description_de": "Stilles Mineralwasser.", "description_en": "Still mineral water.",
         "ingredients": [], "image_url": WATER_STILL_IMG},
        {"name_de": "Mineralwasser sprudel (0,5l)", "name_en": "Sparkling Water (0.5l)", "price": 2.50, "category": "drinks",
         "description_de": "Sprudelndes Mineralwasser.", "description_en": "Sparkling mineral water.",
         "ingredients": [], "image_url": WATER_SPARKLING_IMG},

        # DESSERTS
        {"name_de": "Cheese Cake", "name_en": "Cheese Cake", "price": 4.00, "category": "desserts",
         "description_de": "Cremiger New York Cheesecake.",
         "description_en": "Creamy New York cheesecake.",
         "ingredients": [], "image_url": DESSERT_CAKE},
        {"name_de": "Schokoladen Blechkuchen", "name_en": "Chocolate Sheet Cake", "price": 4.00, "category": "desserts",
         "description_de": "Saftiger Schokoladenkuchen.",
         "description_en": "Moist chocolate cake.",
         "ingredients": [], "image_url": DESSERT_CHOCO},
        {"name_de": "Lava Cake", "name_en": "Lava Cake", "price": 4.00, "category": "desserts",
         "description_de": "Warmer Schokoladenkuchen mit flüssigem Kern.",
         "description_en": "Warm chocolate cake with molten center.",
         "ingredients": [], "image_url": DESSERT_LAVA},
        {"name_de": "Ben & Jerry's Caramel Sutra (465ml)", "name_en": "Ben & Jerry's Caramel Sutra (465ml)",
         "price": 8.00, "category": "desserts",
         "description_de": "Karamell & Schokolade — Eiscreme-Klassiker.",
         "description_en": "Caramel & chocolate ice cream classic.",
         "ingredients": [], "image_url": BEN_JERRYS_CARAMEL_SUTRA_IMG},
        {"name_de": "Ben & Jerry's Cookie Dough (465ml)", "name_en": "Ben & Jerry's Cookie Dough (465ml)",
         "price": 8.00, "category": "desserts",
         "description_de": "Vanille mit Cookie-Teig-Stückchen.",
         "description_en": "Vanilla with cookie dough chunks.",
         "ingredients": [], "image_url": BEN_JERRYS_COOKIE_DOUGH_IMG},
    ]
    for it in items:
        obj = MenuItem(**it)
        await db.menu_items.insert_one(obj.model_dump())

    await db.app_meta.update_one(
        {"key": "menu_version"},
        {"$set": {"key": "menu_version", "value": MENU_VERSION}},
        upsert=True,
    )
    logger.info(f"Seeded {len(items)} menu items (version {MENU_VERSION})")


# ============ MENU ENDPOINTS ============
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.get("/menu/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(payload: MenuItemCreate):
    obj = MenuItem(**payload.model_dump())
    await db.menu_items.insert_one(obj.model_dump())
    return obj


@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, payload: MenuItemCreate):
    update_data = payload.model_dump()
    result = await db.menu_items.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return item


@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}


# ============ ORDER ENDPOINTS ============
@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate, http_request: Request):
    # Validate items
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")
            # Anti-abuse: limit quantity per item
    for item in payload.items:
        if item.quantity > 5:
            raise HTTPException(
                status_code=400,
                detail="Maximal 5 Stück pro Produkt online bestellbar. Für größere Mengen bitte telefonisch bestellen."
            )
    # Validate delivery requires address
    if payload.order_type == "delivery" and not payload.delivery_address:
        raise HTTPException(status_code=400, detail="Delivery address is required for delivery orders")
    # Validate items against DB to prevent price manipulation
    validated_items: List[OrderItem] = []
    for it in payload.items:
        db_item = await db.menu_items.find_one({"id": it.menu_item_id}, {"_id": 0})
        if not db_item:
            raise HTTPException(status_code=400, detail=f"Menu item {it.menu_item_id} not found")
        validated_items.append(OrderItem(
            menu_item_id=db_item["id"],
            name=db_item["name_de"],
            price=db_item["price"],
            quantity=it.quantity,
            extras=it.extras,
        ))
    totals = calculate_totals(validated_items, payload.order_type)
    
        # Minimum order value for delivery
    if payload.order_type == "delivery" and totals["subtotal"] < 15:
        raise HTTPException(
            status_code=400,
            detail="Der Mindestbestellwert für Lieferung beträgt 15 €."
        )
    
    order = Order(
        items=validated_items,
        order_type=payload.order_type,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        delivery_address=payload.delivery_address,
        notes=payload.notes,
        payment_method=payload.payment_method,
        subtotal=totals["subtotal"],
        delivery_fee=totals["delivery_fee"],
        total=totals["total"],
    )
    
        # Anti-spam: limit repeated orders by phone and IP
    client_ip = http_request.client.host if http_request.client else "unknown"
    thirty_minutes_ago = datetime.now(timezone.utc).timestamp() - 1800

    recent_phone_orders = await db.orders.count_documents({
        "customer_phone": payload.customer_phone,
        "created_timestamp": {"$gte": thirty_minutes_ago}
    })

    if recent_phone_orders >= 3:
        raise HTTPException(
            status_code=429,
            detail="Zu viele Bestellungen mit dieser Telefonnummer. Bitte telefonisch bestellen."
        )

    recent_ip_orders = await db.orders.count_documents({
        "client_ip": client_ip,
        "created_timestamp": {"$gte": thirty_minutes_ago}
    })

    if recent_ip_orders >= 5:
        raise HTTPException(
            status_code=429,
            detail="Zu viele Bestellungen in kurzer Zeit. Bitte später erneut versuchen oder telefonisch bestellen."
        )

    doc = order.model_dump()
    doc["client_ip"] = client_ip
    doc["created_timestamp"] = datetime.now(timezone.utc).timestamp()

    await db.orders.insert_one(doc)

    asyncio.create_task(send_telegram_order_notification(order))

    return order    


@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid = ["received", "preparing", "ready", "delivered", "cancelled"]
    if status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"order_status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "status": status}



# ============ HEALTH ============
@api_router.get("/")
async def root():
    return {"message": "Musa's Burger API", "version": "1.0"}

@app.get("/")
async def health():
    return {"message": "Musa's Burger API", "version": "1.0"}

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await seed_menu()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
