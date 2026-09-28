import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/accu/shell";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Accu Air Cargo | Courier, Freight & Packaging",
    template: "%s | Accu Air Cargo",
  },
  description:
    "Door-to-door courier services, international freight and packaging supplies. Request a shipment quote, track a parcel and prepare your next delivery.",
  icons: { icon: "/favicon.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
