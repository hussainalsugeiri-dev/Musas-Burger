"""Backend tests for Musa's Burger API.
Covers: menu CRUD, order creation w/ validation, totals/delivery fee, stripe session,
status updates, payment status endpoint, and webhook signature handling.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://frisch-vom-grill.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
EXPECTED_CATEGORIES = {"beef", "chicken", "veggie", "menus", "drehspiess", "pommes", "salate", "drinks", "desserts"}
EXPECTED_TOTAL = 61


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def menu_items(session):
    r = session.get(f"{API}/menu", timeout=30)
    assert r.status_code == 200
    return r.json()


# ---------- HEALTH ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "message" in data


# ---------- MENU ----------
class TestMenu:
    def test_menu_count_and_categories(self, menu_items):
        # 61 items expected
        assert len(menu_items) == EXPECTED_TOTAL, f"Expected {EXPECTED_TOTAL} items, got {len(menu_items)}"
        cats = {i["category"] for i in menu_items}
        assert cats == EXPECTED_CATEGORIES, f"Unexpected categories: {cats}"
        # No _id leakage
        for it in menu_items:
            assert "_id" not in it
            assert "id" in it and isinstance(it["id"], str)

    def test_menu_item_schema(self, menu_items):
        sample = menu_items[0]
        for k in ["id", "name_de", "name_en", "description_de", "description_en",
                  "ingredients", "price", "category", "image_url", "available", "featured"]:
            assert k in sample, f"Missing field: {k}"
        assert isinstance(sample["price"], (int, float))
        assert isinstance(sample["ingredients"], list)

    def test_get_single_item(self, session, menu_items):
        item_id = menu_items[0]["id"]
        r = session.get(f"{API}/menu/{item_id}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == item_id
        assert "_id" not in r.json()

    def test_get_single_item_404(self, session):
        r = session.get(f"{API}/menu/{uuid.uuid4()}", timeout=15)
        assert r.status_code == 404

    def test_create_update_delete_item(self, session):
        payload = {
            "name_de": "TEST_Item_DE",
            "name_en": "TEST_Item_EN",
            "description_de": "Test desc DE",
            "description_en": "Test desc EN",
            "ingredients": ["test"],
            "price": 9.99,
            "category": "beef",
            "image_url": "https://example.com/x.jpg",
            "available": True,
            "featured": False,
        }
        r = session.post(f"{API}/menu", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["name_de"] == payload["name_de"]
        assert created["price"] == 9.99
        item_id = created["id"]

        # GET verification
        r = session.get(f"{API}/menu/{item_id}", timeout=15)
        assert r.status_code == 200

        # UPDATE
        payload["price"] = 12.50
        payload["name_de"] = "TEST_Item_DE_Updated"
        r = session.put(f"{API}/menu/{item_id}", json=payload, timeout=15)
        assert r.status_code == 200
        updated = r.json()
        assert updated["price"] == 12.50
        assert updated["name_de"] == "TEST_Item_DE_Updated"

        # GET to verify persisted
        r = session.get(f"{API}/menu/{item_id}", timeout=15)
        assert r.json()["price"] == 12.50

        # DELETE
        r = session.delete(f"{API}/menu/{item_id}", timeout=15)
        assert r.status_code == 200
        assert r.json().get("success") is True

        # Verify gone
        r = session.get(f"{API}/menu/{item_id}", timeout=15)
        assert r.status_code == 404

    def test_update_nonexistent_404(self, session):
        payload = {
            "name_de": "x", "name_en": "x", "description_de": "x", "description_en": "x",
            "ingredients": [], "price": 1.0, "category": "beef", "image_url": "https://x.com/a.jpg",
        }
        r = session.put(f"{API}/menu/{uuid.uuid4()}", json=payload, timeout=15)
        assert r.status_code == 404

    def test_delete_nonexistent_404(self, session):
        r = session.delete(f"{API}/menu/{uuid.uuid4()}", timeout=15)
        assert r.status_code == 404


# ---------- ORDERS ----------
class TestOrders:
    def _build_order(self, menu_items, order_type="delivery", payment_method="cash", qty=1, item_idx=0):
        item = menu_items[item_idx]
        return {
            "items": [{
                "menu_item_id": item["id"],
                "name": item["name_de"],
                "price": item["price"],
                "quantity": qty,
                "extras": [],
            }],
            "order_type": order_type,
            "customer_name": "TEST_Customer",
            "customer_phone": "+4900000000",
            "customer_email": "test@example.com",
            "delivery_address": "Teststr. 1, Munich",
            "notes": "Test order",
            "payment_method": payment_method,
            "origin_url": "https://example.com",
        }

    def test_create_order_delivery_small_subtotal_has_fee(self, session, menu_items):
        # find an item with price < 25
        item = next(i for i in menu_items if i["price"] < 25)
        idx = menu_items.index(item)
        payload = self._build_order(menu_items, "delivery", "cash", qty=1, item_idx=idx)
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        assert "_id" not in order
        assert order["subtotal"] == round(item["price"], 2)
        assert order["delivery_fee"] == 2.50
        assert order["total"] == round(item["price"] + 2.50, 2)
        assert order["payment_status"] == "pending"
        assert order["order_status"] == "received"
        # GET verify
        r = session.get(f"{API}/orders/{order['id']}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == order["id"]

    def test_create_order_pickup_no_fee(self, session, menu_items):
        payload = self._build_order(menu_items, "pickup", "cash", qty=1, item_idx=0)
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200
        order = r.json()
        assert order["delivery_fee"] == 0.0
        assert order["total"] == order["subtotal"]

    def test_create_order_delivery_large_subtotal_no_fee(self, session, menu_items):
        # Build order > 25 EUR
        item = next(i for i in menu_items if i["price"] >= 10.0)
        idx = menu_items.index(item)
        payload = self._build_order(menu_items, "delivery", "cash", qty=3, item_idx=idx)
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200
        order = r.json()
        assert order["subtotal"] >= 25
        assert order["delivery_fee"] == 0.0

    def test_create_order_contactless_small_has_fee(self, session, menu_items):
        item = next(i for i in menu_items if i["price"] < 25)
        idx = menu_items.index(item)
        payload = self._build_order(menu_items, "contactless", "cash", qty=1, item_idx=idx)
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200
        assert r.json()["delivery_fee"] == 2.50

    def test_create_order_price_manipulation_rejected(self, session, menu_items):
        """Price manipulation: client sends wrong price, server should use DB price."""
        item = menu_items[0]
        payload = {
            "items": [{
                "menu_item_id": item["id"],
                "name": "Manipulated",
                "price": 0.01,  # try to cheat
                "quantity": 1,
                "extras": [],
            }],
            "order_type": "pickup",
            "customer_name": "TEST_Manipulator",
            "customer_phone": "0",
            "payment_method": "cash",
            "origin_url": "https://example.com",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200
        order = r.json()
        # Price should match DB, not the manipulated 0.01
        assert order["items"][0]["price"] == item["price"]
        assert order["subtotal"] == round(item["price"], 2)

    def test_create_order_invalid_menu_item_id(self, session):
        payload = {
            "items": [{
                "menu_item_id": str(uuid.uuid4()),
                "name": "Nope",
                "price": 5.0,
                "quantity": 1,
                "extras": [],
            }],
            "order_type": "pickup",
            "customer_name": "TEST",
            "customer_phone": "0",
            "payment_method": "cash",
            "origin_url": "https://example.com",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 400
        assert "not found" in r.text.lower()

    def test_create_order_stripe_returns_session_id(self, session, menu_items):
        payload = self._build_order(menu_items, "pickup", "stripe", qty=1, item_idx=0)
        r = session.post(f"{API}/orders", json=payload, timeout=45)
        if r.status_code != 200:
            pytest.skip(f"Stripe checkout failed (test mode), status={r.status_code}, body={r.text[:200]}")
        order = r.json()
        assert order.get("stripe_session_id"), "stripe_session_id missing"
        assert isinstance(order["stripe_session_id"], str)
        # Save for status test
        TestOrders._stripe_session_id = order["stripe_session_id"]
        TestOrders._stripe_order_id = order["id"]

    def test_get_orders_sorted_desc(self, session):
        r = session.get(f"{API}/orders", timeout=20)
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        assert len(orders) > 0
        for o in orders:
            assert "_id" not in o
        # Check sorted by created_at desc
        if len(orders) >= 2:
            assert orders[0]["created_at"] >= orders[-1]["created_at"]

    def test_get_single_order_404(self, session):
        r = session.get(f"{API}/orders/{uuid.uuid4()}", timeout=15)
        assert r.status_code == 404

    def test_update_order_status(self, session, menu_items):
        # create
        payload = self._build_order(menu_items, "pickup", "cash", qty=1, item_idx=0)
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200
        oid = r.json()["id"]
        # update status
        r = session.put(f"{API}/orders/{oid}/status", params={"status": "preparing"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "preparing"
        # verify persisted
        r = session.get(f"{API}/orders/{oid}", timeout=15)
        assert r.json()["order_status"] == "preparing"

    def test_update_order_invalid_status(self, session, menu_items):
        payload = self._build_order(menu_items, "pickup", "cash", qty=1, item_idx=0)
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        oid = r.json()["id"]
        r = session.put(f"{API}/orders/{oid}/status", params={"status": "bogus"}, timeout=15)
        assert r.status_code == 400

    def test_update_order_status_404(self, session):
        r = session.put(f"{API}/orders/{uuid.uuid4()}/status", params={"status": "preparing"}, timeout=15)
        assert r.status_code == 404


# ---------- PAYMENTS ----------
class TestPayments:
    def test_checkout_session_for_existing_order(self, session, menu_items):
        # Create cash order first
        item = menu_items[0]
        payload = {
            "items": [{"menu_item_id": item["id"], "name": item["name_de"],
                       "price": item["price"], "quantity": 1, "extras": []}],
            "order_type": "pickup",
            "customer_name": "TEST_Pay",
            "customer_phone": "0",
            "payment_method": "cash",
            "origin_url": "https://example.com",
        }
        r = session.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200
        order_id = r.json()["id"]

        # Create checkout session
        r = session.post(f"{API}/payments/checkout/session",
                         json={"order_id": order_id, "origin_url": "https://example.com"},
                         timeout=45)
        if r.status_code != 200:
            pytest.skip(f"Stripe failed: {r.status_code} {r.text[:200]}")
        data = r.json()
        assert "url" in data and "session_id" in data
        assert data["url"].startswith("http")
        TestPayments._sid = data["session_id"]

    def test_checkout_session_order_not_found(self, session):
        r = session.post(f"{API}/payments/checkout/session",
                         json={"order_id": str(uuid.uuid4()), "origin_url": "https://example.com"},
                         timeout=20)
        assert r.status_code == 404

    def test_checkout_status_lookup(self, session):
        sid = getattr(TestPayments, "_sid", None)
        if not sid:
            pytest.skip("No stripe session id available")
        r = session.get(f"{API}/payments/checkout/status/{sid}", timeout=30)
        if r.status_code != 200:
            pytest.skip(f"Stripe status failed: {r.status_code} {r.text[:200]}")
        d = r.json()
        for k in ["status", "payment_status", "amount_total", "currency"]:
            assert k in d

    def test_webhook_endpoint_accepts_post(self, session):
        # signature will fail, but endpoint must respond gracefully (200 with error)
        r = session.post(f"{API}/webhook/stripe", data=b"{}",
                         headers={"Stripe-Signature": "t=0,v1=bad", "Content-Type": "application/json"},
                         timeout=15)
        # Endpoint returns 200 with {"received": False, "error": ...} on bad signature
        assert r.status_code == 200
        d = r.json()
        assert "received" in d
