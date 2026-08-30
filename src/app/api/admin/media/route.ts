import { readdirSync } from "fs";
import path from "path";
import { requireSession, CONTENT_ROLES } from "@/lib/auth";

/**
 * GET /api/admin/media — the site's image library for the CMS image picker.
 * Lists /public/images plus /public/uploads (when it exists). Read-only.
 */

const IMAGE_EXT = /\.(jpe?g|png|webp|svg|gif)$/i;

const SOURCES: { dir: string; prefix: string }[] = [
  { dir: path.join("public", "images"), prefix: "/images" },
  { dir: path.join("public", "uploads"), prefix: "/uploads" },
];

export async function GET() {
  try {
    await requireSession(CONTENT_ROLES);

    const items: { url: string; name: string }[] = [];
    for (const source of SOURCES) {
      let entries;
      try {
        entries = readdirSync(path.join(process.cwd(), source.dir), { withFileTypes: true });
      } catch {
        continue; // directory missing (e.g. no uploads yet)
      }
      for (const entry of entries) {
        if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
          items.push({ url: `${source.prefix}/${entry.name}`, name: entry.name });
        }
      }
    }
    items.sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({ items });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load the media library." }, { status: 500 });
  }
}
