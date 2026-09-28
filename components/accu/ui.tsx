"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import type { ApiData } from "@/lib/types";
import { z } from "zod";
import {
  LoaderCircle,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
export async function api(path: string, data?: unknown, method?: string) {
  const res = await fetch("/api/" + path, {
    method: method || (data ? "POST" : "GET"),
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as ApiData;
  if (!res.ok) throw Error(json.error || "Unable to complete this request.");
  return json;
}
export function pay(input: unknown) {
  const data = z
    .object({
      payment: z.object({
        action: z.enum([
          "https://sandbox.payfast.co.za/eng/process",
          "https://www.payfast.co.za/eng/process",
        ]),
        fields: z.record(z.string()),
      }),
    })
    .parse(input);
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.payment.action;
  Object.entries(data.payment.fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
export function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
  placeholder,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  min?: number | string;
  max?: number;
  step?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}
export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
export function Notice({
  error,
  children,
}: {
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={"notice " + (error ? "error" : "")}
      role={error ? "alert" : "status"}
    >
      {error ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
      <span>{children}</span>
    </div>
  );
}
export function Form({
  children,
  onSubmit,
  submit = "Continue",
  className = "",
  onSuccess,
}: {
  children: ReactNode;
  onSubmit: (d: FormData) => Promise<{ message?: string }>;
  submit?: string;
  className?: string;
  onSuccess?: (data: { message?: string }) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await onSubmit(new FormData(e.currentTarget));
      setMessage(r?.message || "Saved successfully.");
      onSuccess?.(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className={"form " + className} onSubmit={send}>
      {children}
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <button className="button" disabled={busy} type="submit">
        {busy ? <LoaderCircle className="spin" size={18} /> : null}
        {busy ? "Please wait…" : submit}
        {!busy && <ArrowUpRight size={18} />}
      </button>
    </form>
  );
}
export const object = (d: FormData) => Object.fromEntries(d.entries());
export function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}
