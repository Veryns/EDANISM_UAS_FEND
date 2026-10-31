import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleUpload } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  return handleUpload(req, "store");
}