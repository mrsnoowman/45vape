"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { formatIDR } from "@/lib/format";

type SearchHit = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  minPrice: number;
  hasDiscount: boolean;
};

type HeaderSearchProps = {
  mobile?: boolean;
};

export function HeaderSearch({ mobile = false }: HeaderSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(-1);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (!data.ok) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setActive(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setItems([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goSearch = useCallback(
    (term: string) => {
      const value = term.trim();
      setOpen(false);
      startTransition(() => {
        router.push(value ? `/products?q=${encodeURIComponent(value)}` : "/products");
      });
    },
    [router],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    goSearch(q);
  };

  const showPanel = open && q.trim().length >= 2;
  const empty = !loading && items.length === 0 && q.trim().length >= 2;

  return (
    <div
      ref={rootRef}
      className={`header-search ${mobile ? "header-search--mobile" : ""} ${showPanel ? "is-open" : ""}`}
    >
      <form onSubmit={onSubmit} role="search" className="header-search__form">
        <span className="header-search__leading" aria-hidden>
          <Search size={16} />
        </span>
        <input
          ref={inputRef}
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!showPanel) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, -1));
            } else if (e.key === "Enter" && active >= 0 && items[active]) {
              e.preventDefault();
              setOpen(false);
              router.push(`/product/${items[active].slug}`);
            }
          }}
          placeholder="Cari liquid, pod, mod..."
          aria-label="Cari produk"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          autoComplete="off"
        />
        {q && (
          <button
            type="button"
            className="header-search__clear"
            aria-label="Hapus pencarian"
            onClick={() => {
              setQ("");
              setItems([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        )}
        <button type="submit" className="header-search__submit" aria-label="Cari">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </form>

      {showPanel && (
        <div className="header-search__panel" id={listId} role="listbox">
          <div className="header-search__panel-head">
            <span>
              {loading ? "Mencari…" : empty ? "Tidak ada hasil" : `${total} produk ditemukan`}
            </span>
            {!empty && (
              <button type="button" onClick={() => goSearch(q)}>
                Lihat semua
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {empty ? (
            <div className="header-search__empty">
              <p>Coba kata lain, misalnya “foom”, “pod”, atau “mod”.</p>
              <div className="header-search__chips">
                {["FOOM", "Dotmod", "Liquid", "Pod"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQ(chip);
                      goSearch(chip);
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="header-search__list">
              {items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={`/product/${item.slug}`}
                    className={`header-search__hit ${active === index ? "is-active" : ""}`}
                    role="option"
                    aria-selected={active === index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="header-search__thumb">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </span>
                    <span className="header-search__hit-body">
                      <span className="header-search__hit-brand">
                        {item.brand} · {item.category}
                      </span>
                      <span className="header-search__hit-name">{item.name}</span>
                    </span>
                    <span className="header-search__hit-price">
                      {formatIDR(item.minPrice)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
