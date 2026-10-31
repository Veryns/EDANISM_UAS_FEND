import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function handleUpload(req: NextRequest, prefix: string) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Tidak ada file yang diupload." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Tidak ada file yang diupload." }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Hanya file JPG, PNG, atau WEBP yang diizinkan." }, { status: 400 });
  }
  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 3MB." }, { status: 400 });
  }
  const name = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: "/uploads/" + name });
}