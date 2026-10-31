import { NextRequest } from "next/server";
import { setTokoStatus } from "@/lib/tokoPending";

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  return setTokoStatus(req, ctx, "rejected");
}