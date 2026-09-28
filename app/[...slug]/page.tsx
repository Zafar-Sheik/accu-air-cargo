import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shop, Cart, Checkout } from "@/components/accu/shop";
import {
  Shipping,
  Tracking,
  Contact,
  Services,
  FAQ,
  Policies,
} from "@/components/accu/shipping";
import { Auth, Account, OrderDetail } from "@/components/accu/account";
import { Admin } from "@/components/accu/admin";
import { catalogue } from "@/lib/catalogue";
import { db, configured } from "@/lib/server/db";
export const dynamic = "force-dynamic";
const titles: Record<string, string> = {
  shop: "Packaging Shop",
  ship: "Request a Shipping Quote",
  track: "Track Your Parcel",
  contact: "Contact Us",
  services: "Courier & Freight Services",
  faq: "Shipping Help",
  policies: "Policies",
  cart: "Your Basket",
  checkout: "Checkout",
  account: "Your Account",
  admin: "Administration",
  login: "Sign In",
  register: "Create an Account",
  forgot: "Reset Password",
  reset: "New Password",
  verify: "Verify Email",
  orders: "Order Details",
  payment: "Payment Status",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const s = (await params).slug || [];
  const product =
    s[0] === "shop" && s[1]
      ? catalogue.find((p) => p.slug === s[1])
      : undefined;
  return {
    title: product?.name || titles[s[0]] || "Page not found",
    description:
      product?.description ||
      "Accu Air Cargo courier services and packaging supplies.",
    robots: [
      "account",
      "admin",
      "login",
      "register",
      "forgot",
      "reset",
      "verify",
      "orders",
      "payment",
      "cart",
      "checkout",
    ].includes(s[0])
      ? { index: false, follow: false }
      : undefined,
    alternates: { canonical: "/" + s.join("/") },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const s = (await params).slug || [];
  let view: React.ReactNode;
  switch (s[0]) {
    case "shop": {
      let products = catalogue;
      if (configured())
        try {
          products = await db.product.findMany({
            where: { active: true },
            include: { variants: { where: { active: true } } },
            take: 500,
          });
        } catch {}
      if (s[1] && !products.some((p) => p.slug === s[1])) notFound();
      view = <Shop initialProducts={products} slug={s[1]} />;
      break;
    }
    case "cart":
      view = <Cart />;
      break;
    case "checkout":
      view = <Checkout />;
      break;
    case "ship":
      view = <Shipping />;
      break;
    case "track":
      view = <Tracking />;
      break;
    case "contact":
      view = <Contact />;
      break;
    case "services":
      view = <Services />;
      break;
    case "faq":
      view = <FAQ />;
      break;
    case "policies":
      view = <Policies />;
      break;
    case "account":
      view = <Account />;
      break;
    case "admin":
      view = <Admin />;
      break;
    case "login":
    case "register":
    case "forgot":
    case "reset":
    case "verify":
      view = <Auth mode={s[0]} />;
      break;
    case "orders":
      if (!s[1]) notFound();
      view = <OrderDetail id={s[1]} />;
      break;
    case "payment":
      view = (
        <section className="section narrow">
          <p className="eyebrow">PAYMENT STATUS</p>
          <h1>
            {s[1] === "cancel"
              ? "Payment cancelled."
              : "Thank you. We’re checking your payment."}
          </h1>
          <p className="lead">
            {s[1] === "cancel"
              ? "No successful payment is assumed. If your reservation is still active, you can retry from your account."
              : "Your order is confirmed only after Payfast sends a verified payment notification. You will receive confirmation by email."}
          </p>
          <Link href="/account" className="button dark">
            View my orders
          </Link>
          <Link href="/contact" className="text-link">
            Need help with a guest order?
          </Link>
        </section>
      );
      break;
    default:
      notFound();
  }
  return (
    <Suspense fallback={<div className="section">Loading…</div>}>
      {view}
    </Suspense>
  );
}
