export function PageLoading({
  label = "Memuat...",
  variant = "default",
}: {
  label?: string;
  variant?: "default" | "orders" | "profile" | "cart";
}) {
  return (
    <div className="container-store page-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading__panel">
        <div className="page-loading__spinner" aria-hidden />
        <div className="page-loading__copy">
          <p className="page-loading__label">{label}</p>
          <p className="page-loading__hint">Sebentar saja…</p>
        </div>
      </div>

      {variant === "orders" && (
        <div className="page-loading__skeleton" aria-hidden>
          <div className="skel skel--cover" />
          <div className="skel skel--card" />
          <div className="skel skel--card" />
        </div>
      )}

      {variant === "profile" && (
        <div className="page-loading__skeleton" aria-hidden>
          <div className="skel skel--cover" />
          <div className="page-loading__split">
            <div className="skel skel--sheet" />
            <div className="skel skel--side" />
          </div>
        </div>
      )}

      {(variant === "cart" || variant === "default") && (
        <div className="page-loading__skeleton" aria-hidden>
          <div className="skel skel--line skel--w60" />
          <div className="skel skel--card" />
          <div className="skel skel--card" />
        </div>
      )}
    </div>
  );
}
