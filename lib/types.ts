import type { CatalogProduct } from "./catalogue";
export type AddressData = {
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
};
export type Parcel = {
  description: string;
  quantity: number;
  length: number;
  width: number;
  height: number;
  weight: number;
};
export type SavedAddress = { id: string; label: string; data: AddressData };
export type SavedPackage = { id: string; label: string; data: Parcel };
export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
};
export type ShipmentData = {
  waybill: string;
  status: string;
  updatedAt: string;
  events: { status: string; location: string; date: string }[];
};
export type OrderData = {
  id: string;
  reference: string;
  email: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  expiresAt: string;
  stockReleased: boolean;
  address: Partial<AddressData>;
  items: {
    name: string;
    variant?: string;
    sku?: string;
    quantity: number;
    price: number;
    variantId?: string;
  }[];
  shipment?: ShipmentData;
};
export type QuoteData = {
  id: string;
  reference: string;
  email: string;
  status: string;
  amount?: number;
  expiresAt?: string;
  data: { origin: string; destination: string; parcels: Parcel[] };
};
export type CouponData = { code: string; percent: number; active: boolean };
export type ReturnData = {
  id: string;
  orderId: string;
  reason: string;
  status: string;
};
export type EnquiryData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
};
export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  variant: CatalogProduct["variants"][number] & { product: CatalogProduct };
};
export type CommerceSettings = {
  shipping?: number;
  checkoutEnabled?: boolean;
  supportEmail?: string;
};
export type ApiData = {
  shippingRules: import("./shipping-rates").ShippingRate[];
  message?: string;
  error?: string;
  ok?: boolean;
  role?: string;
  reference: string;
  source: string;
  checkoutEnabled: boolean;
  user: UserSummary;
  products: CatalogProduct[];
  orders: OrderData[];
  order: OrderData;
  quotes: QuoteData[];
  addresses: SavedAddress[];
  packages: SavedPackage[];
  returns: ReturnData[];
  enquiries: EnquiryData[];
  users: UserSummary[];
  coupons: CouponData[];
  audits: {
    id: string;
    actor: string;
    action: string;
    target: string;
    createdAt: string;
  }[];
  settings: { key: string; value: CommerceSettings }[];
  metrics: { paidRevenue: number; paidOrders: number };
  items: CartLine[];
  subtotal: number;
  shipment: ShipmentData;
  payment: { action: string; fields: Record<string, string> };
};
