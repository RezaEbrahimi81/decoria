import { readFileSync, writeFileSync } from "node:fs";

const [dbFile, addFile] = process.argv.slice(2);
if (!dbFile || !addFile) {
  console.error("usage: node tools/merge.mjs db.json <agent-output-file>");
  process.exit(1);
}

const db = JSON.parse(readFileSync(dbFile, "utf8"));
const add = JSON.parse(readFileSync(addFile, "utf8"));
if (!add.length) {
  console.log("nothing to merge");
  process.exit(0);
}

const ids = add.map((r) => r.id);
const clash = db.products.some((p) => ids.includes(p.id));
const dupId = ids.length !== new Set(ids).size;

if (clash || dupId) {
  console.error(
    "ABORT: id clash ya duplicate id dakhel batch — aval dorostesh kon",
  );
  process.exit(1);
}

db.products.push(...add);
writeFileSync(dbFile, JSON.stringify(db, null, 2));
console.log(
  `merged ${add.length} records (first id ${Math.min(...ids)}) → total: ${db.products.length}`,
);
