"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ShoppingBag, Menu, X, ArrowUpRight, Plane, Mail } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, useGSAP);
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-copy > *", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            y: 26,
            opacity: 0,
            duration: 0.65,
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          }),
        );
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [path] },
  );
  return (
    <div ref={ref}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="topbar">
        <span>FROM YOUR DOOR. TO THEIR WORLD.</span>
        <a href="mailto:support@accuaircargo.co.za">
          <Mail size={13} /> support@accuaircargo.co.za
        </a>
        <span className="top-right">
          South Africa <span className="flag">ZA</span>
        </span>
      </div>
      <header className="header">
        <Link href="/" aria-label="Accu Air Cargo home" className="brand">
          <span className="brand-icon">
            <Plane size={27} />
          </span>
          <span>
            ACCU AIR<span className="brand-small">C A R G O</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className={open ? "nav open" : "nav"}
          onClick={() => setOpen(false)}
        >
          <Link className={path === "/ship" ? "active" : ""} href="/ship">
            Send a parcel
          </Link>
          <Link className={path === "/track" ? "active" : ""} href="/track">
            Track shipment
          </Link>
          <Link
            className={path.startsWith("/shop") ? "active" : ""}
            href="/shop"
          >
            Packaging shop
          </Link>
          <Link href="/services">Our services</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="header-actions">
          <Link
            href="/cart"
            aria-label="Shopping basket"
            className="icon-button"
          >
            <ShoppingBag size={20} />
          </Link>
          <Link href="/account" className="account-link">
            My account <ArrowUpRight size={15} />
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="menu-button icon-button"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer>
        <div className="footer-top">
          <Link href="/" className="brand">
            <span className="brand-icon">
              <Plane />
            </span>
            <span>
              ACCU AIR<span className="brand-small">C A R G O</span>
            </span>
          </Link>
          <h2>
            A small parcel.
            <br />A world of possibility.
          </h2>
          <Link href="/ship" className="button">
            Let’s get it moving <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="footer-grid">
          <div>
            <p>
              Local connections.
              <br />
              International possibilities.
            </p>
            <a href="mailto:support@accuaircargo.co.za">
              support@accuaircargo.co.za
            </a>
          </div>
          <div>
            <strong>MOVE WITH US</strong>
            <Link href="/ship">Send a parcel</Link>
            <Link href="/track">Track a shipment</Link>
            <Link href="/services">Freight services</Link>
          </div>
          <div>
            <strong>PACK & PREPARE</strong>
            <Link href="/shop">Packaging shop</Link>
            <Link href="/faq">Shipping help</Link>
            <Link href="/contact">Contact our team</Link>
          </div>
          <div>
            <strong>YOUR ACCOUNT</strong>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Create an account</Link>
            <Link href="/account">Orders & shipments</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Accu Air Cargo</span>
          <div>
            <Link href="/policies">Terms & conditions</Link>
            <Link href="/policies">Privacy & PAIA</Link>
          </div>
          <span>Made to move.</span>
        </div>
      </footer>
    </div>
  );
}
