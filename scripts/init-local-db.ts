import prisma from "../lib/prisma";

async function main() {
  const n = await prisma.store.count();
  console.log(`Database lokal siap (${process.env.DATABASE_URL}). Jumlah toko: ${n}`);
  await prisma.$disconnect();
}
main();
