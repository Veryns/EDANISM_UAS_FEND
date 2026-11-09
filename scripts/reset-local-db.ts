import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data");
for (const f of ["local.db", "local.db-wal", "local.db-shm"]) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) fs.rmSync(p);
}
console.log("Database lokal dihapus.");
