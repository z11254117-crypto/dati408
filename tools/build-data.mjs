// 把 408exam/out 的题目 JSON 汇总成 js/data.js
import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = process.env.DATA_SRC || join(ROOT, "..", "408exam", "out2");

const files = (await readdir(SRC)).filter((f) => f.endsWith(".json")).sort();
const items = [];
for (const f of files) {
  let data = JSON.parse(await readFile(join(SRC, f), "utf8"));
  if (!Array.isArray(data)) data = data.items || data.questions || [data];
  for (const it of data) {
    if (!it || typeof it !== "object" || it.qno == null || it.year == null) continue;
    items.push({
      year: Number(it.year),
      qno: Number(it.qno),
      subject: String(it.subject || ""),
      type: String(it.type || ""),
      title: String(it.title || it.type || ""),
      score: it.score ? String(it.score) : "",
      budgetMin: it.budgetMin ? String(it.budgetMin) : "",
      detail: String(it.detail || ""),
      kp: Array.isArray(it.kp) ? it.kp.map(String) : [],
      answerKey: (it.answerKey || []).map(String),
      mustWrite: (it.mustWrite || []).map(String),
      skip: (it.skip || []).map(String),
      pitfalls: (it.pitfalls || []).map(String),
    });
  }
}
items.sort((a, b) => (a.year - b.year) || (a.qno - b.qno));

const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
const kpCount = new Map();
for (const it of items) for (const k of it.kp) kpCount.set(k, (kpCount.get(k) || 0) + 1);
const topKp = [...kpCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

const missing = items.filter((i) => !i.answerKey.length);
if (missing.length) console.warn("警告：无答案要点的题", missing.map((m) => m.year + "-" + m.qno).join(","));

const META = {
  range: years.length ? years[years.length - 1] + "–" + years[0] : "",
  years,
  topKp: topKp.slice(0, 14),
  total: items.length,
  builtAt: new Date().toISOString().slice(0, 10),
};

const out = [
  "/* 自动生成，勿手改：由 tools/build-data.mjs 从 408exam/out 汇总 */",
  "export const QUESTIONS = " + JSON.stringify(items) + ";",
  "export const META = " + JSON.stringify(META) + ";",
  "",
].join("\n");

await writeFile(join(ROOT, "js", "data.js"), out);
console.log("data.js 写入完成 · 题目 " + items.length + " 道 · 年份 " + years.length + " · 考点 " + kpCount.size + " 个");
console.log("范围 " + META.range + " · 首页考点词 " + META.topKp.slice(0, 8).join(" / "));
