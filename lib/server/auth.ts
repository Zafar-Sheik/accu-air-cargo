import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, createHash } from "node:crypto";
import { db } from "./db";
import { HttpError } from "./http";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function key() {
  const k = process.env.JWT_SECRET;
  if (!k || k.length < 32)
    throw new HttpError(503, "Account access is not configured yet.");
  return new TextEncoder().encode(k);
}
export async function currentUser() {
  try {
    const token = (await cookies()).get("aac_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: "accu-air-cargo",
      audience: "accu-customers",
    });
    if (!payload.jti || !payload.sub) return null;
    const s = await db.session.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });
    if (!s || s.expiresAt < new Date() || s.userId !== payload.sub) return null;
    return s.user;
  } catch {
    return null;
  }
}
export async function requireUser(admin = false) {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Please sign in to continue.");
  if (admin && u.role !== "ADMIN")
    throw new HttpError(403, "Administrator access required.");
  return u;
}
export async function session(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 3600000);
  await db.session.create({ data: { id, userId, expiresAt } });
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(id)
    .setIssuer("accu-air-cargo")
    .setAudience("accu-customers")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key());
  (await cookies()).set("aac_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function logout() {
  const c = await cookies();
  const token = c.get("aac_session")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key());
      if (payload.jti)
        await db.session.deleteMany({ where: { id: payload.jti } });
    } catch {}
  }
  c.delete("aac_session");
}
export async function owner() {
  const u = await currentUser();
  if (u) return `user:${u.id}`;
  const c = await cookies();
  let id = c.get("aac_cart")?.value;
  if (!id || !/^[a-f0-9]{64}$/.test(id)) {
    id = randomBytes(32).toString("hex");
    c.set("aac_cart", id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });
  }
  return `guest:${id}`;
}
export async function limit(id: string, max = 10) {
  const key = hash(id);
  const now = new Date();
  await db.rateLimit.deleteMany({ where: { id: key, expiresAt: { lt: now } } });
  const row = await db.rateLimit.upsert({
    where: { id: key },
    create: { id: key, count: 1, expiresAt: new Date(Date.now() + 900000) },
    update: { count: { increment: 1 } },
  });
  if (row.count > max)
    throw new HttpError(
      429,
      "Too many attempts. Please try again in 15 minutes.",
    );
}
export async function issueToken(email: string, kind: string) {
  const token = randomBytes(32).toString("hex");
  await db.token.create({
    data: {
      id: hash(token),
      email,
      kind,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return token;
}
export { hash };
