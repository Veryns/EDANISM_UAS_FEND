import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const rows = db
    .prepare(
      `SELECT users.id AS user_id, users.nama, users.email, users.created_at,
              stores.id AS store_id, stores.nama AS store_nama, stores.alamat AS store_alamat
       FROM users
       JOIN stores ON stores.id = users.store_id
       WHERE users.role = 'toko' AND users.status = 'pending'
       ORDER BY users.created_at ASC`
    )
    .all();
  return NextResponse.json(rows);
}