import { makeCrud } from "@/lib/adminCrud";

export const stores = makeCrud({
  model: "store",
  requiredField: "nama",
  fields: [
    { name: "nama", type: "string", default: "" },
    { name: "alamat", type: "string", default: "" },
    { name: "jam_buka", type: "string", default: "" },
    { name: "jam_tutup", type: "string", default: "" },
    { name: "rating", type: "float", default: 0 },
    { name: "ulasan_count", type: "int", default: 0 },
    { name: "sort_order", type: "int", default: 0 },
    { name: "image_url", type: "string", default: "" },
    { name: "approval_status", type: "string", default: "approved" },
  ],
  beforeDelete: async (storeId, tx) => {
    const menuIds = (await tx.menuItem.findMany({ where: { store_id: storeId }, select: { id: true } })).map(
      (m) => m.id
    );
    if (menuIds.length) {
      await tx.testimonial.deleteMany({ where: { target_type: "menu", target_id: { in: menuIds } } });
      await tx.wishlistItem.deleteMany({ where: { item_type: "menu", item_id: { in: menuIds } } });
    }
    await tx.testimonial.deleteMany({ where: { target_type: "store", target_id: storeId } });
    await tx.wishlistItem.deleteMany({ where: { item_type: "store", item_id: storeId } });
    await tx.menuItem.deleteMany({ where: { store_id: storeId } });
    await tx.user.updateMany({ where: { store_id: storeId }, data: { store_id: null } });
  },
});

export const menu = makeCrud({
  model: "menuItem",
  requiredField: "nama",
  fields: [
    { name: "nama", type: "string", default: "" },
    { name: "deskripsi", type: "string", default: "" },
    { name: "harga", type: "string", default: "" },
    { name: "sort_order", type: "int", default: 0 },
    { name: "store_id", type: "int", default: null, nullable: true },
    { name: "image_url", type: "string", default: "" },
  ],
  beforeDelete: async (menuId, tx) => {
    await tx.testimonial.deleteMany({ where: { target_type: "menu", target_id: menuId } });
    await tx.wishlistItem.deleteMany({ where: { item_type: "menu", item_id: menuId } });
  },
});

export const testimonials = makeCrud({
  model: "testimonial",
  requiredField: "nama",
  fields: [
    { name: "nama", type: "string", default: "" },
    { name: "ulasan", type: "string", default: "" },
    { name: "waktu", type: "string", default: "" },
    { name: "stars", type: "int", default: 5 },
    { name: "sort_order", type: "int", default: 0 },
    { name: "approved", type: "int", default: 0 },
  ],
});

export const faqs = makeCrud({
  model: "faq",
  requiredField: "question",
  fields: [
    { name: "question", type: "string", default: "" },
    { name: "answer", type: "string", default: "" },
    { name: "sort_order", type: "int", default: 0 },
  ],
});