"use client";

import { useEffect, useId, useRef, useState } from "react";

type SuggestItem = {
  value: string;
  hint?: string;
  brand?: string;
  category?: string;
  subcategory?: string | null;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPick?: (item: SuggestItem) => void;
  field: "name" | "brand";
  placeholder?: string;
  required?: boolean;
  hint?: React.ReactNode;
};

export function AdminSuggestInput({
  label,
  value,
  onChange,
  onPick,
  field,
  placeholder,
  required,
  hint,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLLabelElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/suggest?field=${field}&q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items?: SuggestItem[] };
        const next = data.items || [];
        setItems(next);
        setActive(0);
        setOpen(next.length > 0);
      } catch {
        /* ignore */
      }
    }, 180);

    return () => window.clearTimeout(t);
  }, [value, field]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (item: SuggestItem) => {
    onChange(item.value);
    onPick?.(item);
    setOpen(false);
  };

  return (
    <label className="admin-suggest" ref={wrapRef}>
      <span>{label}</span>
      <div className="admin-suggest__box">
        <input
          className="admin-input"
          value={value}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || !items.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + items.length) % items.length);
            } else if (e.key === "Enter" && items[active]) {
              e.preventDefault();
              pick(items[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {open && items.length > 0 && (
          <ul id={listId} className="admin-suggest__list" role="listbox">
            {items.map((item, i) => (
              <li key={`${item.value}-${item.hint || ""}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`admin-suggest__item${i === active ? " is-active" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item)}
                >
                  <strong>{item.value}</strong>
                  {item.hint ? <em>{item.hint}</em> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint}
    </label>
  );
}
