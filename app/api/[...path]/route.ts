import { z } from "zod";
import { uploadImage } from "@/lib/server/storage";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { compare, hash as hashPassword } from "bcryptjs";
import { db, configured } from "@/lib/server/db";
import { body, endpoint, HttpError, requireOrigin } from "@/lib/server/http";
import {
  currentUser,
  requireUser,
  session,
  logout,
  owner,
  limit,
  issueToken,
  hash,
} from "@/lib/server/auth";
import { queueMail, sendOutbox } from "@/lib/server/mail";
import { paymentForm, verifyITN } from "@/lib/server/payfast";
import { totals } from "@/lib/commerce";
import {
  email,
  password,
  address,
  quote,
  parcel,
  productInput,
} from "@/lib/validation";
import { calculateShipping, matchShippingRule } from "@/lib/shipping-rates";
import { shippingRuleInput } from "@/lib/validation";
import { catalogue } from "@/lib/catalogue";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };
const json = (v: unknown) => v as Prisma.InputJsonValue;
const ref = (prefix: string) =>
  `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
async function settings() {
  const s = await db.setting.findUnique({ where: { key: "commerce" } });
  return s?.value as {
    shipping?: number;
    checkoutEnabled?: boolean;
    supportEmail?: string;
  } | null;
}
async function audit(actor: string, action: string, target: string) {
  await db.audit.create({ data: { actor, action, target } });
}
async function dispatch(req: Request, ctx: Context) {
  const path = (await ctx.params).path;
  const [resource, id, action] = path;
  const get = req.method === "GET";
  if (resource === "health")
    return {
      databaseConfigured: configured(),
      paymentsConfigured: Boolean(process.env.PAYFAST_MERCHANT_ID),
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
    };
  if (resource === "products" && get) {
    if (!configured())
      return {
        products: catalogue,
        source: "published-catalogue",
        checkoutEnabled: false,
      };
    const products = await db.product.findMany({
      where: { active: true },
      include: { variants: { where: { active: true } } },
      orderBy: { name: "asc" },
      take: 500,
    });
    return {
      products,
      source: "database",
      checkoutEnabled: (await settings())?.checkoutEnabled ?? false,
    };
  }
  if (!configured())
    throw new HttpError(
      503,
      "This preview is not connected to the business database yet. No information has been submitted.",
    );
  if (resource === "payfast" && id === "notify" && !get) {
    const raw = await req.text();
    if (raw.length > 20000) throw new HttpError(413, "Invalid notification");
    const p = new URLSearchParams(raw);
    const order = await db.order.findUnique({
      where: { id: p.get("m_payment_id") || "" },
    });
    if (!order) throw new HttpError(404, "Order not found");
    const f = await verifyITN(raw, order.total);
    if (!f.pf_payment_id) throw new HttpError(400, "Missing payment reference");
    await db.$transaction(
      async (tx) => {
        const existing = await tx.payment.findUnique({
          where: { id: f.pf_payment_id },
        });
        if (existing) {
          if (existing.orderId !== order.id || existing.amount !== order.total)
            throw new HttpError(409, "Payment reference conflict");
          if (
            existing.status === "COMPLETE" ||
            existing.status === f.payment_status
          )
            return;
          await tx.payment.update({
            where: { id: existing.id },
            data: { status: f.payment_status, payloadHash: hash(raw) },
          });
        } else
          await tx.payment.create({
            data: {
              id: f.pf_payment_id,
              orderId: order.id,
              amount: order.total,
              status: f.payment_status,
              payloadHash: hash(raw),
            },
          });
        if (f.payment_status === "COMPLETE") {
          const fresh = await tx.order.findUniqueOrThrow({
            where: { id: order.id },
          });
          if (fresh.paymentStatus === "PAID") return;
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "PAID",
              status: fresh.stockReleased ? "PAYMENT_REVIEW" : "CONFIRMED",
            },
          });
          await tx.outbox.create({
            data: {
              recipient: order.email,
              subject: `Payment received · ${order.reference}`,
              body: `Your payment for ${order.reference} has been verified.${fresh.stockReleased ? " Your reservation expired before payment and our team will contact you to arrange fulfilment or a refund." : " We will update you when your order is ready."}`,
            },
          });
        }
      },
      { timeout: 5000 },
    );
    return { received: true };
  }
  if (resource === "jobs") {
    if (
      !process.env.CRON_SECRET ||
      req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
    )
      throw new HttpError(401, "Unauthorised");
    const expired = await db.order.findMany({
      where: {
        paymentStatus: "PENDING",
        stockReleased: false,
        expiresAt: { lt: new Date() },
      },
      take: 50,
    });
    for (const o of expired)
      await db.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { id: o.id, paymentStatus: "PENDING", stockReleased: false },
          data: { stockReleased: true, status: "EXPIRED" },
        });
        if (!claimed.count) return;
        for (const i of o.items as { variantId?: string; quantity: number }[])
          if (i.variantId)
            await tx.variant.update({
              where: { id: i.variantId },
              data: { stock: { increment: i.quantity } },
            });
      });
    await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.token.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return { released: expired.length, email: await sendOutbox() };
  }
  if (!get) requireOrigin(req);
  if (resource === "media" && req.method === "POST") {
    const user = await requireUser(true);
    await limit(`upload:${user.id}`, 30);
    const result = await uploadImage(req);
    await audit(user.id, "UPLOAD_IMAGE", result.url);
    return result;
  }
  if (resource === "auth") {
    if (get && id !== "me")
      throw new HttpError(405, "Use POST for this action");
    if (id === "me") {
      const u = await currentUser();
      return {
        user: u
          ? { id: u.id, name: u.name, email: u.email, role: u.role }
          : null,
      };
    }
    const b = get ? {} : await body(req);
    if (id === "logout") {
      await logout();
      return { ok: true };
    }
    if (id === "register") {
      const d = z
        .object({ name: z.string().min(2).max(100), email, password })
        .parse(b);
      if (!process.env.RESEND_API_KEY)
        throw new HttpError(503, "Account email is not configured yet.");
      await limit(`register:${d.email}`, 5);
      const existing = await db.user.findUnique({ where: { email: d.email } });
      if (!existing) {
        const encoded = await hashPassword(d.password, 12);
        await db.user.create({
          data: { name: d.name, email: d.email, password: encoded },
        });
        const t = await issueToken(d.email, "verify");
        await queueMail(
          d.email,
          "Verify your Accu Air Cargo account",
          `${process.env.APP_URL}/verify?token=${t}`,
        );
      }
      return {
        message:
          "If this address can be registered, a verification link will arrive by email.",
      };
    }
    if (id === "login") {
      const d = z.object({ email, password: z.string().max(72) }).parse(b);
      await limit(`login:${d.email}`, 10);
      const u = await db.user.findUnique({ where: { email: d.email } });
      const valid = await compare(
        d.password,
        u?.password ||
          "$2b$12$OEX18YSQrkAujxTwkXHYjOql4XL/KMHCZuHCycxb.t/TfWjWoWu9K",
      );
      if (!u || !valid)
        throw new HttpError(401, "Email or password is incorrect.");
      if (!u.verified)
        throw new HttpError(403, "Please verify your email before signing in.");
      const guest = await owner();
      const oldItems = await db.cartItem.findMany({ where: { owner: guest } });
      await db.$transaction(async (tx) => {
        for (const i of oldItems)
          await tx.cartItem.upsert({
            where: {
              owner_variantId: {
                owner: `user:${u.id}`,
                variantId: i.variantId,
              },
            },
            create: {
              owner: `user:${u.id}`,
              variantId: i.variantId,
              quantity: i.quantity,
            },
            update: { quantity: i.quantity },
          });
        if (guest !== `user:${u.id}`)
          await tx.cartItem.deleteMany({ where: { owner: guest } });
      });
      await session(u.id);
      return { ok: true, role: u.role };
    }
    if (id === "forgot") {
      const d = z.object({ email }).parse(b);
      if (!process.env.RESEND_API_KEY)
        throw new HttpError(
          503,
          "Password recovery email is not configured yet.",
        );
      await limit(`forgot:${d.email}`, 3);
      if (await db.user.findUnique({ where: { email: d.email } })) {
        const t = await issueToken(d.email, "reset");
        await queueMail(
          d.email,
          "Reset your password",
          `${process.env.APP_URL}/reset?token=${t}`,
        );
      }
      return {
        message: "If an account exists, a reset link will arrive by email.",
      };
    }
    if (id === "verify" || id === "reset") {
      const d = z
        .object({ token: z.string().length(64), password: password.optional() })
        .parse(b);
      const t = await db.token.findUnique({ where: { id: hash(d.token) } });
      if (
        !t ||
        t.kind !== (id === "verify" ? "verify" : "reset") ||
        t.expiresAt < new Date()
      )
        throw new HttpError(400, "This link has expired or already been used.");
      if (id === "reset" && !d.password)
        throw new HttpError(400, "A new password is required");
      const encoded = d.password
        ? await hashPassword(d.password, 12)
        : undefined;
      await db.$transaction(async (tx) => {
        await tx.token.delete({ where: { id: t.id } });
        const u = await tx.user.update({
          where: { email: t.email },
          data: id === "verify" ? { verified: true } : { password: encoded },
        });
        await tx.session.deleteMany({ where: { userId: u.id } });
        if (id === "verify")
          await tx.quote.updateMany({
            where: { email: u.email, userId: null },
            data: { userId: u.id },
          });
      });
      return {
        message:
          id === "verify"
            ? "Email verified. You can now sign in."
            : "Password changed. Please sign in.",
      };
    }
  }
  if (resource === "cart") {
    const cartOwner = await owner();
    if (get) {
      const items = await db.cartItem.findMany({
        where: { owner: cartOwner },
        include: { variant: { include: { product: true } } },
      });
      return {
        items,
        ...totals(
          items.map((i) => ({ quantity: i.quantity, price: i.variant.price })),
        ),
      };
    }
    const d = z
      .object({
        variantId: z.string(),
        quantity: z.number().int().min(0).max(99),
      })
      .parse(await body(req));
    const v = await db.variant.findUnique({
      where: { id: d.variantId },
      include: { product: true },
    });
    if (
      d.quantity &&
      (!v || !v.active || !v.product.active || v.stock < d.quantity)
    )
      throw new HttpError(409, "This quantity is not available.");
    if (d.quantity === 0)
      await db.cartItem.deleteMany({
        where: { owner: cartOwner, variantId: d.variantId },
      });
    else
      await db.cartItem.upsert({
        where: {
          owner_variantId: { owner: cartOwner, variantId: d.variantId },
        },
        create: { owner: cartOwner, ...d },
        update: { quantity: d.quantity },
      });
    return { ok: true };
  }
  if (resource === "checkout") {
    const d = z
      .object({
        email,
        address,
        coupon: z.string().max(64).optional(),
        acceptTerms: z.literal(true),
        requestId: z.string().uuid(),
      })
      .parse(await body(req));
    const cfg = await settings();
    if (!cfg?.checkoutEnabled || cfg.shipping === undefined)
      throw new HttpError(
        503,
        "Checkout is awaiting confirmed delivery rates and merchant activation.",
      );
    paymentForm({ id: "check", reference: "check", total: 1, email: d.email });
    const cartOwner = await owner();
    await limit(`checkout:${cartOwner}`, 20);
    const u = await currentUser();
    const reference = `AAC-${d.requestId}`;
    const prior = await db.order.findUnique({ where: { reference } });
    if (prior) {
      if (prior.email !== d.email || prior.userId !== (u?.id ?? null))
        throw new HttpError(409, "Reference already used");
      if (
        prior.paymentStatus !== "PENDING" ||
        prior.stockReleased ||
        prior.expiresAt < new Date()
      )
        throw new HttpError(
          409,
          "This payment reservation is no longer available.",
        );
      return { order: prior.reference, payment: paymentForm(prior) };
    }
    const order = await db.$transaction(
      async (tx) => {
        const cart = await tx.cartItem.findMany({
          where: { owner: cartOwner },
          include: { variant: { include: { product: true } } },
        });
        if (!cart.length) throw new HttpError(400, "Your basket is empty.");
        const coupon = d.coupon
          ? await tx.coupon.findUnique({
              where: { code: d.coupon.toUpperCase() },
            })
          : null;
        if (
          d.coupon &&
          (!coupon ||
            !coupon.active ||
            (coupon.expiresAt && coupon.expiresAt < new Date()))
        )
          throw new HttpError(
            400,
            "This promotional code is invalid or expired.",
          );
        const items = [];
        for (const i of cart) {
          if (!i.variant.active || !i.variant.product.active)
            throw new HttpError(409, "An item is no longer available");
          const reserved = await tx.variant.updateMany({
            where: { id: i.variantId, stock: { gte: i.quantity } },
            data: { stock: { decrement: i.quantity } },
          });
          if (reserved.count !== 1)
            throw new HttpError(
              409,
              `${i.variant.product.name} has insufficient stock.`,
            );
          items.push({
            variantId: i.variantId,
            name: i.variant.product.name,
            variant: i.variant.name,
            sku: i.variant.sku,
            price: i.variant.price,
            quantity: i.quantity,
          });
        }
        const total = totals(items, coupon?.percent ?? 0, cfg.shipping);
        if (total.total < 1)
          throw new HttpError(400, "Order total must be greater than zero.");
        const o = await tx.order.create({
          data: {
            reference,
            email: d.email,
            userId: u?.id,
            address: json(d.address),
            items: json(items),
            ...total,
            expiresAt: new Date(Date.now() + 30 * 60000),
          },
        });
        await tx.cartItem.deleteMany({ where: { owner: cartOwner } });
        return o;
      },
      { timeout: 5000 },
    );
    return { order: order.reference, payment: paymentForm(order) };
  }
  if (resource === "quotes") {
    if (get) {
      const u = await requireUser();
      return {
        quotes: await db.quote.findMany({
          where: { userId: u.id },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      };
    }
    if (id && action === "pay") {
      const u = await requireUser();
      const q = await db.quote.findFirst({ where: { id, userId: u.id } });
      if (
        !q ||
        q.status !== "QUOTED" ||
        !q.amount ||
        !q.expiresAt ||
        q.expiresAt < new Date()
      )
        throw new HttpError(409, "This quote is not available for payment.");
      paymentForm({
        id: q.id,
        reference: q.reference,
        total: q.amount,
        email: q.email,
      });
      const order = await db.$transaction(async (tx) => {
        if (q.orderId) {
          const existing = await tx.order.findUniqueOrThrow({
            where: { id: q.orderId },
          });
          if (
            existing.paymentStatus !== "PENDING" ||
            existing.stockReleased ||
            existing.expiresAt < new Date()
          )
            throw new HttpError(
              409,
              "This quote order is no longer available for payment.",
            );
          return existing;
        }
        const created = await tx.order.create({
          data: {
            reference: q.reference,
            email: q.email,
            userId: u.id,
            subtotal: q.amount!,
            shipping: 0,
            total: q.amount!,
            address: q.data as Prisma.InputJsonValue,
            items: json([
              { name: "Courier service", price: q.amount, quantity: 1 },
            ]),
            expiresAt: q.expiresAt!,
          },
        });
        await tx.quote.update({
          where: { id: q.id },
          data: { orderId: created.id },
        });
        return created;
      });
      return { payment: paymentForm(order) };
    }
    const d = quote.parse(await body(req));
    await limit(`quote:${d.email}`, 10);
    const u = await currentUser();
    let calculated = null;
    if (d.kind === "domestic" && !d.dangerousGoods && !d.instructions.trim()) {
      const rules = await db.shippingRule.findMany({ where: { active: true } });
      const rule = matchShippingRule(
        rules,
        d.originPostalCode,
        d.destinationPostalCode,
      );
      if (rule) calculated = calculateShipping(d.parcels, rule);
    }
    const q = await db.quote.create({
      data: {
        reference: ref("Q"),
        userId: u?.id,
        email: d.email,
        data: json({ ...d, breakdown: calculated }),
        amount: calculated?.total,
        status: calculated ? "QUOTED" : "REQUESTED",
        expiresAt: calculated ? new Date(Date.now() + 7 * 86400000) : null,
      },
    });
    await queueMail(
      d.email,
      `Quote request received · ${q.reference}`,
      `Your request ${q.reference} has been recorded. Our team will review your route, parcel details and service requirements before confirming a price.`,
    );
    return {
      reference: q.reference,
      amount: q.amount,
      message: calculated
        ? "Your quote is ready. Sign in to review and pay."
        : "Your quote request has been saved. A price will be confirmed after review.",
    };
  }
  if (resource === "tracking") {
    const waybill = new URL(req.url).searchParams.get("waybill")?.trim();
    if (!waybill || waybill.length > 100)
      throw new HttpError(400, "Enter a valid waybill number");
    const s = await db.shipment.findUnique({
      where: { waybill },
      select: { waybill: true, status: true, events: true, updatedAt: true },
    });
    if (!s)
      throw new HttpError(
        404,
        "No shipment was found for this waybill. Check the number or contact support.",
      );
    return { shipment: s };
  }
  if (resource === "contact") {
    const d = z
      .object({
        name: z.string().min(2).max(120),
        email,
        phone: z.string().min(8).max(30),
        message: z.string().min(10).max(4000),
      })
      .parse(await body(req));
    await limit(`contact:${d.email}`, 5);
    const e = await db.enquiry.create({ data: d });
    return {
      reference: e.id,
      message: "Your message has been saved for the support team.",
    };
  }
  if (resource === "account") {
    const u = await requireUser();
    if (get)
      return {
        user: { name: u.name, email: u.email, role: u.role },
        orders: await db.order.findMany({
          where: { userId: u.id },
          include: { shipment: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        quotes: await db.quote.findMany({
          where: { userId: u.id },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        addresses: await db.address.findMany({ where: { userId: u.id } }),
        packages: await db.package.findMany({ where: { userId: u.id } }),
        returns: await db.returnRequest.findMany({ where: { userId: u.id } }),
      };
    const d = z
      .object({ name: z.string().min(2).max(100) })
      .parse(await body(req));
    await db.user.update({ where: { id: u.id }, data: d });
    return { ok: true };
  }
  if (resource === "addresses" || resource === "packages") {
    const u = await requireUser();
    if (req.method === "DELETE") {
      if (resource === "addresses")
        await db.address.deleteMany({ where: { id, userId: u.id } });
      else await db.package.deleteMany({ where: { id, userId: u.id } });
      return { ok: true };
    }
    const b = await body(req);
    const label = z.string().min(2).max(100).parse(b.label);
    const data = json(
      resource === "addresses" ? address.parse(b.data) : parcel.parse(b.data),
    );
    if (resource === "addresses") {
      if (id)
        await db.address.updateMany({
          where: { id, userId: u.id },
          data: { label, data },
        });
      else await db.address.create({ data: { userId: u.id, label, data } });
    } else {
      if (id)
        await db.package.updateMany({
          where: { id, userId: u.id },
          data: { label, data },
        });
      else await db.package.create({ data: { userId: u.id, label, data } });
    }
    return { ok: true };
  }
  if (resource === "orders") {
    const u = await requireUser();
    const o = await db.order.findFirst({
      where: { id, userId: u.id },
      include: { shipment: true },
    });
    if (!o) throw new HttpError(404, "Order not found");
    if (get) return { order: o };
    if (action === "pay") {
      if (
        o.paymentStatus !== "PENDING" ||
        o.stockReleased ||
        o.expiresAt < new Date()
      )
        throw new HttpError(
          409,
          "This payment reservation has expired. Please place a new order.",
        );
      return { payment: paymentForm(o) };
    }
    if (action === "return") {
      const reason = z
        .string()
        .min(10)
        .max(2000)
        .parse((await body(req)).reason);
      if (o.paymentStatus !== "PAID")
        throw new HttpError(
          409,
          "Only paid orders can be reviewed for return.",
        );
      await db.returnRequest.create({
        data: { orderId: o.id, userId: u.id, reason },
      });
      return { ok: true };
    }
  }
  if (resource === "admin") {
    const u = await requireUser(true);
    if (get) {
      const page = Math.max(
        0,
        Number(new URL(req.url).searchParams.get("page") || 0),
      );
      if (!Number.isInteger(page) || page > 10000)
        throw new HttpError(400, "Invalid page");
      const take = 50,
        skip = page * take;
      const [
        products,
        orders,
        quotes,
        users,
        enquiries,
        returns,
        coupons,
        audits,
        settingsRows,
      ] = await Promise.all([
        db.product.findMany({
          include: { variants: true },
          take,
          skip,
          orderBy: { name: "asc" },
        }),
        db.order.findMany({
          include: { shipment: true },
          take,
          skip,
          orderBy: { createdAt: "desc" },
        }),
        db.quote.findMany({ take, skip, orderBy: { createdAt: "desc" } }),
        db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            verified: true,
            createdAt: true,
          },
          take,
          skip,
        }),
        db.enquiry.findMany({ take, skip, orderBy: { createdAt: "desc" } }),
        db.returnRequest.findMany({ take, skip }),
        db.coupon.findMany({ take, skip }),
        db.audit.findMany({ take, skip, orderBy: { createdAt: "desc" } }),
        db.setting.findMany(),
      ]);
      const shippingRules = await db.shippingRule.findMany({
        orderBy: { name: "asc" },
      });
      const paid = await db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
        _count: true,
      });
      return {
        shippingRules,
        products,
        orders,
        quotes,
        users,
        enquiries,
        returns,
        coupons,
        audits,
        settings: settingsRows,
        metrics: { paidRevenue: paid._sum.total ?? 0, paidOrders: paid._count },
        page,
      };
    }
    const b = await body(req);
    if (id === "products") {
      if (req.method === "DELETE") {
        await db.product.update({
          where: { id: b.id },
          data: { active: false },
        });
        await audit(u.id, "ARCHIVE_PRODUCT", b.id);
        return { ok: true };
      }
      const d = productInput.parse(b);
      await db.$transaction(async (tx) => {
        const product = b.id
          ? await tx.product.update({
              where: { id: b.id },
              data: {
                name: d.name,
                slug: d.slug,
                description: d.description,
                category: d.category,
                image: d.image,
                active: d.active,
              },
            })
          : await tx.product.create({
              data: {
                name: d.name,
                slug: d.slug,
                description: d.description,
                category: d.category,
                image: d.image,
                active: d.active,
              },
            });
        const ids = d.variants.flatMap((v) => (v.id ? [v.id] : []));
        await tx.variant.updateMany({
          where: { productId: product.id, id: { notIn: ids } },
          data: { active: false },
        });
        for (const v of d.variants) {
          if (v.id) {
            const own = await tx.variant.findFirst({
              where: { id: v.id, productId: product.id },
            });
            if (!own)
              throw new HttpError(400, "Variant does not belong to product");
            await tx.variant.update({ where: { id: v.id }, data: v });
          } else
            await tx.variant.create({ data: { ...v, productId: product.id } });
        }
      });
      await audit(u.id, "SAVE_PRODUCT", b.id || d.slug);
      return { ok: true };
    }
    if (id === "quotes") {
      const d = z
        .object({
          id: z.string(),
          amount: z.number().int().positive(),
          validDays: z.number().int().min(1).max(30),
        })
        .parse(b);
      const q = await db.quote.findUniqueOrThrow({ where: { id: d.id } });
      if (q.orderId)
        throw new HttpError(
          409,
          "A payment order already exists for this quote.",
        );
      await db.quote.update({
        where: { id: d.id },
        data: {
          amount: d.amount,
          status: "QUOTED",
          expiresAt: new Date(Date.now() + d.validDays * 86400000),
        },
      });
      await queueMail(
        q.email,
        `Your quote is ready · ${q.reference}`,
        `Your quote ${q.reference} is ready. Sign in at ${process.env.APP_URL}/account to review it. If you requested it as a guest, contact support for assistance.`,
      );
      await audit(u.id, "PRICE_QUOTE", d.id);
      return { ok: true };
    }
    if (id === "orders") {
      const d = z
        .object({
          id: z.string(),
          status: z.enum(["PROCESSING", "DISPATCHED", "DELIVERED"]),
          waybill: z.string().min(3).max(100),
          location: z.string().min(2).max(100),
        })
        .parse(b);
      const o = await db.order.findUniqueOrThrow({ where: { id: d.id } });
      if (o.paymentStatus !== "PAID" || o.status === "PAYMENT_REVIEW")
        throw new HttpError(
          409,
          "Only verified paid orders without a review hold can be fulfilled.",
        );
      await db.$transaction(async (tx) => {
        const previous = await tx.shipment.findUnique({
          where: { orderId: d.id },
        });
        const sequence = ["PROCESSING", "DISPATCHED", "DELIVERED"];
        if (
          previous &&
          sequence.indexOf(d.status) < sequence.indexOf(previous.status)
        )
          throw new HttpError(409, "Shipment status cannot move backwards.");
        const events = [
          ...((previous?.events as object[]) || []),
          {
            status: d.status,
            location: d.location,
            date: new Date().toISOString(),
          },
        ];
        await tx.shipment.upsert({
          where: { orderId: d.id },
          create: {
            orderId: d.id,
            waybill: d.waybill,
            status: d.status,
            events: json(events),
          },
          update: {
            waybill: d.waybill,
            status: d.status,
            events: json(events),
          },
        });
        await tx.order.update({
          where: { id: d.id },
          data: { fulfillmentStatus: d.status },
        });
        await tx.outbox.create({
          data: {
            recipient: o.email,
            subject: `Shipment update · ${o.reference}`,
            body: `${o.reference}: ${d.status}. Waybill: ${d.waybill}. Track at ${process.env.APP_URL}/track.`,
          },
        });
      });
      await audit(u.id, "SHIPMENT_UPDATE", d.id);
      return { ok: true };
    }
    if (id === "shipping-rules") {
      const d = shippingRuleInput.parse(b);
      if (b.id)
        await db.shippingRule.update({
          where: { id: z.string().parse(b.id) },
          data: d,
        });
      else await db.shippingRule.create({ data: d });
      await audit(u.id, "SAVE_SHIPPING_RULE", b.id || d.name);
      return { ok: true };
    }
    if (id === "coupons") {
      const d = z
        .object({
          code: z.string().regex(/^[A-Z0-9-]{3,30}$/),
          percent: z.number().int().min(1).max(100),
          active: z.boolean(),
        })
        .parse(b);
      await db.coupon.upsert({ where: { code: d.code }, create: d, update: d });
      await audit(u.id, "SAVE_COUPON", d.code);
      return { ok: true };
    }
    if (id === "settings") {
      const d = z
        .object({
          shipping: z.number().int().min(0),
          checkoutEnabled: z.boolean(),
          supportEmail: email,
        })
        .parse(b);
      await db.setting.upsert({
        where: { key: "commerce" },
        create: { key: "commerce", value: d },
        update: { value: d },
      });
      await audit(u.id, "SAVE_SETTINGS", "commerce");
      return { ok: true };
    }
    if (id === "enquiries") {
      const d = z
        .object({
          id: z.string(),
          status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
        })
        .parse(b);
      await db.enquiry.update({
        where: { id: d.id },
        data: { status: d.status },
      });
      return { ok: true };
    }
    if (id === "returns") {
      const d = z
        .object({
          id: z.string(),
          status: z.enum([
            "REQUESTED",
            "APPROVED",
            "DECLINED",
            "REFUNDED_EXTERNALLY",
          ]),
        })
        .parse(b);
      await db.returnRequest.update({
        where: { id: d.id },
        data: { status: d.status },
      });
      await audit(u.id, "RETURN_" + d.status, d.id);
      return { ok: true };
    }
  }
  throw new HttpError(404, "Not found");
}
export const GET = (r: Request, c: Context) => endpoint(() => dispatch(r, c));
export const POST = (r: Request, c: Context) => endpoint(() => dispatch(r, c));
export const PATCH = (r: Request, c: Context) => endpoint(() => dispatch(r, c));
export const DELETE = (r: Request, c: Context) =>
  endpoint(() => dispatch(r, c));
