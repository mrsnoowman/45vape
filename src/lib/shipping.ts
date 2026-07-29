export type ShippingService = "reg" | "express";

export type ShippingOption = {
  code: ShippingService;
  label: string;
  eta: string;
  fee: number;
};

export type ShippingQuote = {
  destination: {
    city: string;
    province: string;
    postalCode: string;
  };
  zone: string;
  zoneLabel: string;
  options: ShippingOption[];
  defaultService: ShippingService;
};

type Destination = {
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
};

const ZONE_BASE: Record<string, { label: string; fee: number }> = {
  jabodetabek: { label: "Jabodetabek", fee: 12000 },
  jawa: { label: "Pulau Jawa", fee: 18000 },
  sumatera: { label: "Sumatera", fee: 28000 },
  kalimantan: { label: "Kalimantan", fee: 35000 },
  sulawesi: { label: "Sulawesi", fee: 38000 },
  bali_nt: { label: "Bali & Nusa Tenggara", fee: 30000 },
  maluku_papua: { label: "Maluku & Papua", fee: 55000 },
  other: { label: "Luar zona utama", fee: Number(process.env.SHIPPING_FEE || 25000) },
};

const JABODETABEK_CITIES = [
  "jakarta",
  "bogor",
  "depok",
  "tangerang",
  "bekasi",
  "south tangerang",
  "tangerang selatan",
];

function norm(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveShippingZone(destination: Destination) {
  const province = norm(destination.province);
  const city = norm(destination.city);

  if (
    province.includes("jakarta") ||
    JABODETABEK_CITIES.some((c) => city.includes(c)) ||
    (province.includes("banten") && (city.includes("tangerang") || city.includes("serang"))) ||
    (province.includes("jawa barat") &&
      (city.includes("bekasi") || city.includes("depok") || city.includes("bogor")))
  ) {
    return "jabodetabek";
  }

  if (
    province.includes("jawa barat") ||
    province.includes("jawa tengah") ||
    province.includes("jawa timur") ||
    province.includes("yogyakarta") ||
    province.includes("di yogyakarta") ||
    province.includes("diy")
  ) {
    return "jawa";
  }

  if (
    province.includes("sumatera") ||
    province.includes("aceh") ||
    province.includes("riau") ||
    province.includes("jambi") ||
    province.includes("bengkulu") ||
    province.includes("lampung") ||
    province.includes("bangka") ||
    province.includes("belitung")
  ) {
    return "sumatera";
  }

  if (province.includes("kalimantan")) return "kalimantan";
  if (province.includes("sulawesi") || province.includes("gorontalo")) return "sulawesi";
  if (
    province.includes("bali") ||
    province.includes("nusa tenggara") ||
    province.includes("ntb") ||
    province.includes("ntt")
  ) {
    return "bali_nt";
  }
  if (province.includes("maluku") || province.includes("papua")) return "maluku_papua";

  return "other";
}

export function quoteShipping(destination: Destination): ShippingQuote {
  const zone = resolveShippingZone(destination);
  const base = ZONE_BASE[zone] ?? ZONE_BASE.other;
  const regFee = base.fee;
  const expressFee = Math.round(base.fee * 1.55);

  const options: ShippingOption[] = [
    {
      code: "reg",
      label: "Reguler",
      eta: zone === "jabodetabek" ? "1–2 hari" : zone === "jawa" ? "2–4 hari" : "4–7 hari",
      fee: regFee,
    },
    {
      code: "express",
      label: "Express",
      eta: zone === "jabodetabek" ? "same day / 1 hari" : zone === "jawa" ? "1–2 hari" : "2–4 hari",
      fee: expressFee,
    },
  ];

  return {
    destination: {
      city: destination.city?.trim() || "-",
      province: destination.province?.trim() || "-",
      postalCode: destination.postalCode?.trim() || "-",
    },
    zone,
    zoneLabel: base.label,
    options,
    defaultService: "reg",
  };
}

export function pickShippingOption(destination: Destination, service?: string | null) {
  const quote = quoteShipping(destination);
  const code = service === "express" ? "express" : "reg";
  const option = quote.options.find((o) => o.code === code) ?? quote.options[0];
  return { quote, option };
}

/** @deprecated prefer pickShippingOption / quoteShipping */
export function shippingFee(destination?: Destination, service?: string | null) {
  if (!destination) return Number(process.env.SHIPPING_FEE || 15000);
  return pickShippingOption(destination, service).option.fee;
}
