import { PrismaClient } from "@prisma/client";
import { catalogue } from "../lib/catalogue";
const db = new PrismaClient();
for (const p of catalogue) {
  const exists = await db.product.findUnique({ where: { slug: p.slug } });
  if (exists) continue;
  await db.product.create({
    data: {
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      image: p.image,
      variants: {
        create: p.variants.map((v) => ({
          sku: v.sku,
          name: v.name,
          price: v.price,
          stock: 0,
        })),
      },
    },
  });
}
await db.setting.upsert({
  where: { key: "commerce" },
  create: {
    key: "commerce",
    value: {
      checkoutEnabled: false,
      supportEmail: "support@accuaircargo.co.za",
    },
  },
  update: {},
});
console.log(
  "Catalogue imported. Stock is zero and checkout remains disabled until verified by the merchant.",
);
await db.$disconnect();
