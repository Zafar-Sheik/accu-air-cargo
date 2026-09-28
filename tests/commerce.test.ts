import test from "node:test";
import assert from "node:assert/strict";
import { totals, cents } from "../lib/commerce";
import {
  signature,
  encode,
  verifyITN,
  paymentForm,
} from "../lib/server/payfast";
import { requireOrigin } from "../lib/server/http";
import { productInput } from "../lib/validation";
test("checkout computes totals in minor units, including rounded percentage discounts", () => {
  assert.deepEqual(
    totals(
      [
        { price: 3980, quantity: 3 },
        { price: 3250, quantity: 2 },
      ],
      15,
      8500,
    ),
    { subtotal: 18440, discount: 2766, shipping: 8500, total: 24174 },
  );
  assert.equal(totals([{ price: 101, quantity: 1 }], 50).total, 50);
});
test("invalid quantities, floating prices and discounts are rejected", () => {
  for (const q of [0, -1, 1.5, 1000])
    assert.throws(() => totals([{ price: 100, quantity: q }]));
  assert.throws(() => totals([{ price: 1.1, quantity: 1 }]));
  assert.throws(() => totals([{ price: 100, quantity: 1 }], 101));
  assert.throws(() => totals([{ price: 100, quantity: 1 }], 0, -1));
});
test("payment amount parses exact decimals only", () => {
  assert.equal(cents("123.45"), 12345);
  for (const s of ["123", "-1.00", "1.234", "1e3", "NaN"])
    assert.throws(() => cents(s));
});
test("Payfast encoding and signatures use form-style encoding and ordered fields", () => {
  assert.equal(encode(" a b! "), "a+b%21");
  assert.equal(signature([["a", "1"]], ""), "3872c9ae3f427af0be0ead09d07ae2cf");
  assert.equal(
    signature(
      [
        ["a", "1"],
        ["signature", "ignored"],
        ["empty", ""],
      ],
      "",
    ),
    signature([["a", "1"]], ""),
  );
  assert.notEqual(
    signature(
      [
        ["a", "1"],
        ["b", "2"],
      ],
      "secret",
    ),
    signature(
      [
        ["b", "2"],
        ["a", "1"],
      ],
      "secret",
    ),
  );
});
test("cookie mutations reject missing and foreign origins", () => {
  process.env.APP_URL = "https://store.example";
  assert.throws(() =>
    requireOrigin(
      new Request("https://store.example/api/cart", { method: "POST" }),
    ),
  );
  assert.throws(() =>
    requireOrigin(
      new Request("https://store.example/api/cart", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    requireOrigin(
      new Request("https://store.example/api/cart", {
        method: "POST",
        headers: { Origin: "https://store.example" },
      }),
    ),
  );
});
test("payment remains disabled without merchant credentials", () => {
  delete process.env.PAYFAST_MERCHANT_ID;
  assert.throws(() =>
    paymentForm({
      id: "order",
      reference: "AAC-1",
      total: 100,
      email: "a@example.com",
    }),
  );
});
test("forged notifications and duplicate parameters fail before provider calls", async () => {
  process.env.PAYFAST_PASSPHRASE = "test-secret";
  process.env.PAYFAST_MERCHANT_ID = "100";
  await assert.rejects(() =>
    verifyITN("merchant_id=100&amount_gross=1.00&signature=bad", 100),
  );
  await assert.rejects(() => verifyITN("merchant_id=100&merchant_id=200", 100));
});
test("valid signature still rejects amount mismatch", async () => {
  const fields: [string, string][] = [
    ["merchant_id", "100"],
    ["amount_gross", "1.01"],
  ];
  const sig = signature(fields, "test-secret");
  await assert.rejects(() =>
    verifyITN("merchant_id=100&amount_gross=1.01&signature=" + sig, 100),
  );
});
test("product validation prevents negative stock and traversal image paths", () => {
  const p = {
    name: "Tape",
    slug: "tape",
    description: "Packaging tape",
    category: "Tape",
    image: "/images/tape.png",
    active: true,
    variants: [
      { sku: "T1", name: "Standard", price: 100, stock: 0, active: true },
    ],
  };
  assert.equal(productInput.safeParse(p).success, true);
  assert.equal(
    productInput.safeParse({ ...p, image: "/images/../../secret" }).success,
    false,
  );
  assert.equal(
    productInput.safeParse({
      ...p,
      variants: [{ ...p.variants[0], stock: -1 }],
    }).success,
    false,
  );
});

test("shipping uses volumetric weight, quantity and integer monetary rounding", async () => {
  const { calculateShipping, matchShippingRule } =
    await import("../lib/shipping-rates");
  const rate = {
    id: "r1",
    name: "Approved route",
    originPrefix: "7",
    destinationPrefix: "2",
    basePrice: 10000,
    includedGrams: 5000,
    maximumGrams: 250000,
    perKg: 1000,
    divisor: 5000,
    fuelBps: 1000,
    taxBps: 0,
    surcharge: 500,
    active: true,
  };
  const result = calculateShipping(
    [
      {
        description: "Box",
        quantity: 2,
        length: 50,
        width: 40,
        height: 25,
        weight: 2,
      },
    ],
    rate,
  );
  assert.equal(result?.chargeableGrams, 20000);
  assert.equal(result?.total, 28000);
  assert.equal(matchShippingRule([rate], "7140", "2000")?.id, "r1");
  assert.equal(matchShippingRule([rate], "0000", "2000"), null);
  assert.equal(
    calculateShipping(
      [
        {
          description: "Heavy",
          quantity: 1,
          length: 10,
          width: 10,
          height: 10,
          weight: 251,
        },
      ],
      rate,
    ),
    null,
  );
});
