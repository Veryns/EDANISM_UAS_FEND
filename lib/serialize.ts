/* eslint-disable @typescript-eslint/no-explicit-any */
export function flatMenu(m: any) {
  const { store, ...rest } = m;
  return { ...rest, store_nama: store?.nama ?? null, store_alamat: store?.alamat ?? null };
}

export async function jsonBody(req: Request): Promise<any> {
  return (await req.json().catch(() => ({}))) || {};
}