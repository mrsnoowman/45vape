import {
  getDistrictsByBpsRegencyCode,
  getProvinces,
  getRegenciesByBpsProvinceCode,
  getVillagesByBpsDistrictCode,
} from "kode-wilayah-id";

export type WilayahOption = {
  code: string;
  name: string;
};

const ACRONYMS = new Set(["DKI", "DI", "NTB", "NTT", "DIY"]);

/** Tampilkan nama wilayah lebih ramah (Jakarta Selatan, DKI Jakarta, ...) */
export function formatWilayahName(raw: string) {
  let name = raw.trim();
  name = name.replace(/^KOTA ADM\.\s*/i, "");
  name = name.replace(/^KAB\. ADM\.\s*/i, "Kab. Adm. ");
  name = name.replace(/^KOTA\s+/i, "Kota ");
  name = name.replace(/^KAB\.\s*/i, "Kab. ");

  return name
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (word.toLowerCase() === "adm.") return "Adm.";
      if (word.toLowerCase() === "kep.") return "Kep.";
      if (word.toLowerCase() === "kab.") return "Kab.";
      if (word.toLowerCase() === "kota") return "Kota";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^kota adm\.?\s*/i, "")
    .replace(/^kab\.?\s*adm\.?\s*/i, "")
    .replace(/^kota\s+/i, "")
    .replace(/^kab\.?\s*/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function listProvinces(): WilayahOption[] {
  return getProvinces()
    .map((p) => ({ code: p.bps_code, name: formatWilayahName(p.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function listCities(provinceCode: string): WilayahOption[] {
  if (!provinceCode) return [];
  return getRegenciesByBpsProvinceCode(provinceCode)
    .map((r) => ({ code: r.bps_code, name: formatWilayahName(r.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function listPostalCodes(regencyCode: string): string[] {
  if (!regencyCode) return [];
  const posts = new Set<string>();
  for (const district of getDistrictsByBpsRegencyCode(regencyCode)) {
    for (const village of getVillagesByBpsDistrictCode(district.bps_code)) {
      if (village.postal_code) posts.add(String(village.postal_code));
    }
  }
  return [...posts].sort();
}

export function findProvinceCodeByName(name?: string | null) {
  if (!name?.trim()) return "";
  const target = normalizeMatch(name);
  const provinces = listProvinces();
  const exact = provinces.find((p) => normalizeMatch(p.name) === target);
  if (exact) return exact.code;
  const partial = provinces.find(
    (p) => normalizeMatch(p.name).includes(target) || target.includes(normalizeMatch(p.name))
  );
  return partial?.code || "";
}

export function findCityCodeByName(provinceCode: string, name?: string | null) {
  if (!provinceCode || !name?.trim()) return "";
  const target = normalizeMatch(name);
  const cities = listCities(provinceCode);
  const exact = cities.find((c) => normalizeMatch(c.name) === target);
  if (exact) return exact.code;
  const partial = cities.find(
    (c) => normalizeMatch(c.name).includes(target) || target.includes(normalizeMatch(c.name))
  );
  return partial?.code || "";
}

export function resolveWilayahSelection(input: {
  province?: string | null;
  city?: string | null;
  postalCode?: string | null;
}) {
  const provinceCode = findProvinceCodeByName(input.province);
  const cityCode = findCityCodeByName(provinceCode, input.city);
  const postalCodes = cityCode ? listPostalCodes(cityCode) : [];
  const postalCode =
    input.postalCode && postalCodes.includes(input.postalCode)
      ? input.postalCode
      : postalCodes[0] || input.postalCode || "";

  return {
    provinceCode,
    cityCode,
    province: provinceCode
      ? listProvinces().find((p) => p.code === provinceCode)?.name || ""
      : input.province || "",
    city: cityCode ? listCities(provinceCode).find((c) => c.code === cityCode)?.name || "" : input.city || "",
    postalCode,
    postalCodes,
  };
}
