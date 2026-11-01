export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "time" | "number" | "image" | "select" | "store-select";
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  options?: string[];
  optionLabels?: Record<string, string>;
};

export type ListConfig = {
  title: string;
  endpoint: string;
  columns: string[];
  fields: FieldDef[];
};

const t = (name: string, label: string): FieldDef => ({ name, label, type: "text" });
const ta = (name: string, label: string): FieldDef => ({ name, label, type: "textarea" });

export const CONTENT: Record<string, { title: string; fields: FieldDef[] }> = {
  hero: {
    title: "Hero Section",
    fields: [
      t("badge", "Badge"), t("heading", "Heading"), ta("subheading", "Subheading"),
      t("search_placeholder", "Search Placeholder"), t("cta_primary", "Primary Button"), t("cta_secondary", "Secondary Button"),
    ],
  },
  toko_populer: {
    title: "Popular Stores Section",
    fields: [t("heading", "Heading"), ta("subheading", "Subheading"), t("link_text", "Link Label")],
  },
  menu_section: {
    title: "Menu Section",
    fields: [t("heading", "Heading"), ta("subheading", "Subheading")],
  },
  about: {
    title: "About Section",
    fields: [
      t("eyebrow", "Eyebrow Label"), t("heading", "Heading"), ta("description", "Description"),
      t("media_text", "Placeholder Text (tanpa gambar)"),
      { name: "images", label: "Gambar (pilih satu atau lebih)", type: "image" },
      t("pill_1", "Pill 1"), t("pill_2", "Pill 2"), t("pill_3", "Pill 3"),
    ],
  },
  history: {
    title: "History Section",
    fields: [t("heading", "Heading"), ta("text", "Text")],
  },
  testimonial_section: {
    title: "Reviews Section",
    fields: [t("eyebrow", "Eyebrow Label"), t("heading", "Heading"), t("cta", "Review Button Label")],
  },
  cari_toko: {
    title: "Store Search Section",
    fields: [t("eyebrow", "Eyebrow Label"), t("heading", "Heading"), ta("subheading", "Subheading")],
  },
  faq_section: {
    title: "FAQ Section",
    fields: [t("eyebrow", "Eyebrow Label"), t("heading", "Heading")],
  },
  contact: {
    title: "Contact Section",
    fields: [
      t("eyebrow", "Eyebrow Label"), t("heading", "Heading"), ta("note", "Note"),
      t("email", "Email"), t("whatsapp", "WhatsApp"), t("hours", "Service Hours"),
    ],
  },
  footer: {
    title: "Footer",
    fields: [
      t("tagline", "Tagline"), t("social_text", "Social Text"), t("help_email", "Help Email"),
      t("help_whatsapp", "Help WhatsApp"), t("legal_terms_label", "Terms Label"),
      t("legal_privacy_label", "Privacy Label"), t("copyright", "Copyright"),
    ],
  },
  site: {
    title: "Site Settings",
    fields: [t("site_title", "Site Title (tab browser)"), t("logo_text", "Logo Text")],
  },
};

export const LISTS: Record<string, ListConfig> = {
  stores: {
    title: "Toko",
    endpoint: "stores",
    columns: ["image_url", "nama", "alamat", "jam_buka", "status", "approval_status", "rating", "ulasan_count"],
    fields: [
      { name: "nama", label: "Nama Toko", type: "text", required: true },
      { name: "alamat", label: "Alamat", type: "text" },
      { name: "jam_buka", label: "Jam Buka", type: "time", required: true },
      { name: "jam_tutup", label: "Jam Tutup", type: "time", required: true },
      { name: "rating", label: "Rating", type: "number", step: "0.1", min: "0", max: "5" },
      { name: "image_url", label: "Gambar Toko (pilih satu atau lebih)", type: "image" },
      {
        name: "approval_status", label: "Status Approval", type: "select",
        options: ["pending", "approved", "rejected"],
        optionLabels: { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" },
      },
    ],
  },
  menu: {
    title: "Menu",
    endpoint: "menu",
    columns: ["image_url", "nama", "deskripsi", "harga", "store_id"],
    fields: [
      { name: "nama", label: "Nama Menu", type: "text", required: true },
      { name: "deskripsi", label: "Deskripsi", type: "text" },
      { name: "harga", label: "Harga (contoh: Rp 15.000)", type: "text" },
      { name: "image_url", label: "Gambar Menu (pilih satu atau lebih)", type: "image" },
      { name: "store_id", label: "Toko", type: "store-select" },
    ],
  },
  testimonials: {
    title: "Testimoni",
    endpoint: "testimonials",
    columns: ["nama", "ulasan", "waktu", "stars", "approved"],
    fields: [
      { name: "nama", label: "Nama", type: "text", required: true },
      { name: "ulasan", label: "Ulasan", type: "textarea" },
      { name: "waktu", label: "Keterangan Waktu (contoh: 2 hari yang lalu)", type: "text" },
      { name: "stars", label: "Jumlah Bintang (1-5)", type: "number", min: "1", max: "5" },
      {
        name: "approved", label: "Status Approval", type: "select",
        options: ["0", "1"], optionLabels: { "0": "Menunggu Approval", "1": "Disetujui" },
      },
    ],
  },
  faqs: {
    title: "Pertanyaan",
    endpoint: "faqs",
    columns: ["question", "answer"],
    fields: [
      { name: "question", label: "Pertanyaan", type: "text", required: true },
      { name: "answer", label: "Jawaban", type: "textarea" },
    ],
  },
};

export type Section = { kind: "content"; key: string } | { kind: "list"; key: string };

export const TABS: { id: string; label: string; icon: string; sections?: Section[]; approval?: boolean }[] = [
  { id: "hero", label: "Homepage Content", icon: "🏠", sections: [{ kind: "content", key: "hero" }] },
  { id: "toko", label: "Store Directory", icon: "🏪", sections: [{ kind: "content", key: "toko_populer" }, { kind: "list", key: "stores" }] },
  { id: "toko_approval", label: "Store Approvals", icon: "✅", approval: true },
  { id: "menu", label: "Menu Catalog", icon: "🍽️", sections: [{ kind: "content", key: "menu_section" }, { kind: "list", key: "menu" }] },
  { id: "about", label: "About & History", icon: "📖", sections: [{ kind: "content", key: "about" }, { kind: "content", key: "history" }] },
  { id: "testimoni", label: "Customer Reviews", icon: "💬", sections: [{ kind: "content", key: "testimonial_section" }, { kind: "list", key: "testimonials" }] },
  { id: "cari", label: "Store Search Content", icon: "🔍", sections: [{ kind: "content", key: "cari_toko" }] },
  { id: "faq", label: "FAQ Management", icon: "❓", sections: [{ kind: "content", key: "faq_section" }, { kind: "list", key: "faqs" }] },
  { id: "contact", label: "Contact Information", icon: "✉️", sections: [{ kind: "content", key: "contact" }] },
  { id: "footer", label: "Footer Content", icon: "📎", sections: [{ kind: "content", key: "footer" }] },
  { id: "site", label: "Site Settings", icon: "⚙️", sections: [{ kind: "content", key: "site" }] },
];

export function parseImageList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value !== "string" || !value) return [];
  try {
    const p = JSON.parse(value);
    if (Array.isArray(p)) return p.filter(Boolean);
  } catch {}
  return [value];
}