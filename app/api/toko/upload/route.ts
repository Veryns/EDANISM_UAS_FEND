import { NextRequest, NextResponse } from "next/server";
import { requireToko } from "@/lib/auth";
import { handleUpload } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  return handleUpload(req, "toko");
}