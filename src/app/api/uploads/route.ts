import { NextRequest } from "next/server";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { limit, ipFromRequest, tooManyRequests } from "@/lib/rate-limit";

const MAX_FILES = 3;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/** Allowed mime types → safe file extensions. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function bad(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

/**
 * Public upload endpoint for the service-request wizard (photos/video of the
 * problem) and the careers form (resume handled by its own page if needed).
 * Accepts multipart/form-data with up to 3 files under the "files" key.
 */
export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  if (!limit(`uploads:${ip}`, 10, 60_000)) return tooManyRequests();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Expected multipart/form-data with a 'files' field.");
  }

  const entries = form.getAll("files");
  if (entries.length === 0) return bad("No files were provided.");
  if (entries.length > MAX_FILES) return bad(`You can upload at most ${MAX_FILES} files.`);

  const files: File[] = [];
  for (const entry of entries) {
    if (!(entry instanceof File)) return bad("Invalid form field — expected file uploads only.");
    if (entry.size === 0) return bad("One of the files is empty.");
    if (entry.size > MAX_BYTES) return bad("Each file must be 8 MB or smaller.");
    if (!EXTENSIONS[entry.type]) {
      return bad("Only JPG, PNG, WEBP or HEIC images and MP4 or MOV videos are accepted.");
    }
    files.push(entry);
  }

  try {
    mkdirSync(UPLOAD_DIR, { recursive: true });
    const paths: string[] = [];
    for (const file of files) {
      const name = `${crypto.randomUUID()}${EXTENSIONS[file.type]}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(UPLOAD_DIR, name), buffer);
      paths.push(`/uploads/${name}`);
    }
    return Response.json({ paths });
  } catch (e) {
    console.error("[uploads] write failed", e);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
