"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Package,
  Truck,
  ShieldCheck,
  Navigation,
  Plane,
  MoveRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { catalogue } from "@/lib/catalogue";
import { money } from "@/lib/commerce";
export function Home() {
  const [tab, setTab] = useState("quote");
  const router = useRouter();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow light">
            <span className="eyebrow-line" /> YOUR NEXT DELIVERY STARTS HERE
          </p>
          <h1>
            Big on care.
            <br />
            Built to <em>deliver.</em>
          </h1>
          <p className="hero-description">
            Across the city or across the world. We connect your parcels to the
            people who matter.
          </p>
          <div className="hero-cta">
            <Link href="/ship" className="button">
              Send a parcel <ArrowUpRight size={19} />
            </Link>
            <Link href="/services" className="text-link light">
              Explore our services <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-detail">
            <ShieldCheck size={22} />
            <span>
              Door-to-door courier & freight
              <br />
              <strong>Local. National. International.</strong>
            </span>
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="/images/hero.png"
            alt="Accu Air Cargo branded courier and freight illustration"
            fill
            sizes="(max-width: 640px) 90vw, 48vw"
            priority
          />
          <div className="image-label">
            <span>EVERY PARCEL HAS A PURPOSE.</span>
            <ArrowUpRight size={28} />
          </div>
        </div>
        <div className="hero-index">
          <span>01 / CONNECTING YOUR WORLD</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>
      <section className="quick-section">
        <div className="quick-card">
          <div className="quick-tabs">
            <button
              className={tab === "quote" ? "selected" : ""}
              onClick={() => setTab("quote")}
            >
              <Package size={19} /> Get a shipping quote
            </button>
            <button
              className={tab === "track" ? "selected" : ""}
              onClick={() => setTab("track")}
            >
              <Navigation size={19} /> Track your parcel
            </button>
          </div>
          {tab === "quote" ? (
            <form
              className="quick-form"
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                router.push(
                  `/ship?from=${encodeURIComponent(String(d.get("from")))}&to=${encodeURIComponent(String(d.get("to")))}`,
                );
              }}
            >
              <label>
                <span>COLLECT FROM</span>
                <div>
                  <MapPin size={18} />
                  <input
                    name="from"
                    required
                    placeholder="City or suburb"
                    aria-label="Collection city or suburb"
                  />
                </div>
              </label>
              <MoveRight className="route-arrow" size={24} />
              <label>
                <span>DELIVER TO</span>
                <div>
                  <MapPin size={18} />
                  <input
                    name="to"
                    required
                    placeholder="City or suburb"
                    aria-label="Delivery city or suburb"
                  />
                </div>
              </label>
              <button className="button dark">
                Build my quote <ArrowUpRight size={18} />
              </button>
            </form>
          ) : (
            <form className="quick-form tracking-quick" action="/track">
              <label>
                <span>YOUR WAYBILL NUMBER</span>
                <input
                  name="waybill"
                  required
                  placeholder="Enter your shipment reference"
                  aria-label="Waybill number"
                />
              </label>
              <button className="button dark">
                Track parcel <ArrowUpRight size={18} />
              </button>
            </form>
          )}
        </div>
        <div className="quick-note">
          <ShieldCheck size={17} />
          <span>From collection to delivery, we’re with you.</span>
          <Link href="/contact">
            Need a hand? Talk to us <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <section className="section services-section" data-reveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">ONE PARTNER. EVERY JOURNEY.</p>
            <h2>
              However it needs to move,
              <br />
              we’ll find the way.
            </h2>
          </div>
          <Link className="text-link" href="/services">
            Discover our services <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="service-grid">
          {[
            {
              Icon: Truck,
              n: "01",
              title: "Local & national courier",
              text: "From important documents to everyday parcels. Door-to-door delivery across South Africa.",
              link: "/ship",
              tag: "ACROSS SOUTH AFRICA",
            },
            {
              Icon: Plane,
              n: "02",
              title: "International freight",
              text: "Imports, exports and customs clearance. Bring your next destination within reach.",
              link: "/ship?type=international",
              tag: "BEYOND BORDERS",
            },
            {
              Icon: Package,
              n: "03",
              title: "Packaging that protects",
              text: "Wrap it. Seal it. Send it. Find the supplies you need to prepare your parcel.",
              link: "/shop",
              tag: "READY FOR THE JOURNEY",
            },
          ].map(({ Icon, n, title, text, link, tag }) => (
            <Link href={link} className="service-card" key={n}>
              <div className="service-top">
                <Icon size={32} strokeWidth={1.4} />
                <span>{n}</span>
              </div>
              <p className="micro">{tag}</p>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="circle-link">
                <ArrowUpRight size={20} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="how-section" data-reveal>
        <div>
          <p className="eyebrow light">LESS ADMIN. MORE MOMENTUM.</p>
          <h2>
            Your next delivery,
            <br />
            simplified.
          </h2>
          <Link href="/ship" className="text-link light">
            Start your shipment <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "Tell us what’s moving",
              "Add your collection address, destination and parcel details.",
            ],
            [
              "02",
              "Confirm your quote",
              "Review the service and price before you book and pay.",
            ],
            [
              "03",
              "We take it from here",
              "Prepare your parcel for collection and follow its journey.",
            ],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section" data-reveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">GOOD DELIVERIES START WITH GOOD PACKAGING</p>
            <h2>Pack with confidence.</h2>
          </div>
          <Link href="/shop" className="text-link">
            Shop all packaging <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {[catalogue[1], catalogue[3], catalogue[6], catalogue[19]].map(
            (p) => (
              <Link
                href={"/shop/" + p.slug}
                className="product-card"
                key={p.id}
              >
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
            ),
          )}
        </div>
        <p className="catalogue-note">
          Published catalogue prices. Availability and current pricing are
          confirmed at checkout.
        </p>
      </section>
      <section className="support-banner" data-reveal>
        <div>
          <p className="eyebrow">SOMETHING A LITTLE MORE COMPLEX?</p>
          <h2>
            Big shipment. Specific requirements.
            <br />
            Let’s talk logistics.
          </h2>
        </div>
        <Link href="/contact" className="button dark">
          Talk to our team <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
