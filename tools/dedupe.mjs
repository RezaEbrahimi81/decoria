import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node tools/dedupe.mjs tools/data/<name>-data.json");
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, "utf8"));
const seen = new Set();

const clean = data.filter((r) => {
  const key = (r.name || "").trim().toLowerCase();
  if (!key) return false; // رکورد بی‌اسم رو کلاً بیخیال
  if (seen.has(key)) return false; // تکراریه
  seen.add(key);
  return true;
});

writeFileSync(file, JSON.stringify(clean, null, 2));
console.log(`dedupe ${file}: ${data.length} → ${clean.length}`);
