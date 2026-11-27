import type { Testimonial } from "@/lib/home";

export default function TestimonialCard({ t, slot = 0 }: { t: Testimonial; slot?: number }) {
  const n = Math.max(0, Math.min(5, Number(t.stars) || 5));
  const label = t.target_nama ? (t.target_type === "menu" ? "Menu: " : "Toko: ") + t.target_nama : "";
  return (
    <article className={"pj-rv pj-rv-" + slot}>
      <div className="pj-rv-stars">{"★".repeat(n) + "☆".repeat(5 - n)}</div>
      <p className="pj-rv-name">{t.nama}</p>
      {label && <p className="pj-rv-pill">{label}</p>}
      <p className={"pj-rv-text" + (label ? "" : " nopill")}>{t.ulasan}</p>
      <p className="pj-rv-when">{t.waktu}</p>
    </article>
  );
}