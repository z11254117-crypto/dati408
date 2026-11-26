/* 做题记录存储层：全部存在本机 localStorage，不联网 */
export const MARKS = [
  { v: "bad", t: "不会" },
  { v: "fuzzy", t: "模糊" },
  { v: "ok", t: "掌握" },
];
export const MARK_TEXT = { bad: "不会", fuzzy: "模糊", ok: "掌握" };

const K_REC = "dati408.v1.records";
const K_IMGSIZE = "dati408.v1.imageBudget";
const MAX_TOTAL = 4 * 1024 * 1024; // localStorage 大约 5MB，留出余量

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let db = null;
function load() {
  if (!db) db = read(K_REC, {});
  return db;
}
function persist() {
  write(K_REC, db);
}

export function qid(q) {
  return q.year + "-" + q.qno;
}

/** 某题的全部记录，按第几次降序 */
export function attemptsOf(q) {
  const all = load()[qid(q)] || [];
  return all.slice().sort((a, b) => b.n - a.n);
}

export function lastAttempt(q) {
  const list = attemptsOf(q);
  return list[0] || null;
}

export function countOf(q) {
  return (load()[qid(q)] || []).length;
}

export function addAttempt(q, attempt) {
  const all = load();
  const id = qid(q);
  const list = all[id] || [];
  const n = attempt.n || (list.reduce((m, a) => Math.max(m, a.n), 0) + 1);
  const rec = {
    id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    n: n,
    date: attempt.date || new Date().toISOString().slice(0, 10),
    ts: Date.now(),
    subs: attempt.subs || {},
    note: attempt.note || "",
    images: attempt.images || [],
  };
  list.push(rec);
  all[id] = list;
  persist();
  return rec;
}

export function updateAttempt(q, recId, patch) {
  const all = load();
  const id = qid(q);
  const list = all[id] || [];
  const i = list.findIndex((a) => a.id === recId);
  if (i < 0) return null;
  list[i] = Object.assign({}, list[i], patch);
  all[id] = list;
  persist();
  return list[i];
}

export function deleteAttempt(q, recId) {
  const all = load();
  const id = qid(q);
  all[id] = (all[id] || []).filter((a) => a.id !== recId);
  if (!all[id].length) delete all[id];
  persist();
}

/** 所有记录，最新的在前 */
export function allAttempts() {
  const all = load();
  const out = [];
  for (const key of Object.keys(all)) {
    for (const a of all[key]) out.push(Object.assign({ qid: key }, a));
  }
  return out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

/** 某题最近一次的小问状态（用于卡片上的圆点） */
export function latestSubs(q) {
  const a = lastAttempt(q);
  return a ? a.subs || {} : null;
}

/** 每题最近一次的整体状态：bad 优先 */
export function latestMark(q) {
  const a = lastAttempt(q);
  if (!a) return null;
  const vals = Object.values(a.subs || {});
  if (!vals.length) return null;
  if (vals.includes("bad")) return "bad";
  if (vals.includes("fuzzy")) return "fuzzy";
  return "ok";
}

export function stats() {
  const list = allAttempts();
  const s = { total: list.length, bad: 0, fuzzy: 0, ok: 0, images: 0, questions: new Set() };
  for (const a of list) {
    s.images += (a.images || []).length;
    s.questions.add(a.qid);
    const vals = Object.values(a.subs || {});
    if (vals.includes("bad")) s.bad++;
    else if (vals.includes("fuzzy")) s.fuzzy++;
    else if (vals.includes("ok") && vals.length) s.ok++;
  }
  s.questions = s.questions.size;
  return s;
}

export function bytes() {
  const recs = localStorage.getItem(K_REC) || "";
  return recs.length * 2;
}

export function usageText() {
  const kb = Math.round(bytes() / 1024);
  return "本机已用 " + kb + " KB / 约 4096 KB";
}

/** 图片压缩：最长边 1000px，JPEG 0.62，返回 dataURL */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("图片解码失败"));
      img.onload = () => {
        const MAX = 1000;
        let w = img.naturalWidth, h = img.naturalHeight;
        const scale = Math.min(1, MAX / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(c.toDataURL("image/jpeg", 0.62));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function estimateDataUrl(d) {
  return (d ? d.length : 0) * 2;
}

export function canAddImages(existing, incoming) {
  let total = existing.reduce((n, d) => n + estimateDataUrl(d), 0);
  total += incoming.reduce((n, d) => n + estimateDataUrl(d), 0);
  return total + bytes() * 0 + 0 <= MAX_TOTAL ? { ok: true } : { ok: false, limit: MAX_TOTAL };
}

export function exportJSON() {
  return JSON.stringify({ app: "408dati", v: 1, exportedAt: new Date().toISOString(), records: load() }, null, 1);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  const recs = data && data.records ? data.records : data;
  if (!recs || typeof recs !== "object") throw new Error("不是有效的备份文件");
  const all = load();
  let added = 0;
  for (const key of Object.keys(recs)) {
    const list = Array.isArray(recs[key]) ? recs[key] : [];
    all[key] = all[key] || [];
    for (const a of list) {
      if (!a || typeof a !== "object") continue;
      if (all[key].some((x) => x.id === a.id)) continue;
      all[key].push(a);
      added++;
    }
    all[key].sort((x, y) => x.n - y.n);
  }
  persist();
  return added;
}

export function clearAll() {
  localStorage.removeItem(K_REC);
  db = {};
}
