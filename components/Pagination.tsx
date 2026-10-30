"use client";

export default function Pagination({
  page, total, onChange, light = false,
}: { page: number; total: number; onChange: (p: number) => void; light?: boolean }) {
  if (total <= 1) return null;
  return (
    <div className={"pagination" + (light ? " pagination-light" : "")}>
      <button className="page-btn page-arrow" type="button" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => onChange(page - 1)}>&#8249;</button>
      <span className="page-info">{page} / {total}</span>
      <button className="page-btn page-arrow" type="button" aria-label="Halaman berikutnya" disabled={page === total} onClick={() => onChange(page + 1)}>&#8250;</button>
    </div>
  );
}