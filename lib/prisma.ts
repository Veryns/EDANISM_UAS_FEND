import type { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { __prisma?: PrismaClient };

function create(): PrismaClient {
  if ((process.env.DATABASE_URL || "").startsWith("file:")) {
    const { createLocalDb } = require("./localdb");
    return createLocalDb(process.env.DATABASE_URL as string) as unknown as PrismaClient;
  }
  const { PrismaClient: Client } = require("@prisma/client");
  return new Client();
}

export const prisma = (g.__prisma ??= create());
export default prisma;
