// 数据自检：题目数量、字段完整性、搜索索引可用性
import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const mod = await import(pathToFileURL(join(ROOT, "js", "data.js")).href);
const { QUESTIONS, META } = mod;

test("题目总数与年份覆盖", () => {
  assert.equal(QUESTIONS.length, 126, "应为 18 年 × 7 题");
  assert.equal(new Set(QUESTIONS.map((q) => q.year)).size, 18);
  for (const y of META.years) {
    const n = QUESTIONS.filter((q) => q.year === y).length;
    assert.equal(n, 7, y + " 年应有 7 题");
  }
});

test("每题关键字段齐全", () => {
  for (const q of QUESTIONS) {
    const id = q.year + "-" + q.qno;
    assert.ok(q.subject, id + " 缺学科");
    assert.ok(q.type, id + " 缺题型");
    assert.ok(q.title && q.title.length >= 4, id + " 缺题目名");
    assert.ok(Array.isArray(q.kp) && q.kp.length >= 2, id + " 考点少于 2 个");
    assert.ok(q.detail && q.detail.length >= 20, id + " 缺详解");
    assert.ok(Array.isArray(q.subs) && q.subs.length >= 1, id + " 缺小问结构");
    assert.ok(q.subs.length <= 8, id + " 小问过多，可能拆错了");
    for (const sp of q.subs) {
      assert.ok(sp.label, id + " 小问缺编号");
      assert.ok(sp.hint && sp.hint.length >= 2, id + " 小问缺提问说明");
    }
    assert.ok(q.answerKey.length >= 1, id + " 缺答案要点");
    assert.ok(q.mustWrite.length >= 1, id + " 缺书写要点");
    assert.ok(q.budgetMin && Number(q.budgetMin) > 0, id + " 缺目标用时");
    assert.ok(q.qno >= 41 && q.qno <= 47, id + " 题号越界");
    assert.ok(["数据结构", "计算机组成原理", "操作系统", "计算机网络"].includes(q.subject), id + " 学科名异常");
  }
});

test("题目名不重复且不是泛称", () => {
  const titles = QUESTIONS.map((q) => q.title);
  assert.equal(new Set(titles).size, titles.length, "存在重名题目");
  const banned = ["算法设计题", "计算题", "综合题", "简答题"];
  for (const q of QUESTIONS) {
    for (const b of banned) {
      assert.notEqual(q.title.trim(), b, q.year + "-" + q.qno + " 题目名仍是泛称");
    }
  }
});

test("小问结构可点选", () => {
  const total = QUESTIONS.reduce((n, q) => n + q.subs.length, 0);
  assert.ok(total >= 200, "小问总数偏少：" + total);
  const single = QUESTIONS.filter((q) => q.subs.length === 1 && q.subs[0].label === "本题").length;
  assert.ok(single <= 40, "整题一问的数量偏多：" + single);
});

test("考点词可用于搜索", () => {
  assert.ok(META.topKp.length >= 8, "考点词太少");
  const allKp = new Set(QUESTIONS.flatMap((q) => q.kp));
  assert.ok(allKp.size >= 60, "考点种类太少：" + allKp.size);
  for (const k of META.topKp) assert.ok(allKp.has(k), "首页考点词不在数据里: " + k);
});
