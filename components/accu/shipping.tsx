"use client";
import type {
  ApiData,
  SavedAddress,
  SavedPackage,
  ShipmentData,
} from "@/lib/types";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Globe2,
  Truck,
  Package,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Mail,
  Clock,
  Plane,
  Ship,
} from "lucide-react";
import { api, Heading, Form, Field, Select, object } from "./ui";
export function Shipping() {
  const params = useSearchParams();
  const [kind, setKind] = useState(
    params.get("type") === "international" ? "international" : "domestic",
  );
  const [rows, setRows] = useState([0]),
    [next, setNext] = useState(1),
    [submitted, setSubmitted] = useState(""),
    [saved, setSaved] = useState<ApiData | null>(null);
  useEffect(() => {
    api("account")
      .then(setSaved)
      .catch(() => {});
  }, []);
  function fillAddress(field: string, id: string) {
    const a = saved?.addresses.find((a: SavedAddress) => a.id === id);
    if (a) {
      const input = document.querySelector<HTMLTextAreaElement>(
        `textarea[name="${field}"]`,
      );
      if (input)
        input.value = [
          a.data.name,
          a.data.street,
          a.data.city,
          a.data.province,
          a.data.postalCode,
          a.data.phone,
        ].join(", ");
    }
  }
  return (
    <section className="section shipping-page">
      <Heading eyebrow="LET’S GET IT MOVING" title="Where are we taking it?">
        A few details now. The right shipping solution next.
      </Heading>
      {submitted ? (
        <div className="empty">
          <CheckCircle2 size={45} />
          <h2>Request received.</h2>
          <p>
            Your reference is <strong>{submitted}</strong>. View your quote in
            your account. Routes with approved rates are priced automatically;
            other requests are reviewed by our team.
          </p>
          <Link href="/account" className="button dark">
            View my account
          </Link>
        </div>
      ) : (
        <div className="two-column shipping-layout">
          <div>
            <div className="segmented">
              <button
                className={kind === "domestic" ? "selected" : ""}
                onClick={() => setKind("domestic")}
              >
                <Truck size={18} /> South Africa
              </button>
              <button
                className={kind === "international" ? "selected" : ""}
                onClick={() => setKind("international")}
              >
                <Globe2 size={18} /> International
              </button>
            </div>
            <Form
              submit="Request my shipping quote"
              onSubmit={async (d) => {
                const parcels = rows.map((id) => ({
                  description: d.get(`description${id}`),
                  quantity: Number(d.get(`quantity${id}`)),
                  length: Number(d.get(`length${id}`)),
                  width: Number(d.get(`width${id}`)),
                  height: Number(d.get(`height${id}`)),
                  weight: Number(d.get(`weight${id}`)),
                }));
                const result = await api("quotes", {
                  email: d.get("email"),
                  kind,
                  origin: d.get("origin"),
                  destination: d.get("destination"),
                  originPostalCode: d.get("originPostalCode") || "",
                  destinationPostalCode: d.get("destinationPostalCode") || "",
                  pickupDate: d.get("pickupDate"),
                  parcels,
                  instructions: d.get("instructions") || "",
                  service: d.get("service"),
                  declaredValue: Number(d.get("declaredValue") || 0),
                  dangerousGoods: d.get("dangerousGoods") === "on",
                  acceptTerms: d.get("terms") === "on",
                });
                setSubmitted(result.reference);
                return result;
              }}
            >
              <div className="form-step">
                <span>01</span>
                <h2>The route</h2>
              </div>
              <div className="form-grid">
                {[
                  ["origin", "Collection address", params.get("from") || ""],
                  ["destination", "Delivery address", params.get("to") || ""],
                ].map(([name, label, value]) => (
                  <div key={name}>
                    {saved && saved.addresses.length > 0 && (
                      <label className="field">
                        <span>Use a saved address</span>
                        <select
                          onChange={(e) => fillAddress(name, e.target.value)}
                          defaultValue=""
                        >
                          <option value="">Choose an address</option>
                          {saved.addresses.map((a: SavedAddress) => (
                            <option key={a.id} value={a.id}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="field">
                      <span>{label}</span>
                      <textarea
                        name={name}
                        required
                        minLength={5}
                        placeholder={
                          "Contact name, phone, street, suburb, " +
                          (kind === "international"
                            ? "country, ZIP / postal code"
                            : "province and postal code")
                        }
                        defaultValue={value}
                      />
                    </label>
                  </div>
                ))}
                <Field label="Collection postal code" name="originPostalCode" />
                <Field
                  label="Delivery postal code"
                  name="destinationPostalCode"
                />
                <Field
                  label="Your email address"
                  name="email"
                  type="email"
                  defaultValue={saved?.user.email}
                />
                <Field
                  label="Preferred collection date"
                  name="pickupDate"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="form-step">
                <span>02</span>
                <h2>The parcels</h2>
              </div>
              <p className="muted">
                Measure your packed parcel in centimetres and kilograms. Add a
                separate row for each different parcel size.
              </p>
              {rows.map((id, index) => (
                <div className="parcel-card" key={id}>
                  <div className="parcel-title">
                    <strong>Parcel {index + 1}</strong>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={"Remove parcel " + (index + 1)}
                        onClick={() => setRows(rows.filter((x) => x !== id))}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                  {saved && saved.packages.length > 0 && (
                    <label className="field">
                      <span>Use saved package</span>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const p = saved.packages.find(
                            (p: SavedPackage) => p.id === e.target.value,
                          );
                          if (p)
                            for (const [k, v] of Object.entries(p.data)) {
                              const el =
                                document.querySelector<HTMLInputElement>(
                                  `input[name="${k}${id}"]`,
                                );
                              if (el) el.value = String(v);
                            }
                        }}
                      >
                        <option value="">Choose package</option>
                        {saved.packages.map((p: SavedPackage) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="form-grid">
                    <Field
                      label="Contents"
                      name={"description" + id}
                      placeholder="What’s inside?"
                    />
                    <Field
                      label="Number of identical parcels"
                      name={"quantity" + id}
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={1}
                    />
                  </div>
                  <div className="parcel-dimensions">
                    {["length", "width", "height", "weight"].map((k) => (
                      <Field
                        key={k}
                        label={
                          k[0].toUpperCase() +
                          k.slice(1) +
                          (k === "weight" ? " (kg)" : " (cm)")
                        }
                        name={k + id}
                        type="number"
                        min={0.01}
                        step="0.01"
                      />
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="button outline"
                disabled={rows.length >= 30}
                onClick={() => {
                  setRows([...rows, next]);
                  setNext(next + 1);
                }}
              >
                <Plus size={17} /> Add another parcel
              </button>
              <div className="form-step">
                <span>03</span>
                <h2>Service & special requirements</h2>
              </div>
              <div className="form-grid">
                <Select
                  label="Service preference"
                  name="service"
                  options={
                    kind === "international"
                      ? ["Express", "Air freight", "Sea freight"]
                      : ["Economy", "Express"]
                  }
                />
                <Field
                  label="Declared goods value (ZAR)"
                  name="declaredValue"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={0}
                />
              </div>
              <label className="field">
                <span>Anything else we should know?</span>
                <textarea
                  name="instructions"
                  placeholder="Business / residential addresses, after-hours collection, Saturday delivery, loading requirements, customs / HS codes or Incoterms…"
                />
              </label>
              <label className="checkbox">
                <input type="checkbox" name="dangerousGoods" />
                <span>
                  This shipment contains goods that may need dangerous-goods
                  assessment.
                </span>
              </label>
              <label className="checkbox">
                <input type="checkbox" name="terms" required />
                <span>
                  I confirm the shipment details are accurate and accept the{" "}
                  <Link href="/policies">published terms & conditions</Link>.
                </span>
              </label>
            </Form>
          </div>
          <aside>
            <div className="summary-card navy-card">
              <Package size={32} />
              <h2>
                A quote that fits
                <br />
                your shipment.
              </h2>
              <p>
                Your route, parcel size, weight and service requirements help us
                find the right solution.
              </p>
              <hr />
              <p>
                <strong>No payment at this step.</strong>
                <br />
                We’ll confirm the price before you book.
              </p>
            </div>
            <div className="help-card">
              <h3>Need a little help?</h3>
              <p>
                Oversized cargo, international customs or a complex delivery?
              </p>
              <Link href="/contact" className="text-link">
                Talk to our team <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
export function Tracking() {
  const params = useSearchParams();
  const [data, setData] = useState<ShipmentData | null>(null);
  return (
    <section className="section tracking-page">
      <div className="tracking-heading">
        <p className="eyebrow">FOLLOW THE JOURNEY</p>
        <h1>
          Your parcel.
          <br />
          <em>One step closer.</em>
        </h1>
        <p className="lead">
          Enter your waybill number to see the latest recorded shipment update.
        </p>
      </div>
      <div className="tracking-box">
        <Form
          submit="Track shipment"
          onSubmit={async (d) => {
            setData(null);
            const r = await api(
              "tracking?waybill=" +
                encodeURIComponent(String(d.get("waybill"))),
            );
            setData(r.shipment);
            return { message: "Latest shipment status loaded." };
          }}
        >
          <Field
            label="Waybill number"
            name="waybill"
            placeholder="Enter your waybill number"
            defaultValue={params.get("waybill") || ""}
          />
        </Form>
        {data && (
          <div className="tracking-result">
            <p className="eyebrow">{data.waybill}</p>
            <h2>{data.status.replaceAll("_", " ")}</h2>
            <div className="timeline">
              {data.events.map(
                (e: ShipmentData["events"][number], i: number) => (
                  <div key={i}>
                    <CheckCircle2 size={22} />
                    <div>
                      <strong>{e.status.replaceAll("_", " ")}</strong>
                      <p>{e.location}</p>
                      <time>
                        {new Date(e.date).toLocaleString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                        })}
                      </time>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
        <p className="muted">
          Can’t find your waybill?{" "}
          <Link href="/contact">We’re here to help.</Link>
        </p>
      </div>
    </section>
  );
}
export function Contact() {
  return (
    <section className="section">
      <Heading
        eyebrow="REAL PEOPLE. READY TO HELP."
        title="Let’s talk logistics."
      >
        Tell us what you need to move. We’ll help with the next step.
      </Heading>
      <div className="two-column">
        <div>
          <div className="contact-detail">
            <Mail />
            <div>
              <h3>Email our team</h3>
              <a href="mailto:support@accuaircargo.co.za">
                support@accuaircargo.co.za
              </a>
            </div>
          </div>
          <div className="contact-detail">
            <Clock />
            <div>
              <h3>Office hours</h3>
              <p>
                Monday – Friday · 07:30 – 17:00
                <br />
                Weekends on request
                <br />
                South African Standard Time
              </p>
            </div>
          </div>
          <div className="contact-detail">
            <Globe2 />
            <div>
              <h3>Local roots. Global reach.</h3>
              <p>
                Door-to-door courier, imports, exports
                <br />
                and customs clearance.
              </p>
            </div>
          </div>
          <Link href="/ship?type=international" className="button outline">
            Request an international quote
          </Link>
        </div>
        <Form
          className="panel"
          submit="Send my message"
          onSubmit={(d) => api("contact", object(d))}
        >
          <div className="form-grid">
            <Field label="Your name" name="name" />
            <Field label="Email address" name="email" type="email" />
          </div>
          <Field label="Phone number" name="phone" type="tel" />
          <label className="field">
            <span>How can we help?</span>
            <textarea name="message" required minLength={10} rows={5} />
          </label>
          <p className="muted">
            We’ll use these details to respond to your enquiry.{" "}
            <Link href="/policies">Privacy information</Link>
          </p>
        </Form>
      </div>
    </section>
  );
}
export function Services() {
  return (
    <section className="section">
      <Heading
        eyebrow="ACCU AIR CARGO SERVICES"
        title="Connected, from door to door."
      >
        Courier, freight and packaging solutions for your next move.
      </Heading>
      <div className="service-grid">
        {[
          {
            Icon: Truck,
            title: "Local & national courier",
            text: "Door-to-door deliveries across South Africa. Request a quote with your collection and delivery addresses, parcel sizes and preferred service.",
          },
          {
            Icon: Plane,
            title: "Air freight",
            text: "For shipments moving internationally by air. Share your goods description, dimensions, gross weight and destination for a tailored quote.",
          },
          {
            Icon: Ship,
            title: "Imports & exports",
            text: "International freight and customs clearance support. Include your commercial value, HS codes where available and Incoterms with your enquiry.",
          },
        ].map(({ Icon, title, text }) => (
          <div className="service-card" key={title}>
            <Icon size={35} />
            <h2>{title}</h2>
            <p>{text}</p>
            <Link href="/ship" className="text-link">
              Request a quote <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
      <div className="support-banner">
        <div>
          <h2>Get the packaging right.</h2>
          <p>
            Protect your shipment with the right materials before collection.
          </p>
        </div>
        <Link href="/shop" className="button dark">
          Shop packaging
        </Link>
      </div>
    </section>
  );
}
export function FAQ() {
  return (
    <section className="section narrow">
      <Heading
        eyebrow="A LITTLE HELP ALONG THE WAY"
        title="Shipping, made clearer."
      />
      {[
        [
          "How do I request a shipping quote?",
          "Choose Send a parcel and enter your collection and delivery addresses, parcel dimensions, weight and service preference. The team reviews your request before confirming a price.",
        ],
        [
          "Can I send an international shipment?",
          "Yes. Choose International in the quote form. Include a goods description, commercial value, destination country and any customs or special handling information.",
        ],
        [
          "Where is my waybill number?",
          "Find it on your booking or shipment documentation. Enter it on the tracking page to see the latest recorded update. Contact support if you cannot locate it.",
        ],
        [
          "How do I measure my parcel?",
          "Measure the outside of the fully packed parcel: length, width and height in centimetres. Weigh it in kilograms, including all packaging.",
        ],
        [
          "What if my shipment is more than 250 kg?",
          "Request a tailored quote. Include the number of pieces and any loading requirements. The original booking flow directs parcels above 250 kg to the team.",
        ],
        [
          "Can I return packaging materials?",
          "Contact the team with your order reference and reason before returning any goods. Sign in to request a return for a paid order. Eligibility is subject to review and the published terms.",
        ],
      ].map(([q, a]) => (
        <details className="faq" key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <Link href="/contact" className="button dark">
        Ask our team
      </Link>
    </section>
  );
}
export function Policies() {
  const links = [
    ["Terms & conditions", "2025/07/ACCU-AIR-CARGO-Terms-Conditions.pdf"],
    ["PAIA manual", "2025/05/PAIA-Manual.pdf"],
    ["Cookie policy", "2025/05/Cookie-Policy.pdf"],
    ["POPIA policy", "2025/05/POPIA-Policy.pdf"],
  ];
  return (
    <section className="section narrow">
      <Heading
        eyebrow="CLEAR TERMS. INFORMED DECISIONS."
        title="Policies & information."
      >
        Read the documents published by Accu Air Cargo.
      </Heading>
      {links.map(([name, url]) => (
        <a
          className="policy-link"
          href={"https://accuaircargo.co.za/wp-content/uploads/" + url}
          target="_blank"
          rel="noopener noreferrer"
          key={url}
        >
          <span>{name}</span>
          <span>View PDF ↗</span>
        </a>
      ))}
      <p className="muted">
        These links open the company’s existing published policies. Shipment
        handling, liability and acceptance are governed by the applicable
        company terms.
      </p>
    </section>
  );
}
