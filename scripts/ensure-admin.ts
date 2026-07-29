import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "45vape_next",
  }),
});

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@45vape.test").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "admin",
      password: hash,
      name: "Admin 45 Vape",
    },
    create: {
      email,
      password: hash,
      name: "Admin 45 Vape",
      role: "admin",
    },
  });

  console.log(`Admin ready: ${user.email} / ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
