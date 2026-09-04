// Checks that every image path in db.json points to a real file on disk.
// Run: node tools/validate-images.mjs
import { readdir, readFile } from "node:fs/promises";

const db = JSON.parse(await readFile("db.json", "utf8"));
const files = new Set(
  (await readdir("src/assets/images/products")).map(
    (f) => `/src/assets/images/products/${f}`,
  ),
);

let broken = 0;
for (const p of db.products) {
  for (const img of p.images) {
    if (!files.has(img)) {
      console.log("❌ missing:", img);
      broken++;
    }
  }
}

console.log(broken ? `${broken} broken paths found` : "✅ all image paths OK");
