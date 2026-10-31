export const MAX_MENU_IMAGES = 10;

export function cleanMenuBody(body: any) {
  const { nama, harga, deskripsi } = body || {};
  return {
    nama: nama === undefined ? undefined : String(nama).trim(),
    harga: harga === undefined ? undefined : String(harga).trim(),
    deskripsi: deskripsi === undefined ? undefined : String(deskripsi).trim(),
  };
}

// undefined = tidak diubah, null = tidak valid
export function readMenuImages(body: any): string[] | null | undefined {
  const { images, image_url } = body || {};
  let list: any[];
  if (Array.isArray(images)) list = images;
  else if (Array.isArray(image_url)) list = image_url;
  else if (typeof image_url === "string") list = image_url ? [image_url] : [];
  else return undefined;

  const clean = list.filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim());
  if (clean.length > MAX_MENU_IMAGES) return null;
  if (!clean.every((u) => u.startsWith("/uploads/") || u.startsWith("https://"))) return null;
  return clean;
}

export const imagesToColumn = (list: string[]) => (list.length ? JSON.stringify(list) : "");