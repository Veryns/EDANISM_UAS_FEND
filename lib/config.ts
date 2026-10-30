import fs from "fs";
import path from "path";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "app.db");
export const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(DATA_DIR, "uploads")
  : path.join(process.cwd(), "public", "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });