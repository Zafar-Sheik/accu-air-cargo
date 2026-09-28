import type { Parcel } from "./types";
export type ShippingRate = {
  id: string;
  name: string;
  originPrefix: string;
  destinationPrefix: string;
  basePrice: number;
  includedGrams: number;
  maximumGrams: number;
  perKg: number;
  divisor: number;
  fuelBps: number;
  taxBps: number;
  surcharge: number;
  active: boolean;
};
export function calculateShipping(parcels: Parcel[], rule: ShippingRate) {
  if (!rule.active || rule.divisor <= 0)
    throw Error("Shipping rule unavailable");
  const grams = parcels.reduce((sum, p) => {
    if (
      [p.length, p.width, p.height, p.weight, p.quantity].some(
        (n) => !Number.isFinite(n) || n <= 0,
      )
    )
      throw Error("Invalid parcel");
    return (
      sum +
      Math.ceil(
        Math.max(p.weight, (p.length * p.width * p.height) / rule.divisor) *
          1000,
      ) *
        p.quantity
    );
  }, 0);
  if (grams > rule.maximumGrams) return null;
  const extraGrams = Math.max(0, grams - rule.includedGrams);
  const weightCharge = Math.round((extraGrams * rule.perKg) / 1000);
  const subtotal = rule.basePrice + weightCharge;
  const fuel = Math.round((subtotal * rule.fuelBps) / 10000);
  const preTax = subtotal + fuel + rule.surcharge;
  const tax = Math.round((preTax * rule.taxBps) / 10000);
  const total = preTax + tax;
  if (!Number.isSafeInteger(total) || total < 1)
    throw Error("Invalid shipping total");
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    chargeableGrams: grams,
    basePrice: rule.basePrice,
    weightCharge,
    fuel,
    surcharge: rule.surcharge,
    tax,
    total,
  };
}
export function matchShippingRule(
  rules: ShippingRate[],
  origin: string,
  destination: string,
) {
  if (!/^\d{4}$/.test(origin) || !/^\d{4}$/.test(destination)) return null;
  return (
    rules
      .filter(
        (r) =>
          r.active &&
          origin.startsWith(r.originPrefix) &&
          destination.startsWith(r.destinationPrefix),
      )
      .sort(
        (a, b) =>
          b.originPrefix.length +
            b.destinationPrefix.length -
            (a.originPrefix.length + a.destinationPrefix.length) ||
          a.id.localeCompare(b.id),
      )[0] || null
  );
}
