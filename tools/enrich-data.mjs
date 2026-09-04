// Round 2: refetch product pages → clean HTML → extract dimensions & materials
// Run: node tools/enrich-data.mjs
import { readFile, writeFile } from "node:fs/promises";

const FILES = ["tools/data/seating-data.json", "tools/data/tables-data.json"];

// --- helpers ---
const decode = (s) =>
  s
    .replace(/&times;/gi, "×")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

const toText = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|tr|h\d|div)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  ).replace(/[ \t]+/g, " ");

// material keywords — searched inside the site's own description text
const MATERIALS = [
  "Oak",
  "Pine",
  "Beech",
  "Walnut",
  "Mahogany",
  "Teak",
  "Rosewood",
  "Elm",
  "Ash",
  "Bamboo",
  "Rattan",
  "Cane",
  "Wicker",
  "Leather",
  "Suede",
  "Velvet",
  "Bouclé",
  "Wool",
  "Linen",
  "Cotton",
  "Brass",
  "Copper",
  "Bronze",
  "Steel",
  "Chrome",
  "Aluminium",
  "Iron",
  "Marble",
  "Travertine",
  "Glass",
  "Lacquer",
  "Veneer",
  "Plywood",
];

function findMaterials(text) {
  const lower = text.toLowerCase();
  const found = MATERIALS.filter((m) => lower.includes(m.toLowerCase()));
  found.sort(
    (a, b) => lower.indexOf(a.toLowerCase()) - lower.indexOf(b.toLowerCase()),
  );
  return found.slice(0, 3).join(" & ") || null; // max 3, ordered by first mention
}

function findDimensions(text) {
  const t = text.replace(/\s+/g, " ");
  const patterns = [
    /(\d{1,3})\s*[×xX]\s*(\d{1,3})(?:\s*[×xX]\s*(\d{1,3}))?\s*cm/, // 58 × 49 × 69 cm
    /H\.?\s*(\d{1,3})\s*cm[\s\S]{0,30}?W\.?\s*(\d{1,3})\s*cm[\s\S]{0,30}?D\.?\s*(\d{1,3})\s*cm/i, // H 69 W 58 D 49
    /(?:H|Height)[^\d]{0,10}(\d{1,3})[\s\S]{0,50}?(?:W|Width)[^\d]{0,10}(\d{1,3})[\s\S]{0,50}?(?:D|Depth|L|Length)[^\d]{0,10}(\d{1,3})/i,
  ];
  for (let i = 0; i < patterns.length; i++) {
    const m = t.match(patterns[i]);
    if (!m) continue;
    if (i === 0)
      return m[3] ? `${m[1]}×${m[2]}×${m[3]} cm` : `${m[1]}×${m[2]} cm`;
    return `${m[2]}×${m[3]}×${m[1]} cm`; // H-W-D → W×D×H
  }
  return null;
}

// --- main ---
for (const file of FILES) {
  const data = JSON.parse(await readFile(file, "utf8"));
  let dimsFilled = 0,
    matFilled = 0;

  for (const r of data) {
    // clean description + price regardless
    if (r.description)
      r.description = toText(r.description).replace(/\s+/g, " ").trim();
    if (typeof r.price === "string")
      r.price = Number(r.price.replace(/[^\d.]/g, "")) || null;

    const needsFetch = !r.material || !r.dimensions;
    if (!needsFetch || !r.url) continue;

    try {
      const res = await fetch(r.url, {
        headers: { "User-Agent": "Mozilla/5.0 (educational project)" },
      });
      const text = toText(await res.text());
      if (!r.material) {
        r.material = findMaterials(text);
        if (r.material) matFilled++;
      }
      if (!r.dimensions) {
        r.dimensions = findDimensions(text);
        if (r.dimensions) dimsFilled++;
      }
      console.log(r.material || r.dimensions ? "✅" : "—", r.name);
      await new Promise((res2) => setTimeout(res2, 250)); // polite delay
    } catch (e) {
      console.log("❌", r.url, e.message);
    }
  }

  await writeFile(file, JSON.stringify(data, null, 1));
  console.log(
    `\n${file}: material filled ${matFilled}, dimensions filled ${dimsFilled}`,
  );
}
