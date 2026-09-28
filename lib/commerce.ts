export function money(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(cents / 100);
}
export function totals(
  items: { price: number; quantity: number }[],
  percent = 0,
  shipping = 0,
) {
  if (
    !Number.isSafeInteger(percent) ||
    percent < 0 ||
    percent > 100 ||
    !Number.isSafeInteger(shipping) ||
    shipping < 0
  )
    throw Error("Invalid totals");
  const subtotal = items.reduce((sum, i) => {
    if (
      !Number.isSafeInteger(i.price) ||
      i.price < 0 ||
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 999
    )
      throw Error("Invalid item");
    return sum + i.price * i.quantity;
  }, 0);
  if (!Number.isSafeInteger(subtotal)) throw Error("Total too large");
  const discount = Math.round((subtotal * percent) / 100);
  return {
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
  };
}
export function cents(value: string) {
  if (!/^\d+\.\d{2}$/.test(value)) throw Error("Invalid amount");
  return Number(value.replace(".", ""));
}
export const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
