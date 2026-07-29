import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "45vape_next",
});

const prisma = new PrismaClient({ adapter });

/**
 * Bootstrap bersih untuk produksi/input barang real.
 * - Hapus semua produk, pesanan, keranjang, dan user dummy
 * - Pastikan 1 akun admin dari .env tersedia
 */
async function main() {
  console.log("Membersihkan data dummy...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@45vape.test").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: passwordHash,
      name: "Admin 45 Vape",
      phone: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      role: "admin",
    },
  });

  const products = await prisma.product.count();
  const users = await prisma.user.count();
  const orders = await prisma.order.count();

  console.log("Database siap untuk data real.");
  console.log(`Produk: ${products} · User: ${users} · Pesanan: ${orders}`);
  console.log(`Login admin: ${adminEmail} / (password dari ADMIN_PASSWORD di .env)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
