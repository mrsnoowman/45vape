"use client";

import Image from "next/image";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useUiStore } from "@/store/ui-store";

export function ToastStack() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone || "info"}`}>
          <span className="toast__icon">
            {t.tone === "success" ? (
              <CheckCircle2 size={18} />
            ) : t.tone === "error" ? (
              <XCircle size={18} />
            ) : (
              <Info size={18} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="toast__title">{t.title}</div>
            {t.subtitle && <div className="toast__sub">{t.subtitle}</div>}
          </div>
          <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Tutup">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function FlyToCartLayer() {
  const items = useUiStore((s) => s.flyItems);

  return (
    <div className="fly-layer" aria-hidden>
      {items.map((item) => (
        <div
          key={item.id}
          className="fly-item"
          style={
            {
              "--from-x": `${item.fromX}px`,
              "--from-y": `${item.fromY}px`,
            } as React.CSSProperties
          }
        >
          <Image src={item.image} alt="" width={56} height={56} className="object-contain" />
        </div>
      ))}
    </div>
  );
}
