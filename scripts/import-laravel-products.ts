/**
 * Import produk dari DB Laravel (master_barang) → 45vape_next
 * Gambar sumber: public/gambar/
 *
 * Usage: npx tsx scripts/import-laravel-products.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const SRC = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: "45vape_laravel_src",
};

const DST_ADAPTER = new PrismaMariaDb({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "45vape_next",
});

const prisma = new PrismaClient({ adapter: DST_ADAPTER });

type SrcRow = {
  id_barang: string;
  nama_barang: string | null;
  merek: string | null;
  jenis: string;
  kategori_barang: string | null;
  nic: number | null;
  stok: number | null;
  harga: string | number | null;
  keterangan: string | null;
  gambar: string | null;
  diskon_persen: string | null;
};

const GAMBAR_DIR = path.join(process.cwd(), "public", "gambar");
const OUT_DIR = path.join(process.cwd(), "public", "uploads", "products");

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (/^\d+ml$/i.test(w)) return w.toUpperCase();
      if (/^\d+mg$/i.test(w)) return w.toUpperCase();
      if (/^[A-Z0-9]{2,}$/.test(w) && w.length <= 4) return w.toUpperCase(); // IDJ, RDA, AIO
      if (/^(v\d+|ss|rda|rta|rba|rdta|aio|mtl|rdl|dl)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function cleanName(raw: string) {
  let name = raw
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  // Drop trailing nic tags that belong on variants
  name = name.replace(/\s*[-–]?\s*\d+\s*MG\b/gi, "");
  name = name.replace(/\s+/g, " ").trim();

  // Fix common typos / noise
  name = name
    .replace(/CHESE/gi, "Cheese")
    .replace(/Indoensia/gi, "Indonesia")
    .replace(/Indonesian Dream Juice/gi, "Indonesia Dream Juice")
    .replace(/IDJ\s*\(Indonesia Dream Juice\)/gi, "IDJ")
    .replace(/\s*AUTHENTIC\b/gi, "")
    .replace(/\s*ALL COLORS\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Prefer "Brand – Product" spacing
  name = name.replace(/\s*-\s*/g, " - ");
  name = name.replace(/\s*–\s*/g, " - ");

  return titleCase(name);
}

function cleanBrand(raw: string | null) {
  if (!raw?.trim()) return "45 Vape";
  let b = raw.trim().replace(/\s+/g, " ");
  b = b
    .replace(/IDJ\s*\(INDONESIA DREAM JUICE\)/i, "Indonesia Dream Juice")
    .replace(/JUICENATION COMPANY/i, "Juice Nation")
    .replace(/Poda E-Liquid/i, "Poda E-Liquid")
    .replace(/GEROBAK VAPOR & VAPERZ CLOUD/i, "Gerobak Vapor");
  return titleCase(b);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function mapCategory(jenis: string, kategori: string | null): { category: string; subcategory: string } {
  const j = (jenis || "").trim().toLowerCase();
  const k = (kategori || "").trim().toLowerCase();

  if (j === "liquid") {
    if (k === "freebase") return { category: "liquid", subcategory: "freebase" };
    if (k === "saltnic" || k === "pods_friendly") return { category: "liquid", subcategory: "saltnic" };
    return { category: "liquid", subcategory: "saltnic" };
  }

  if (j === "pod") {
    return { category: "pod", subcategory: "pod-system" };
  }

  if (j === "mod") {
    if (k === "aio") return { category: "pod", subcategory: "aio" };
    if (k === "mechanical") return { category: "mod", subcategory: "mechanical-mod" };
    return { category: "mod", subcategory: "electrical-mod" };
  }

  if (j === "atomizer") {
    if (k === "rdta") return { category: "atomizer", subcategory: "rbta" };
    if (["rda", "rba", "rta", "coil", "cartridge", "coil-prebuild"].includes(k)) {
      return { category: "atomizer", subcategory: k };
    }
    return { category: "atomizer", subcategory: k || "other" };
  }

  if (j === "accessories") {
    if (k === "charger") return { category: "accessories", subcategory: "charger-battery" };
    if (k === "battery") return { category: "accessories", subcategory: "battery" };
    if (k === "cotton") return { category: "accessories", subcategory: "cotton" };
    return { category: "accessories", subcategory: "other" };
  }

  return { category: "accessories", subcategory: "other" };
}

function cleanDescription(raw: string | null) {
  if (!raw?.trim()) return "Produk original 45 Vape. Stok update — konfirmasi ketersediaan jika perlu.";
  let text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/READY\s*STOCK[! !\.]*/gi, "READY STOCK")
    .replace(/Harap konfirmasi terlebih dahulu[\s\S]*$/i, "")
    .replace(/Terima kasih,\s*\n?\s*45VAPE\s*$/i, "")
    .replace(/\n\s*\.\s*\n/g, "\n.\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Ensure key specs sit on their own lines for storefront formatting
  text = text.replace(
    /\s+(?=(?:Flavour|Flavor|Nicotine|Volume|PG\/VG|Brand|Product Name|Dimension|Size|Weight|Battery|Output|Material|Capacity|Color|Colors|Includes|Parameter|Parameters|Features|Variant)\s*[:：])/gi,
    "\n",
  );
  text = text.replace(/(\S)\s+(\*?100%\s*Authentic[^\n]*)/gi, "$1\n$2");

  if (text.length > 2500) text = `${text.slice(0, 2490).trim()}…`;
  if (!text) return "Produk original 45 Vape. Stok update — konfirmasi ketersediaan jika perlu.";
  return text;
}

function parseDiscount(v: string | null) {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(90, Math.round(n)));
}

