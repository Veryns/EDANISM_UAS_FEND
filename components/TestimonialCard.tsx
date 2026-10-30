import type { Testimonial } from "@/lib/home";

export default function TestimonialCard({ t }: { t: Testimonial }) {
  const n = Number(t.stars) || 5;
  const label = t.target_nama ? (t.target_type === "menu" ? "Menu: " : "Toko: ") + t.target_nama : "";
  return (
    <div className="testi-card">
      <div className="stars">{"★".repeat(n) + "☆".repeat(5 - n)}</div>
      <div className="name">{t.nama}</div>
      {label && <div className="pill pill-mustard" style={{ marginBottom: 8 }}>{label}</div>}
      <p>{t.ulasan}</p>
      <div className="when">{t.waktu}</div>
    </div>
  );
}