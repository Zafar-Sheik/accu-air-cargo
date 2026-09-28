import { PrismaClient } from "@prisma/client";
const state = globalThis as unknown as { prisma?: PrismaClient };
export const db = state.prisma ?? new PrismaClient({ log: ["error"] });
state.prisma = db;
export function configured() {
  return Boolean(process.env.DATABASE_URL);
}