function nicLabel(nic: number | null) {
  if (nic == null || Number.isNaN(Number(nic))) return null;
  return `${Number(nic)}mg`;
}

function resolveImage(gambar: string | null, imageIndex: Map<string, string>) {
  if (!gambar) return null;
  const base = path.basename(gambar.split("?")[0]).toLowerCase();
  if (imageIndex.has(base)) return imageIndex.get(base)!;

  // try without extension variants
  const stem = base.replace(/\.[^.]+$/, "");
  for (const [key, full] of imageIndex) {
    if (key.startsWith(stem)) return full;
  }
  return null;
}

function buildImageIndex() {
  const map = new Map<string, string>();
  if (!fs.existsSync(GAMBAR_DIR)) return map;
  for (const file of fs.readdirSync(GAMBAR_DIR)) {
    if (file.startsWith(".")) continue;
    if (/\.zip$/i.test(file)) continue;
    map.set(file.toLowerCase(), file);
  }
  return map;
}

function copyImage(fileName: string, slug: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const src = path.join(GAMBAR_DIR, fileName);
  const ext = path.extname(fileName).toLowerCase() || ".jpg";
  const safe = `${slug}${ext}`.replace(/[^a-z0-9._-]/gi, "-");
  const dest = path.join(OUT_DIR, safe);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
  return `/uploads/products/${safe}`;
}

function groupKey(row: SrcRow, name: string, brand: string, category: string, subcategory: string) {
  return [name.toLowerCase(), brand.toLowerCase(), category, subcategory].join("||");
}

async function fetchSourceRows(): Promise<SrcRow[]> {
  const mariadb = await import("mariadb");
  const conn = await mariadb.createConnection(SRC);
  try {
    const rows = await conn.query(
      `SELECT id_barang, nama_barang, merek, jenis, kategori_barang, nic, stok, harga, keterangan, gambar, diskon_persen
       FROM master_barang
       ORDER BY nama_barang, nic`,
    );
    return rows as SrcRow[];
  } finally {
    await conn.end();
  }
}

