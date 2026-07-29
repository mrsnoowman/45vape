import { NextRequest, NextResponse } from "next/server";
import {
  findCityCodeByName,
  findProvinceCodeByName,
  listCities,
  listPostalCodes,
  listProvinces,
} from "@/lib/wilayah";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "provinces";
  const provinceCode =
    req.nextUrl.searchParams.get("provinceCode") ||
    findProvinceCodeByName(req.nextUrl.searchParams.get("province"));
  const cityCode =
    req.nextUrl.searchParams.get("cityCode") ||
    findCityCodeByName(provinceCode, req.nextUrl.searchParams.get("city"));

  if (type === "provinces") {
    return NextResponse.json({ ok: true, provinces: listProvinces() });
  }

  if (type === "cities") {
    if (!provinceCode) {
      return NextResponse.json({ ok: false, message: "Pilih provinsi dulu" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      provinceCode,
      cities: listCities(provinceCode),
    });
  }

  if (type === "postalCodes") {
    if (!cityCode) {
      return NextResponse.json({ ok: false, message: "Pilih kota dulu" }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      cityCode,
      postalCodes: listPostalCodes(cityCode),
    });
  }

  if (type === "resolve") {
    const provinceName = req.nextUrl.searchParams.get("province") || "";
    const cityName = req.nextUrl.searchParams.get("city") || "";
    const postal = req.nextUrl.searchParams.get("postalCode") || "";
    const pCode = findProvinceCodeByName(provinceName);
    const cCode = findCityCodeByName(pCode, cityName);
    const postalCodes = cCode ? listPostalCodes(cCode) : [];
    return NextResponse.json({
      ok: true,
      provinceCode: pCode,
      cityCode: cCode,
      provinces: listProvinces(),
      cities: pCode ? listCities(pCode) : [],
      postalCodes,
      postalCode: postal && postalCodes.includes(postal) ? postal : postalCodes[0] || postal,
    });
  }

  return NextResponse.json({ ok: false, message: "Tipe tidak valid" }, { status: 400 });
}
