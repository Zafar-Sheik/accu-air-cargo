import { createHash, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http";
import { cents } from "../commerce";
export const encode = (s: string) =>
  encodeURIComponent(s.trim())
    .replace(/%20/g, "+")
    .replace(
      /[!'()*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    );
export function signature(entries: [string, string][], passphrase: string) {
  let s = entries
    .filter(([k, v]) => k !== "signature" && v !== "")
    .map(([k, v]) => `${k}=${encode(v)}`)
    .join("&");
  if (passphrase) s += `&passphrase=${encode(passphrase)}`;
  return createHash("md5").update(s).digest("hex");
}
export function paymentForm(order: {
  id: string;
  reference: string;
  total: number;
  email: string;
}) {
  const {
    PAYFAST_MERCHANT_ID: id,
    PAYFAST_MERCHANT_KEY: key,
    PAYFAST_PASSPHRASE: pass,
    APP_URL: url,
  } = process.env;
  if (!id || !key || !pass || !url)
    throw new HttpError(
      503,
      "Online payments are not enabled yet. Please contact support.",
    );
  const fields: Record<string, string> = {
    merchant_id: id,
    merchant_key: key,
    return_url: `${url}/payment/success`,
    cancel_url: `${url}/payment/cancel`,
    notify_url: `${url}/api/payfast/notify`,
    email_address: order.email,
    m_payment_id: order.id,
    amount: (order.total / 100).toFixed(2),
    item_name: order.reference,
  };
  fields.signature = signature(Object.entries(fields), pass);
  return {
    action:
      process.env.PAYFAST_MODE === "live"
        ? "https://www.payfast.co.za/eng/process"
        : "https://sandbox.payfast.co.za/eng/process",
    fields,
  };
}
export async function verifyITN(raw: string, expected: number) {
  const params = new URLSearchParams(raw);
  const entries = [...params.entries()];
  if (new Set(entries.map((x) => x[0])).size !== entries.length)
    throw new HttpError(400, "Duplicate fields");
  const fields = Object.fromEntries(entries);
  const pass = process.env.PAYFAST_PASSPHRASE;
  if (!pass || !process.env.PAYFAST_MERCHANT_ID)
    throw new HttpError(503, "Payment verification unavailable");
  const sig = signature(entries, pass);
  if (
    !fields.signature ||
    fields.signature.length !== sig.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(fields.signature))
  )
    throw new HttpError(400, "Invalid signature");
  if (
    fields.merchant_id !== process.env.PAYFAST_MERCHANT_ID ||
    cents(fields.amount_gross) !== expected
  )
    throw new HttpError(400, "Payment details mismatch");
  const url =
    process.env.PAYFAST_MODE === "live"
      ? "https://www.payfast.co.za/eng/query/validate"
      : "https://sandbox.payfast.co.za/eng/query/validate";
  const validation = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: entries
      .filter(([k]) => k !== "signature")
      .map(([k, v]) => `${k}=${encode(v)}`)
      .join("&"),
    signal: AbortSignal.timeout(15000),
  });
  if (!validation.ok || (await validation.text()).trim() !== "VALID")
    throw new HttpError(400, "Payment not validated");
  return fields;
}