async function main() {
  console.log("Membaca master_barang dari 45vape_laravel_src...");
  const rows = await fetchSourceRows();
  console.log(`Baris sumber: ${rows.length}`);

  const imageIndex = buildImageIndex();
  console.log(`File gambar: ${imageIndex.size}`);

  type Group = {
    name: string;
    brand: string;
    brandSlug: string;
    category: string;
    subcategory: string;
    description: string;
    imageFile: string | null;
    featured: boolean;
    variants: { nic: string | null; stock: number; price: number; discountPercent: number }[];
    sourceIds: string[];
  };

  const groups = new Map<string, Group>();
  let skippedNoName = 0;

  for (const row of rows) {
    const rawName = (row.nama_barang || "").trim();
    if (!rawName) {
      skippedNoName++;
      continue;
    }

    const name = cleanName(rawName);
    const brand = cleanBrand(row.merek);
    const { category, subcategory } = mapCategory(row.jenis, row.kategori_barang);
    const key = groupKey(row, name, brand, category, subcategory);

    const price = Math.round(Number(row.harga || 0));
    const stock = Math.max(0, Number(row.stok || 0));
    const discountPercent = parseDiscount(row.diskon_persen);
    const nic = nicLabel(row.nic == null ? null : Number(row.nic));
    const imgFile = resolveImage(row.gambar, imageIndex);

    if (!groups.has(key)) {
      groups.set(key, {
        name,
        brand,
        brandSlug: slugify(brand) || "brand",
        category,
        subcategory,
        description: cleanDescription(row.keterangan),
        imageFile: imgFile,
        featured: false,
        variants: [],
        sourceIds: [],
      });
    }

    const g = groups.get(key)!;
    g.sourceIds.push(row.id_barang);
    if (!g.imageFile && imgFile) g.imageFile = imgFile;
    if ((g.description?.length || 0) < (cleanDescription(row.keterangan).length || 0)) {
      g.description = cleanDescription(row.keterangan);
    }

    // merge variant same nic
    const existing = g.variants.find((v) => v.nic === nic);
    if (existing) {
      existing.stock += stock;
      existing.price = Math.max(existing.price, price);
      existing.discountPercent = Math.max(existing.discountPercent, discountPercent);
    } else {
      g.variants.push({ nic, stock, price: Math.max(0, price), discountPercent });
    }
  }

  // Mark a few featured (highest stock liquids / devices)
  const list = [...groups.values()].filter((g) => g.variants.length > 0 && g.variants.some((v) => v.price > 0));
  list
    .filter((g) => g.category === "liquid")
    .sort((a, b) => b.variants.reduce((s, v) => s + v.stock, 0) - a.variants.reduce((s, v) => s + v.stock, 0))
    .slice(0, 8)
    .forEach((g) => {
      g.featured = true;
    });
  list
    .filter((g) => g.category !== "liquid")
    .sort((a, b) => b.variants.reduce((s, v) => s + v.stock, 0) - a.variants.reduce((s, v) => s + v.stock, 0))
    .slice(0, 4)
    .forEach((g) => {
      g.featured = true;
    });

  console.log(`Produk unik (setelah group NIC): ${list.length}`);
  console.log(`Lewati tanpa nama: ${skippedNoName}`);

  // Clear existing catalog only
  console.log("Membersihkan produk lama di 45vape_next...");
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  const usedSlugs = new Set<string>();
  let imported = 0;
  let missingImage = 0;

  for (const g of list) {
    let baseSlug = slugify(`${g.brand}-${g.name}`) || slugify(g.name) || `produk-${imported + 1}`;
    let slug = baseSlug;
    let i = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${i++}`;
    }
    usedSlugs.add(slug);

    let imagePath = "/brand/IMG_3820.PNG";
    if (g.imageFile) {
      try {
        imagePath = copyImage(g.imageFile, slug);
      } catch {
        missingImage++;
      }
    } else {
      missingImage++;
    }

    await prisma.product.create({
      data: {
        slug,
        name: g.name.slice(0, 200),
        brand: g.brand.slice(0, 120),
        brandSlug: g.brandSlug.slice(0, 80),
        category: g.category,
        subcategory: g.subcategory.slice(0, 40),
        description: g.description,
        image: imagePath.slice(0, 255),
        featured: g.featured,
        variants: {
          create: g.variants.map((v) => ({
            nic: v.nic,
            stock: v.stock,
            price: v.price,
            discountPercent: v.discountPercent,
          })),
        },
      },
    });
    imported++;
    if (imported % 50 === 0) console.log(`  ... ${imported}/${list.length}`);
  }

  const [products, variants] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
  ]);

  const byCat = await prisma.product.groupBy({
    by: ["category"],
    _count: { _all: true },
  });

  console.log("\nSelesai import.");
  console.log(`Produk: ${products} · Varian: ${variants} · Tanpa gambar cocok: ${missingImage}`);
  console.log(
    "Per kategori:",
    byCat.map((c) => `${c.category}=${c._count._all}`).join(", "),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
