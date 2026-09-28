"use client";
import { useState } from "react";
import type { ShippingRate } from "@/lib/shipping-rates";
import { Form, Field } from "./ui";
import { money } from "@/lib/commerce";
export function ShippingRates({
  rules,
  onSave,
}: {
  rules: ShippingRate[];
  onSave: (d: unknown) => Promise<{ message?: string }>;
}) {
  const [edit, setEdit] = useState<ShippingRate | null>(null);
  return (
    <div className="two-column">
      <div>
        {rules.map((r) => (
          <div className="saved-card" key={r.id}>
            <h3>{r.name}</h3>
            <p>
              Postal codes {r.originPrefix}… → {r.destinationPrefix}…
            </p>
            <p>
              {money(r.basePrice)} base · {r.active ? "Enabled" : "Disabled"}
            </p>
            <button className="button outline" onClick={() => setEdit(r)}>
              Edit rate
            </button>
          </div>
        ))}
        <p className="muted">
          Rates are applied on the server. The most specific matching
          postal-code pair wins. International, hazardous, oversized and
          special-instruction shipments require manual review. Configure only
          merchant-approved rate cards.
        </p>
      </div>
      <Form
        key={edit?.id || "new"}
        className="panel"
        submit="Save shipping rule"
        onSubmit={async (d) => {
          const payload: Record<string, string | number | boolean | undefined> =
            {
              id: edit?.id,
              name: String(d.get("name")),
              originPrefix: String(d.get("originPrefix")),
              destinationPrefix: String(d.get("destinationPrefix")),
              active: d.get("active") === "on",
            };
          for (const k of [
            "basePrice",
            "includedGrams",
            "maximumGrams",
            "perKg",
            "divisor",
            "fuelBps",
            "taxBps",
            "surcharge",
          ])
            payload[k] = Number(d.get(k));
          const result = await onSave(payload);
          setEdit(null);
          return result;
        }}
      >
        <h2>{edit ? "Edit shipping rule" : "New shipping rule"}</h2>
        <Field label="Rule name" name="name" defaultValue={edit?.name} />
        <div className="form-grid">
          <Field
            label="Origin postal prefix (1–4 digits)"
            name="originPrefix"
            defaultValue={edit?.originPrefix}
          />
          <Field
            label="Destination postal prefix (1–4 digits)"
            name="destinationPrefix"
            defaultValue={edit?.destinationPrefix}
          />
          <Field
            label="Base price (cents)"
            name="basePrice"
            type="number"
            min={1}
            defaultValue={edit?.basePrice}
          />
          <Field
            label="Included weight (grams)"
            name="includedGrams"
            type="number"
            min={0}
            defaultValue={edit?.includedGrams}
          />
          <Field
            label="Maximum weight (grams)"
            name="maximumGrams"
            type="number"
            min={1}
            max={250000}
            defaultValue={edit?.maximumGrams}
          />
          <Field
            label="Extra cost per kg (cents)"
            name="perKg"
            type="number"
            min={0}
            defaultValue={edit?.perKg}
          />
          <Field
            label="Volumetric divisor"
            name="divisor"
            type="number"
            min={1000}
            defaultValue={edit?.divisor ?? 5000}
          />
          <Field
            label="Fuel percentage × 100"
            name="fuelBps"
            type="number"
            min={0}
            defaultValue={edit?.fuelBps ?? 0}
          />
          <Field
            label="Tax percentage × 100"
            name="taxBps"
            type="number"
            min={0}
            defaultValue={edit?.taxBps ?? 0}
          />
          <Field
            label="Fixed surcharge (cents)"
            name="surcharge"
            type="number"
            min={0}
            defaultValue={edit?.surcharge ?? 0}
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            name="active"
            defaultChecked={edit?.active ?? false}
          />{" "}
          Activate this verified rule
        </label>
        <p className="muted">
          Prices use cents: R100 = 10000. Percentages use basis points: 10% =
          1000. Tax defaults to zero and must be confirmed with the merchant.
        </p>
        {edit && (
          <button
            type="button"
            className="text-link"
            onClick={() => setEdit(null)}
          >
            Cancel editing
          </button>
        )}
      </Form>
    </div>
  );
}
