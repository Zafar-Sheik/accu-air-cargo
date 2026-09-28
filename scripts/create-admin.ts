import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) for this command.",
  );
if (await db.user.findUnique({ where: { email } }))
  throw Error(
    "User already exists; refusing to overwrite credentials or privileges.",
  );
await db.user.create({
  data: {
    email,
    password: await hash(password, 12),
    name: "Administrator",
    role: "ADMIN",
    verified: true,
  },
});
console.log(
  "Administrator created. Remove ADMIN_PASSWORD from your shell environment.",
);
await db.$disconnect();
