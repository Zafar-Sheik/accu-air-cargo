"use client";
import type {
  ApiData,
  OrderData,
  QuoteData,
  UserSummary,
  ReturnData,
  CouponData,
  EnquiryData,
} from "@/lib/types";
import type { CatalogProduct } from "@/lib/catalogue";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShippingRates } from "./rates";
import { ImageUpload } from "./upload";
import {
  Package,
  ShoppingBag,
  Users,
  FileText,
  Settings,
  Tag,
  MessagesSquare,
  RotateCcw,
  Activity,
  Plus,
} from "lucide-react";
import { api, Heading, Form, Field, Select, Notice } from "./ui";
import { money } from "@/lib/commerce";
export function Admin() {
  const [data, setData] = useState<ApiData | null>(null),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Overview"),
    [page, setPage] = useState(0),
    [edit, setEdit] = useState<Partial<CatalogProduct & CouponData> | null>(
      null,
    ),
    [search, setSearch] = useState("");
  const load = () =>
    api("admin?page=" + page)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    api("admin?page=" + page)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page]);
  async function save(path: string, payload: unknown, method?: string) {
    const r = await api("admin/" + path, payload, method);
    await load();
    setEdit(null);
    return r;
  }
  if (!data)
    return (
      <section className="section narrow">
        <Heading eyebrow="OPERATIONS" title="Administration" />
        {error ? (
          <>
            <Notice error>{error}</Notice>
            <Link href="/login" className="button dark">
              Administrator sign in
            </Link>
          </>
        ) : (
          <p>Loading administration…</p>
        )}
      </section>
    );
  const menus = [
    ["Overview", Activity],
    ["Products", Package],
    ["Orders", ShoppingBag],
    ["Quotes", FileText],
    ["Customers", Users],
    ["Enquiries", MessagesSquare],
    ["Returns", RotateCcw],
    ["Promotions", Tag],
    ["Shipping rates", Settings],
    ["Settings", Settings],
    ["Audit log", Activity],
  ] as const;
  const commerce =
    data.settings.find((s: ApiData["settings"][number]) => s.key === "commerce")
      ?.value || {};
  const rows = <T,>(list: T[]) =>
    list.filter((x) =>
      JSON.stringify(x).toLowerCase().includes(search.toLowerCase()),
    );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="eyebrow">OPERATIONS DESK</p>
        {menus.map(([name, Icon]) => (
          <button
            className={tab === name ? "selected" : ""}
            key={name}
            onClick={() => {
              setTab(name);
              setEdit(null);
              setSearch("");
            }}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
        <Link href="/account">Back to my account ↗</Link>
      </aside>
      <section className="admin-main">
        <div className="section-heading">
          <Heading eyebrow="ACCU AIR CARGO" title={tab} />
          {tab === "Products" && (
            <button className="button" onClick={() => setEdit({})}>
              <Plus size={18} /> New product
            </button>
          )}
        </div>
        {error && <Notice error>{error}</Notice>}
        {tab === "Overview" && (
          <>
            <div className="metric-grid">
              <div>
                <span>Verified paid revenue</span>
                <strong>{money(data.metrics.paidRevenue)}</strong>
                <p>All-time · excludes unpaid orders</p>
              </div>
              <div>
                <span>Paid orders</span>
                <strong>{data.metrics.paidOrders}</strong>
                <p>Verified notifications only</p>
              </div>
              <div>
                <span>Checkout</span>
                <strong>
                  {commerce.checkoutEnabled ? "Enabled" : "Disabled"}
                </strong>
                <p>Configure under Settings</p>
              </div>
            </div>
            <div className="panel">
              <h2>Keep operations moving.</h2>
              <p>
                Manage packaging stock, review courier requests and update paid
                shipments from the menu.
              </p>
              <p>
                Carrier tracking is managed here. An external carrier API has
                not been connected. Refunds must be completed in the payment
                provider’s dashboard before recording the review outcome.
              </p>
            </div>
          </>
        )}
        {!["Overview", "Settings"].includes(tab) && (
          <input
            className="admin-search"
            aria-label="Search current page"
            placeholder="Search this page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        {tab === "Products" &&
          (edit ? (
            <ProductEditor
              value={edit}
              onSave={(d) => save("products", d)}
              onCancel={() => setEdit(null)}
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Variants / stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows(data.products).map((p: CatalogProduct) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        {p.variants
                          .filter(
                            (v: CatalogProduct["variants"][number]) => v.active,
                          )
                          .map((v: CatalogProduct["variants"][number]) => (
                            <div key={v.id}>
                              {v.name}: {v.stock} · {money(v.price)}
                            </div>
                          ))}
                      </td>
                      <td>{p.active ? "Active" : "Archived"}</td>
                      <td>
                        <button
                          className="text-link"
                          onClick={() => setEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-link danger"
                          onClick={async () => {
                            if (
                              confirm(
                                "Archive this product? Historical orders will be retained.",
                              )
                            )
                              try {
                                await save("products", { id: p.id }, "DELETE");
                              } catch (e) {
                                setError((e as Error).message);
                              }
                          }}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        {tab === "Orders" &&
          rows(data.orders).map((o: OrderData) => (
            <details className="admin-record" key={o.id}>
              <summary>
                <strong>{o.reference}</strong>
                <span>{o.email}</span>
                <span>
                  {money(o.total)} · {o.paymentStatus}
                </span>
              </summary>
              <p>
                Fulfilment: {o.fulfillmentStatus} · Order: {o.status}
              </p>
              <pre>
                {JSON.stringify(
                  { address: o.address, items: o.items },
                  null,
                  2,
                )}
              </pre>
              <Form
                submit="Update shipment"
                onSubmit={(d) =>
                  save("orders", {
                    id: o.id,
                    status: d.get("status"),
                    waybill: d.get("waybill"),
                    location: d.get("location"),
                  })
                }
              >
                <div className="form-grid">
                  <Select
                    label="Status"
                    name="status"
                    options={["PROCESSING", "DISPATCHED", "DELIVERED"]}
                  />
                  <Field
                    label="Waybill"
                    name="waybill"
                    defaultValue={o.shipment?.waybill}
                  />
                  <Field label="Event location" name="location" />
                </div>
              </Form>
            </details>
          ))}
        {tab === "Quotes" &&
          rows(data.quotes).map((q: QuoteData) => (
            <details className="admin-record" key={q.id}>
              <summary>
                <strong>{q.reference}</strong>
                <span>{q.email}</span>
                <span>{q.status}</span>
              </summary>
              <pre>{JSON.stringify(q.data, null, 2)}</pre>
              <Form
                submit="Issue quote"
                onSubmit={(d) =>
                  save("quotes", {
                    id: q.id,
                    amount: Math.round(Number(d.get("amount")) * 100),
                    validDays: Number(d.get("validDays")),
                  })
                }
              >
                <div className="form-grid">
                  <Field
                    label="Total quote amount (ZAR, all applicable charges included)"
                    name="amount"
                    type="number"
                    min={0.01}
                    step="0.01"
                    defaultValue={q.amount ? q.amount / 100 : undefined}
                  />
                  <Field
                    label="Valid for (days)"
                    name="validDays"
                    type="number"
                    min={1}
                    max={30}
                    defaultValue={7}
                  />
                </div>
              </Form>
            </details>
          ))}
        {tab === "Customers" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {rows(data.users).map((u: UserSummary) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.verified ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "Enquiries" &&
          rows(data.enquiries).map((e: EnquiryData) => (
            <details className="admin-record" key={e.id}>
              <summary>
                <strong>{e.name}</strong>
                <span>{e.email}</span>
                <span>{e.status}</span>
              </summary>
              <p>{e.phone}</p>
              <p>{e.message}</p>
              <Form
                submit="Update enquiry"
                onSubmit={(d) =>
                  save("enquiries", { id: e.id, status: d.get("status") })
                }
              >
                <Select
                  label="Status"
                  name="status"
                  options={["NEW", "IN_PROGRESS", "RESOLVED"]}
                  defaultValue={e.status}
                />
              </Form>
            </details>
          ))}
        {tab === "Returns" &&
          rows(data.returns).map((r: ReturnData) => (
            <details className="admin-record" key={r.id}>
              <summary>
                <strong>{r.orderId}</strong>
                <span>{r.status}</span>
              </summary>
              <p>{r.reason}</p>
              <Form
                submit="Record review outcome"
                onSubmit={(d) =>
                  save("returns", { id: r.id, status: d.get("status") })
                }
              >
                <Select
                  label="Review status"
                  name="status"
                  options={[
                    "REQUESTED",
                    "APPROVED",
                    "DECLINED",
                    "REFUNDED_EXTERNALLY",
                  ]}
                  defaultValue={r.status}
                />
                <p className="muted">
                  This action does not issue a gateway refund or restore stock.
                  Verify the external refund and inspect any returned goods
                  first.
                </p>
              </Form>
            </details>
          ))}
        {tab === "Promotions" && (
          <div className="two-column">
            <div>
              {data.coupons.map((c: CouponData) => (
                <div className="saved-card" key={c.code}>
                  <h3>{c.code}</h3>
                  <p>
                    {c.percent}% · {c.active ? "Active" : "Disabled"}
                  </p>
                  <button className="button outline" onClick={() => setEdit(c)}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
            <Form
              key={edit?.code || "coupon"}
              className="panel"
              submit="Save promotion"
              onSubmit={(d) =>
                save("coupons", {
                  code: String(d.get("code")).toUpperCase(),
                  percent: Number(d.get("percent")),
                  active: d.get("active") === "on",
                })
              }
            >
              <Field label="Code" name="code" defaultValue={edit?.code} />
              <Field
                label="Discount percentage"
                name="percent"
                type="number"
                min={1}
                max={100}
                defaultValue={edit?.percent}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={edit?.active ?? true}
                />{" "}
                Active
              </label>
            </Form>
          </div>
        )}
        {tab === "Shipping rates" && (
          <ShippingRates
            rules={data.shippingRules}
            onSave={(d) => save("shipping-rules", d)}
          />
        )}
        {tab === "Settings" && (
          <Form
            className="panel narrow"
            submit="Save store settings"
            onSubmit={(d) =>
              save("settings", {
                shipping: Math.round(Number(d.get("shipping")) * 100),
                checkoutEnabled: d.get("checkoutEnabled") === "on",
                supportEmail: d.get("supportEmail"),
              })
            }
          >
            <h2>Packaging checkout</h2>
            <p>
              Enable only after stock, prices, VAT treatment, delivery rules and
              the payment sandbox have been verified. A flat delivery fee is
              used for packaging orders within South Africa.
            </p>
            <Field
              label="Packaging delivery fee (ZAR)"
              name="shipping"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                commerce.shipping !== undefined
                  ? commerce.shipping / 100
                  : undefined
              }
            />
            <Field
              label="Support email"
              name="supportEmail"
              type="email"
              defaultValue={
                commerce.supportEmail || "support@accuaircargo.co.za"
              }
            />
            <label className="checkbox">
              <input
                type="checkbox"
                name="checkoutEnabled"
                defaultChecked={commerce.checkoutEnabled}
              />{" "}
              Enable packaging checkout
            </label>
          </Form>
        )}
        {tab === "Audit log" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {rows(data.audits).map((a: ApiData["audits"][number]) => (
                  <tr key={a.id}>
                    <td>{new Date(a.createdAt).toLocaleString("en-ZA")}</td>
                    <td>{a.action}</td>
                    <td>{a.actor}</td>
                    <td>{a.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!["Overview", "Settings"].includes(tab) && (
          <div className="pagination">
            <button disabled={!page} onClick={() => setPage(page - 1)}>
              Previous 50
            </button>
            <span>Page {page + 1}</span>
            <button onClick={() => setPage(page + 1)}>Next 50</button>
          </div>
        )}
      </section>
    </div>
  );
}
function ProductEditor({
  value: v,
  onSave,
  onCancel,
}: {
  value: Partial<CatalogProduct>;
  onSave: (d: unknown) => Promise<{ message?: string }>;
  onCancel: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(v.image || "/images/");
  const [variants, setVariants] = useState<
    Partial<CatalogProduct["variants"][number]>[]
  >(
    v.variants || [
      { sku: "", name: "Standard", price: 0, stock: 0, active: true },
    ],
  );
  return (
    <Form
      className="panel"
      submit="Save product"
      onSubmit={(d) =>
        onSave({
          id: v.id,
          name: d.get("name"),
          slug: d.get("slug"),
          description: d.get("description"),
          category: d.get("category"),
          image: d.get("image"),
          active: d.get("active") === "on",
          variants: variants.map((v, i) => ({
            id: v.id,
            sku: d.get("sku" + i),
            name: d.get("variantName" + i),
            price: Math.round(Number(d.get("price" + i)) * 100),
            stock: Number(d.get("stock" + i)),
            active: d.get("variantActive" + i) === "on",
          })),
        })
      }
    >
      <div className="section-heading">
        <h2>{v.id ? "Edit product" : "New product"}</h2>
        <button type="button" className="text-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="form-grid">
        <Field label="Name" name="name" defaultValue={v.name} />
        <Field label="URL slug" name="slug" defaultValue={v.slug} />
        <Field label="Category" name="category" defaultValue={v.category} />
        <Field
          key={imageUrl}
          label="Product image URL"
          name="image"
          defaultValue={imageUrl}
        />
      </div>
      <label className="field">
        <span>Description</span>
        <textarea name="description" required defaultValue={v.description} />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="active"
          defaultChecked={v.active ?? true}
        />{" "}
        Visible in the shop
      </label>
      <ImageUpload onUploaded={setImageUrl} />
      <h3>Variants & inventory</h3>
      {variants.map((variant, i) => (
        <div className="parcel-card" key={variant.id || i}>
          <div className="form-grid">
            <Field label="SKU" name={"sku" + i} defaultValue={variant.sku} />
            <Field
              label="Option name"
              name={"variantName" + i}
              defaultValue={variant.name}
            />
            <Field
              label="Price (ZAR)"
              name={"price" + i}
              type="number"
              min={0.01}
              step="0.01"
              defaultValue={(variant.price ?? 0) / 100}
            />
            <Field
              label="Available stock"
              name={"stock" + i}
              type="number"
              min={0}
              defaultValue={variant.stock}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              name={"variantActive" + i}
              defaultChecked={variant.active}
            />{" "}
            Variant active
          </label>
        </div>
      ))}
      <button
        className="button outline"
        type="button"
        onClick={() =>
          setVariants([
            ...variants,
            { name: "", price: 0, stock: 0, active: true },
          ])
        }
      >
        <Plus size={16} /> Add variant
      </button>
    </Form>
  );
}
