import { STORE } from "@/lib/store";

export type StoreBranch = {
  id: string;
  name: string;
  tag: string;
  city: string;
  address: string;
  phoneDisplay: string;
  phoneTel: string;
  whatsapp: string;
  email?: string;
  hours: string;
  mapsQuery: string;
  featured?: boolean;
};

/** Hubungi pusat — isi / tambah cabang di sini. */
export const CONTACT = {
  about:
    "45 Vape adalah toko vape terpercaya yang menyediakan berbagai produk vaping berkualitas tinggi dengan harga terbaik.",
  email: "45vapegroup@gmail.com",
  phoneDisplay: STORE.phoneDisplay,
  phoneTel: `+${STORE.whatsapp}`,
  whatsapp: STORE.whatsapp,
  city: "Bekasi, Indonesia",
  groupLogo: "/brand/45vape-group.webp",
} as const;

export const STORE_BRANCHES: StoreBranch[] = [
  {
    id: "bekasi-flagship",
    name: "45 Vape Bekasi",
    tag: "Flagship",
    city: "Bekasi",
    address: "Bekasi, Jawa Barat, Indonesia",
    phoneDisplay: CONTACT.phoneDisplay,
    phoneTel: CONTACT.phoneTel,
    whatsapp: CONTACT.whatsapp,
    email: CONTACT.email,
    hours: "Senin–Minggu · 10.00–21.00 WIB",
    mapsQuery: "45 Vape Bekasi Indonesia",
    featured: true,
  },
  {
    id: "online-care",
    name: "Customer Care Online",
    tag: "Chat",
    city: "Indonesia",
    address: "Layanan chat & order online ke seluruh Indonesia",
    phoneDisplay: CONTACT.phoneDisplay,
    phoneTel: CONTACT.phoneTel,
    whatsapp: CONTACT.whatsapp,
    email: CONTACT.email,
    hours: "Respon cepat · setiap hari",
    mapsQuery: "Bekasi Indonesia",
  },
];

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
