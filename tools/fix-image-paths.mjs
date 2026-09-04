// Maps wrong image paths in db.json to REAL files on disk (fuzzy match).
// Run: node tools/fix-image-paths.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";

const DIR = "src/assets/images/products";

// normalize: lowercase, & → and, underscores/dots → dashes, strip non-alnum
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_\.]/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

const files = await readdir(DIR);
// index: normalized base name (without -N suffix) → real file names
const byBase = new Map();
for (const f of files) {
  const m = f.match(/^(.*)-(\d)\.(jpe?g|png|webp)$/i);
  if (!m) continue;
  const base = norm(m[1]);
  if (!byBase.has(base)) byBase.set(base, []);
  byBase.get(base).push(f);
}

const db = JSON.parse(await readFile("db.json", "utf8"));
let fixed = 0,
  still = 0;

for (const p of db.products) {
  p.images = p.images.map((img) => {
    const name = img.split("/").pop();
    const m = name.match(/^(.*)-(\d)\.(jpe?g|png|webp)$/i);
    if (!m) return img;
    const candidates = byBase.get(norm(m[1]));
    if (!candidates) {
      still++;
      return img;
    }
    // same angle number must exist; otherwise take angle -1
    const wanted = `-${m[2]}.`;
    const hit = candidates.find((c) => c.includes(wanted)) ?? candidates[0];
    if (hit !== name) fixed++;
    return `/src/assets/images/products/${hit}`;
  });
}

await writeFile("db.json", JSON.stringify(db, null, 2));
console.log(`fixed: ${fixed} | still missing: ${still}`);
