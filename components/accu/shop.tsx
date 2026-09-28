"use client";
import type { ApiData, CartLine } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Search,
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Trash2,
} from "lucide-react";
import { CatalogProduct, catalogue } from "@/lib/catalogue";
import { money, provinces } from "@/lib/commerce";
import { api, Heading, Notice, Form, Field, Select, pay } from "./ui";
export function Shop({
  initialProducts = catalogue,
  slug,
}: {
  initialProducts?: CatalogProduct[];
  slug?: string;
}) {
  const [products, setProducts] = useState(initialProducts),
    [connected, setConnected] = useState(false),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All packaging"),
    [sort, setSort] = useState("Featured"),
    [page, setPage] = useState(1);
  useEffect(() => {
    api("products")
      .then((d) => {
        setProducts(d.products);
        setConnected(d.source === "database");
      })
      .catch(() => {});
  }, []);
  const p = slug ? products.find((p) => p.slug === slug) : null;
  if (slug)
    return p ? (
      <Product product={p} connected={connected} />
    ) : (
      <section className="section">
        <Heading eyebrow="PACKAGING" title="Product unavailable" />
        <Link href="/shop">Return to the shop</Link>
      </section>
    );
  const filtered = products
    .filter(
      (p) =>
        (category === "All packaging" || p.category === category) &&
        p.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Price: low to high"
        ? Math.min(...a.variants.map((v) => v.price)) -
          Math.min(...b.variants.map((v) => v.price))
        : sort === "Name: A–Z"
          ? a.name.localeCompare(b.name)
          : 0,
    );
  return (
    <section className="section shop-page">
      <Heading eyebrow="THE PACKAGING SHOP" title="Ready. Packed. Delivered.">
        The essentials for every shipment, all in one place.
      </Heading>
      <div className="shop-toolbar">
        <div className="search-field">
          <Search size={20} />
          <input
            aria-label="Search packaging"
            placeholder="Find tape, bubble wrap, mailers…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Featured</option>
          <option>Price: low to high</option>
          <option>Name: A–Z</option>
        </select>
      </div>
      <div className="category-pills">
        {["All packaging", ...new Set(products.map((p) => p.category))].map(
          (c) => (
            <button
              key={c}
              className={c === category ? "selected" : ""}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c}
            </button>
          ),
        )}
      </div>
      <div className="results-line">
        <span>
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </span>
        <span>Packaging for the journey ahead</span>
      </div>
      {!connected && (
        <p className="catalogue-note">
          Browse the published catalogue. Purchasing will become available once
          stock and checkout are activated.
        </p>
      )}
      <div className="product-grid">
        {filtered.slice((page - 1) * 12, page * 12).map((p) => (
          <Link href={"/shop/" + p.slug} className="product-card" key={p.id}>
            <div className="product-image">
              <Image
                src={p.image}
                alt={p.name}
                width={500}
                height={500}
                sizes="(max-width: 640px) 44vw, (max-width: 900px) 40vw, 22vw"
              />
              <span className="product-arrow">
                <ArrowUpRight size={19} />
              </span>
            </div>
            <p className="micro">{p.category}</p>
            <h3>{p.name}</h3>
            <span className="price">
              {p.variants.length > 1 ? "From " : ""}
              {money(Math.min(...p.variants.map((v) => v.price)))}
            </span>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <Search />
          <h2>No products found</h2>
          <p>Try a different search or category.</p>
          <button
            className="button dark"
            onClick={() => {
              setSearch("");
              setCategory("All packaging");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {filtered.length > 12 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(filtered.length / 12)}
          </span>
          <button
            disabled={page * 12 >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
function Product({
  product: p,
  connected,
}: {
  product: CatalogProduct;
  connected: boolean;
}) {
  const [index, setIndex] = useState(0),
    [quantity, setQuantity] = useState(1),
    [error, setError] = useState(""),
    [added, setAdded] = useState(false),
    [busy, setBusy] = useState(false);
  const v = p.variants[index] || p.variants[0];
  async function add() {
    setBusy(true);
    setError("");
    try {
      const cart = await api("cart");
      const existing = cart.items.find((i: CartLine) => i.variantId === v.id);
      await api("cart", {
        variantId: v.id,
        quantity: quantity + (existing?.quantity ?? 0),
      });
      setAdded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <Link href="/shop" className="text-link">
        <ArrowLeft size={16} /> Back to packaging
      </Link>
      <div className="product-detail">
        <div className="detail-image">
          <Image
            src={p.image}
            alt={p.name}
            width={500}
            height={500}
            sizes="(max-width: 640px) 88vw, 40vw"
          />
        </div>
        <div>
          <p className="eyebrow">{p.category}</p>
          <h1>{p.name}</h1>
          <p className="detail-price">{money(v.price)}</p>
          <p className="lead">{p.description}</p>
          {p.variants.length > 1 && (
            <label className="field">
              <span>Choose your option</span>
              <select
                value={index}
                onChange={(e) => {
                  setIndex(Number(e.target.value));
                  setAdded(false);
                }}
              >
                {p.variants.map((v, i) => (
                  <option value={i} key={v.id}>
                    {v.name} · {money(v.price)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="buy-row">
            <div className="quantity">
              <button
                aria-label="Reduce quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="button dark"
              disabled={!connected || v.stock < quantity || busy}
              onClick={add}
            >
              <ShoppingBag size={18} />
              {busy
                ? "Adding…"
                : !connected
                  ? "Purchasing not yet available"
                  : v.stock < quantity
                    ? "Currently unavailable"
                    : "Add to basket"}
            </button>
          </div>
          {error && <Notice error>{error}</Notice>}
          {added && (
            <Notice>
              Added to your basket. <Link href="/cart">View basket →</Link>
            </Notice>
          )}
          <p className="muted">
            {connected
              ? v.stock > 0
                ? "Available to order"
                : "Stock is being confirmed"
              : "Published price; stock has not yet been confirmed."}
          </p>
          <div className="product-benefit">
            <Truck size={20} />
            <span>Delivery costs shown before payment</span>
          </div>
          <div className="product-benefit">
            <ShieldCheck size={20} />
            <span>Secure hosted payment when checkout is enabled</span>
          </div>
          <p className="micro">SKU: {v.sku}</p>
          <details>
            <summary>Delivery & returns</summary>
            <p>
              Delivery options depend on your address and order. For a return or
              product query, contact the team before sending anything back.
            </p>
            <Link href="/policies">Read the published terms</Link>
          </details>
        </div>
      </div>
    </section>
  );
}
export function Cart() {
  const [data, setData] = useState<ApiData | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    api("cart")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  async function update(id: string, q: number) {
    setBusy(true);
    try {
      await api("cart", { variantId: id, quantity: q });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }
  return (
    <section className="section">
      <Heading eyebrow="YOUR BASKET" title="All packed up?" />
      {error && <Notice error>{error}</Notice>}
      {!data && !error && <p>Loading your basket…</p>}
      {data?.items.length === 0 && (
        <div className="empty">
          <ShoppingBag size={40} />
          <h2>Your basket is empty.</h2>
          <p>Find the right packaging for your next delivery.</p>
          <Link href="/shop" className="button">
            Explore packaging <ArrowUpRight size={18} />
          </Link>
        </div>
      )}
      {!!data?.items.length && (
        <div className="two-column">
          <div>
            {data.items.map((i: CartLine) => (
              <div className="cart-item" key={i.id}>
                <Image
                  src={i.variant.product.image}
                  alt={i.variant.product.name}
                  width={100}
                  height={110}
                />
                <div>
                  <Link href={"/shop/" + i.variant.product.slug}>
                    <h3>{i.variant.product.name}</h3>
                  </Link>
                  <p>
                    {i.variant.name} · {money(i.variant.price)}
                  </p>
                  <div className="quantity">
                    <button
                      disabled={busy}
                      aria-label="Reduce quantity"
                      onClick={() => update(i.variantId, i.quantity - 1)}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{i.quantity}</span>
                    <button
                      disabled={busy}
                      aria-label="Increase quantity"
                      onClick={() => update(i.variantId, i.quantity + 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <strong>{money(i.quantity * i.variant.price)}</strong>
                  <button
                    className="icon-button"
                    disabled={busy}
                    aria-label="Remove item"
                    onClick={() => update(i.variantId, 0)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div className="summary-line">
              <span>Subtotal</span>
              <strong>{money(data.subtotal)}</strong>
            </div>
            <p>
              Delivery and any discount will be calculated securely at checkout.
            </p>
            <Link href="/checkout" className="button dark">
              Continue to checkout <ArrowUpRight size={18} />
            </Link>
            <Link href="/shop" className="text-link">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
export function Checkout() {
  const [requestId] = useState(() => crypto.randomUUID());
  return (
    <section className="section narrow">
      <Heading eyebrow="SECURE CHECKOUT" title="The final details.">
        Your price and stock are checked again before you’re sent to Payfast.
      </Heading>
      <Form
        submit="Review & pay with Payfast"
        onSubmit={async (d) => {
          const a = Object.fromEntries(
            ["name", "phone", "street", "city", "province", "postalCode"].map(
              (k) => [k, d.get(k)],
            ),
          );
          const result = await api("checkout", {
            email: d.get("email"),
            address: a,
            coupon: d.get("coupon") || undefined,
            acceptTerms: d.get("terms") === "on",
            requestId,
          });
          pay(result);
          return { message: "Opening secure payment…" };
        }}
      >
        <h2>Contact & delivery</h2>
        <div className="form-grid">
          <Field label="Full name" name="name" />
          <Field label="Email address" name="email" type="email" />
          <Field
            label="Mobile number"
            name="phone"
            type="tel"
            placeholder="+27…"
          />
          <Field label="Street address" name="street" />
          <Field label="City / suburb" name="city" />
          <Select label="Province" name="province" options={provinces} />
          <Field label="Postal code" name="postalCode" />
          <Field label="Promotional code" name="coupon" required={false} />
        </div>
        <label className="checkbox">
          <input type="checkbox" name="terms" required />
          <span>
            I have read and accept the{" "}
            <Link href="/policies">terms & conditions</Link>.
          </span>
        </label>
        <p className="muted">
          You will review the final amount on Payfast before completing payment.
          No card details are collected on this website.
        </p>
      </Form>
    </section>
  );
}
