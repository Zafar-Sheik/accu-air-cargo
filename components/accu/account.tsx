"use client";
import type {
  ApiData,
  OrderData,
  QuoteData,
  SavedAddress,
  SavedPackage,
} from "@/lib/types";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, LogOut, ArrowUpRight, Trash2, Download } from "lucide-react";
import { api, Heading, Form, Field, Select, Notice, object, pay } from "./ui";
import { money, provinces } from "@/lib/commerce";
export function Auth({ mode }: { mode: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const register = mode === "register";
  const title = register
    ? "A smoother way to ship."
    : mode === "forgot"
      ? "Let’s get you back in."
      : mode === "reset"
        ? "Choose a new password."
        : mode === "verify"
          ? "Verify your email."
          : "Welcome back.";
  return (
    <section className="auth-page">
      <div className="auth-art">
        <p className="eyebrow light">YOUR WORLD, CONNECTED.</p>
        <h2>
          One account.
          <br />
          Every journey.
        </h2>
        <Image
          src="/images/hero.png"
          alt="Accu Air Cargo freight services"
          width={1536}
          height={1024}
          sizes="50vw"
        />
        <div>
          <Package size={25} />
          <p>
            Manage your orders, save your addresses
            <br />
            and keep your shipments moving.
          </p>
        </div>
      </div>
      <div className="auth-form">
        <Heading eyebrow="ACCU AIR CARGO" title={title} />
        <Form
          submit={
            register
              ? "Create my account"
              : mode === "login"
                ? "Sign in"
                : mode === "verify"
                  ? "Verify email"
                  : "Continue"
          }
          onSubmit={async (d) => {
            const result = await api("auth/" + mode, {
              ...object(d),
              token: params.get("token") || undefined,
            });
            if (mode === "login")
              router.push(result.role === "ADMIN" ? "/admin" : "/account");
            return result;
          }}
        >
          {register && <Field label="Full name" name="name" />}
          {!["reset", "verify"].includes(mode) && (
            <Field label="Email address" name="email" type="email" />
          )}
          {["register", "login", "reset"].includes(mode) && (
            <Field label="Password" name="password" type="password" />
          )}
          {register && (
            <>
              <p className="muted">
                Use at least 12 characters. We’ll send a link to verify your
                email.
              </p>
              <label className="checkbox">
                <input required type="checkbox" />
                <span>
                  I accept the{" "}
                  <Link href="/policies">terms & privacy policy</Link>.
                </span>
              </label>
            </>
          )}
          {mode === "login" && (
            <Link className="text-link" href="/forgot">
              Forgot your password?
            </Link>
          )}
          {mode === "verify" && (
            <p>
              Confirm your email address using the link from your verification
              email.
            </p>
          )}
        </Form>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New to Accu Air Cargo?"}{" "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}{" "}
            <ArrowUpRight size={14} />
          </Link>
        </p>
      </div>
    </section>
  );
}
export function Account() {
  const [data, setData] = useState<ApiData | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Orders"),
    [editing, setEditing] = useState<(SavedAddress | SavedPackage) | null>(
      null,
    );
  const router = useRouter();
  const load = () =>
    api("account")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const [notice, setNotice] = useState("");
  async function action(fn: () => Promise<unknown>) {
    try {
      await fn();
      await load();
      setNotice("Your changes have been saved.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const addressEdit =
    editing && "street" in editing.data ? editing.data : undefined;
  const parcelEdit =
    editing && "weight" in editing.data ? editing.data : undefined;
  if (!data)
    return (
      <section className="section narrow">
        <Heading eyebrow="YOUR ACCOUNT" title="Everything in one place." />
        {error ? (
          <>
            <Notice error>{error}</Notice>
            <Link href="/login" className="button dark">
              Sign in to your account
            </Link>
          </>
        ) : (
          <p>Loading your account…</p>
        )}
      </section>
    );
  return (
    <section className="section">
      <div className="section-heading">
        <Heading
          eyebrow="YOUR SHIPPING DESK"
          title={"Hello, " + data.user.name.split(" ")[0] + "."}
        />
        <button
          className="button outline"
          onClick={() =>
            action(async () => {
              await api("auth/logout", {});
              router.push("/login");
            })
          }
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
      <div className="category-pills">
        {["Orders", "Quotes", "Addresses", "Packages", "Profile"].map((t) => (
          <button
            className={t === tab ? "selected" : ""}
            key={t}
            onClick={() => {
              setTab(t);
              setEditing(null);
            }}
          >
            {t}
          </button>
        ))}
        {data.user.role === "ADMIN" && (
          <Link className="button dark" href="/admin">
            Administration
          </Link>
        )}
      </div>
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {tab === "Orders" && (
        <>
          {!data.orders.length ? (
            <Empty
              title="No orders yet."
              text="Your packaging orders and confirmed courier bookings will appear here."
            />
          ) : (
            data.orders.map((o: OrderData) => (
              <div className="order-card" key={o.id}>
                <div className="order-top">
                  <div>
                    <p className="micro">
                      {new Date(o.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                    <h3>{o.reference}</h3>
                  </div>
                  <span className="status">
                    {o.paymentStatus} · {o.fulfillmentStatus}
                  </span>
                  <strong>{money(o.total)}</strong>
                </div>
                {o.items.map((i: OrderData["items"][number], n: number) => (
                  <p key={n}>
                    {i.quantity} × {i.name} {i.variant && " · " + i.variant}
                  </p>
                ))}
                <div className="button-row">
                  <Link className="button outline" href={"/orders/" + o.id}>
                    View order
                  </Link>
                  {o.shipment && (
                    <Link
                      className="button outline"
                      href={
                        "/track?waybill=" +
                        encodeURIComponent(o.shipment.waybill)
                      }
                    >
                      Track shipment
                    </Link>
                  )}
                  {o.paymentStatus === "PENDING" &&
                    !o.stockReleased &&
                    new Date(o.expiresAt) > new Date() && (
                      <button
                        className="button dark"
                        onClick={() =>
                          action(async () =>
                            pay(await api("orders/" + o.id + "/pay", {})),
                          )
                        }
                      >
                        Continue payment
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
        </>
      )}
      {tab === "Quotes" && (
        <>
          {!data.quotes.length ? (
            <Empty
              title="No quotes yet."
              text="Tell us where your shipment is going and request a quote."
            />
          ) : (
            data.quotes.map((q: QuoteData) => (
              <div className="order-card" key={q.id}>
                <div className="order-top">
                  <h3>{q.reference}</h3>
                  <span className="status">{q.status}</span>
                  <strong>
                    {q.amount ? money(q.amount) : "Awaiting review"}
                  </strong>
                </div>
                <p>
                  {q.data.origin} → {q.data.destination}
                </p>
                {q.expiresAt && (
                  <p>
                    Valid until{" "}
                    {new Date(q.expiresAt).toLocaleDateString("en-ZA")}
                  </p>
                )}
                {q.status === "QUOTED" && (
                  <button
                    className="button dark"
                    onClick={() =>
                      action(async () =>
                        pay(await api("quotes/" + q.id + "/pay", {})),
                      )
                    }
                  >
                    Accept quote & pay
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}
      {(tab === "Addresses" || tab === "Packages") && (
        <div className="two-column">
          <div>
            {(tab === "Addresses" ? data.addresses : data.packages).map(
              (item: SavedAddress | SavedPackage) => (
                <div className="saved-card" key={item.id}>
                  <h3>{item.label}</h3>
                  <p>{Object.values(item.data).join(" · ")}</p>
                  <div className="button-row">
                    <button
                      className="button outline"
                      onClick={() => setEditing(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Delete " + item.label}
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this saved " +
                              tab.toLowerCase().slice(0, -1) +
                              "?",
                          )
                        )
                          action(() =>
                            api(
                              tab.toLowerCase() + "/" + item.id,
                              {},
                              "DELETE",
                            ),
                          );
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
          <Form
            key={editing?.id || tab}
            className="panel"
            submit={
              editing
                ? "Save changes"
                : "Save " + tab.toLowerCase().slice(0, -1)
            }
            onSubmit={async (d) => {
              const obj = object(d);
              const label = obj.label;
              delete obj.label;
              const result = await api(
                tab.toLowerCase() + (editing ? "/" + editing.id : ""),
                { label, data: obj },
              );
              setEditing(null);
              await load();
              return result;
            }}
          >
            <h2>
              {editing ? "Edit" : "Add"} {tab.toLowerCase().slice(0, -1)}
            </h2>
            <Field label="Label" name="label" defaultValue={editing?.label} />
            {tab === "Addresses" ? (
              <>
                <Field
                  label="Contact name"
                  name="name"
                  defaultValue={addressEdit?.name}
                />
                <Field
                  label="Mobile number"
                  name="phone"
                  defaultValue={addressEdit?.phone}
                />
                <Field
                  label="Street address"
                  name="street"
                  defaultValue={addressEdit?.street}
                />
                <div className="form-grid">
                  <Field
                    label="City"
                    name="city"
                    defaultValue={addressEdit?.city}
                  />
                  <Select
                    label="Province"
                    name="province"
                    options={provinces}
                    defaultValue={addressEdit?.province}
                  />
                  <Field
                    label="Postal code"
                    name="postalCode"
                    defaultValue={addressEdit?.postalCode}
                  />
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Contents description"
                  name="description"
                  defaultValue={parcelEdit?.description}
                />
                <div className="form-grid">
                  {["quantity", "length", "width", "height", "weight"].map(
                    (k) => (
                      <Field
                        key={k}
                        label={
                          k +
                          (k === "weight"
                            ? " (kg)"
                            : ["length", "width", "height"].includes(k)
                              ? " (cm)"
                              : "")
                        }
                        name={k}
                        type="number"
                        step={k === "quantity" ? "1" : "0.01"}
                        min={0.01}
                        defaultValue={
                          parcelEdit?.[k as keyof typeof parcelEdit] ||
                          (k === "quantity" ? 1 : undefined)
                        }
                      />
                    ),
                  )}
                </div>
              </>
            )}
            {editing && (
              <button
                type="button"
                className="text-link"
                onClick={() => setEditing(null)}
              >
                Cancel editing
              </button>
            )}
          </Form>
        </div>
      )}
      {tab === "Profile" && (
        <Form
          className="panel narrow"
          submit="Save profile"
          onSubmit={async (d) => {
            const r = await api("account", object(d));
            await load();
            return r;
          }}
        >
          <Field label="Your name" name="name" defaultValue={data.user.name} />
          <p>{data.user.email}</p>
          <Link href="/forgot" className="text-link">
            Reset your password
          </Link>
        </Form>
      )}
    </section>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Package size={38} />
      <h2>{title}</h2>
      <p>{text}</p>
      <div className="button-row">
        <Link href="/ship" className="button dark">
          Send a parcel
        </Link>
        <Link href="/shop" className="button outline">
          Shop packaging
        </Link>
      </div>
    </div>
  );
}
export function OrderDetail({ id }: { id: string }) {
  const [o, setOrder] = useState<OrderData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("orders/" + id)
      .then((r) => setOrder(r.order))
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <section className="section narrow">
      <Heading eyebrow="ORDER DETAILS" title={o?.reference || "Your order"} />
      {error && <Notice error>{error}</Notice>}
      {o && (
        <>
          <div className="panel receipt">
            <div className="receipt-brand">ACCU AIR CARGO</div>
            <p>
              {o.paymentStatus === "PAID"
                ? "Payment verified"
                : "Payment not yet verified"}{" "}
              · {new Date(o.createdAt).toLocaleDateString("en-ZA")}
            </p>
            <h2>{o.reference}</h2>
            <p>{o.email}</p>
            {o.address.street && (
              <p>
                {o.address.name}
                <br />
                {o.address.street}
                <br />
                {o.address.city} {o.address.postalCode}
              </p>
            )}
            {o.items.map((i: OrderData["items"][number], n: number) => (
              <div className="summary-line" key={n}>
                <span>
                  {i.quantity} × {i.name}
                </span>
                <strong>{money(i.price * i.quantity)}</strong>
              </div>
            ))}
            <hr />
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{money(o.subtotal)}</span>
            </div>
            <div className="summary-line">
              <span>Discount</span>
              <span>−{money(o.discount)}</span>
            </div>
            <div className="summary-line">
              <span>Delivery</span>
              <span>{money(o.shipping)}</span>
            </div>
            <div className="summary-line">
              <strong>Total</strong>
              <strong>{money(o.total)}</strong>
            </div>
            <p className="muted">
              Order confirmation · This is not a tax invoice.
            </p>
          </div>
          <button
            className="button outline print-button"
            onClick={() => window.print()}
          >
            <Download size={17} /> Print / save order
          </button>
          {o.paymentStatus === "PAID" && (
            <Form
              className="panel"
              submit="Request a return"
              onSubmit={(d) =>
                api("orders/" + id + "/return", { reason: d.get("reason") })
              }
            >
              <h2>Need to request a return?</h2>
              <p>
                We’ll review your request before providing return instructions.
              </p>
              <label className="field">
                <span>Reason for return</span>
                <textarea required minLength={10} name="reason" />
              </label>
            </Form>
          )}
        </>
      )}
    </section>
  );
}
