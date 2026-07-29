"use client";

import { useEffect, useRef, useState } from "react";

type Option = { code: string; name: string };

type ChangeMeta = { source: "hydrate" | "user" };

type Props = {
  province: string;
  city: string;
  postalCode: string;
  onChange: (
    next: { province: string; city: string; postalCode: string },
    meta: ChangeMeta
  ) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function WilayahSelects({
  province,
  city,
  postalCode,
  onChange,
  disabled,
  idPrefix = "wilayah",
}: Props) {
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [postalCodes, setPostalCodes] = useState<string[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPostal, setLoadingPostal] = useState(false);
  const [ready, setReady] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams({
        type: "resolve",
        province,
        city,
        postalCode,
      });
      const res = await fetch(`/api/wilayah?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (cancelled || !data.ok) return;
      setProvinces(data.provinces || []);
      setCities(data.cities || []);
      setPostalCodes(data.postalCodes || []);
      setProvinceCode(data.provinceCode || "");
      setCityCode(data.cityCode || "");
      setReady(true);

      const nextProvince =
        data.provinces?.find((p: Option) => p.code === data.provinceCode)?.name || province;
      const nextCity = data.cities?.find((c: Option) => c.code === data.cityCode)?.name || city;
      const nextPostal = data.postalCode || postalCode;

      if (nextProvince || nextCity || nextPostal) {
        onChangeRef.current(
          {
            province: nextProvince,
            city: nextCity,
            postalCode: nextPostal,
          },
          { source: "hydrate" }
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProvinceChange = async (code: string) => {
    setProvinceCode(code);
    setCityCode("");
    setCities([]);
    setPostalCodes([]);
    const selected = provinces.find((p) => p.code === code);
    onChange({ province: selected?.name || "", city: "", postalCode: "" }, { source: "user" });
    if (!code) return;

    setLoadingCities(true);
    const res = await fetch(`/api/wilayah?type=cities&provinceCode=${encodeURIComponent(code)}`);
    const data = await res.json();
    setLoadingCities(false);
    if (data.ok) setCities(data.cities || []);
  };

  const onCityChange = async (code: string) => {
    setCityCode(code);
    setPostalCodes([]);
    const selected = cities.find((c) => c.code === code);
    const provinceName = provinces.find((p) => p.code === provinceCode)?.name || province;
    onChange(
      { province: provinceName, city: selected?.name || "", postalCode: "" },
      { source: "user" }
    );
    if (!code) return;

    setLoadingPostal(true);
    const res = await fetch(`/api/wilayah?type=postalCodes&cityCode=${encodeURIComponent(code)}`);
    const data = await res.json();
    setLoadingPostal(false);
    if (!data.ok) return;
    const codes: string[] = data.postalCodes || [];
    setPostalCodes(codes);
    onChange(
      {
        province: provinceName,
        city: selected?.name || "",
        postalCode: codes[0] || "",
      },
      { source: "user" }
    );
  };

  const onPostalChange = (code: string) => {
    const provinceName = provinces.find((p) => p.code === provinceCode)?.name || province;
    const cityName = cities.find((c) => c.code === cityCode)?.name || city;
    onChange({ province: provinceName, city: cityName, postalCode: code }, { source: "user" });
  };

  return (
    <div className="ship-dest__grid wilayah-selects">
      <div>
        <label className="label" htmlFor={`${idPrefix}-province`}>
          Provinsi
        </label>
        <select
          id={`${idPrefix}-province`}
          className="input"
          value={provinceCode}
          disabled={disabled || !ready}
          onChange={(e) => void onProvinceChange(e.target.value)}
        >
          <option value="">{ready ? "Pilih provinsi" : "Memuat..."}</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-city`}>
          Kota / kabupaten
        </label>
        <select
          id={`${idPrefix}-city`}
          className="input"
          value={cityCode}
          disabled={disabled || !provinceCode || loadingCities}
          onChange={(e) => void onCityChange(e.target.value)}
        >
          <option value="">
            {!provinceCode
              ? "Pilih provinsi dulu"
              : loadingCities
                ? "Memuat kota..."
                : "Pilih kota / kabupaten"}
          </option>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-postal`}>
          Kode pos
        </label>
        <select
          id={`${idPrefix}-postal`}
          className="input"
          value={postalCodes.includes(postalCode) ? postalCode : ""}
          disabled={disabled || !cityCode || loadingPostal}
          onChange={(e) => onPostalChange(e.target.value)}
        >
          <option value="">
            {!cityCode
              ? "Pilih kota dulu"
              : loadingPostal
                ? "Memuat kode pos..."
                : postalCodes.length
                  ? "Pilih kode pos"
                  : "Tidak ada kode pos"}
          </option>
          {postalCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
