"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { formatDate, formatIDR } from "@/lib/format";

type Member = {
  id: number;
  email: string;
  name: string;
  phone: string;
  city: string;
  province: string;
  createdAt: string;
  orderCount: number;
  spent: number;
};

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (query = q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const res = await fetch(`/api/admin/members?${params}`, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setMembers(data.members);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const spent = members.reduce((sum, m) => sum + m.spent, 0);
    const buyers = members.filter((m) => m.orderCount > 0).length;
    return { total: members.length, buyers, spent };
  }, [members]);

  return (
    <div className="admin-list-page">
      <div className="admin-page-bar">
        <p className="admin-page-bar__desc">
          Daftar akun member dan total belanja.
        </p>
      </div>

      {!loading && (
        <div className="admin-products__summary">
          <div className="admin-mini-stat">
            <em>Member</em>
            <strong>{summary.total}</strong>
          </div>
          <div className="admin-mini-stat">
            <em>Pernah belanja</em>
            <strong>{summary.buyers}</strong>
          </div>
          <div className="admin-mini-stat">
            <em>Total belanja</em>
            <strong className="admin-mini-stat__price">{formatIDR(summary.spent)}</strong>
          </div>
        </div>
      )}

      <div className="admin-filters">
        <form
          className="admin-search"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <Search size={15} strokeWidth={1.9} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, email, atau telepon…"
          />
        </form>
        <button type="button" className="admin-btn" onClick={() => void load()}>
          Cari
        </button>
      </div>

      {loading ? (
        <PageLoading label="Memuat member" variant="orders" />
      ) : (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>Daftar member</h2>
              <p>
                {members.length} akun
                {q.trim() ? ` · “${q.trim()}”` : ""}
              </p>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="admin-empty">
              <Users size={22} strokeWidth={1.7} />
              <strong>Belum ada member</strong>
              <p>Akun yang mendaftar akan muncul di sini.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Kontak</th>
                    <th>Lokasi</th>
                    <th>Pesanan</th>
                    <th>Total belanja</th>
                    <th>Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const initial = (m.name?.trim()?.[0] || m.email?.[0] || "M").toUpperCase();
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="admin-member-cell">
                            <span className="admin-member-cell__avatar" aria-hidden>
                              {initial}
                            </span>
                            <span className="admin-stack-cell">
                              <strong>{m.name || "Tanpa nama"}</strong>
                              <em>{m.email}</em>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-cell-strong">{m.phone || "—"}</span>
                        </td>
                        <td>
                          <span className="admin-cell-muted">
                            {[m.city, m.province].filter(Boolean).join(", ") || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="admin-stock is-ok">{m.orderCount}</span>
                        </td>
                        <td>
                          <span className="admin-cell-strong">{formatIDR(m.spent)}</span>
                        </td>
                        <td>
                          <span className="admin-cell-muted" title={formatDate(m.createdAt)}>
                            {shortDate(m.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
