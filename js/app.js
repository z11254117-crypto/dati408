/* 408 大题答案 · 前端逻辑 */
import { QUESTIONS, META } from "./data.js";

var SUBJECTS = ["数据结构", "计算机组成原理", "操作系统", "计算机网络"];
var SUBJ_CLASS = { "数据结构": "s1", "计算机组成原理": "s2", "操作系统": "s3", "计算机网络": "s4" };
var SUBJ_ALIAS = {
  "数据结构": ["数据结构", "数构", "ds"],
  "计算机组成原理": ["计算机组成原理", "组成原理", "组原", "计组", "co"],
  "操作系统": ["操作系统", "系统", "os"],
  "计算机网络": ["计算机网络", "计网", "网络", "cn"],
};

var state = { q: "", year: "all", subject: "all", open: {} };

var el = {
  q: document.getElementById("q"),
  clear: document.getElementById("clearBtn"),
  suggests: document.getElementById("suggests"),
  years: document.getElementById("yearRow"),
  subjects: document.getElementById("subjectRow"),
  count: document.getElementById("count"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),
  expandAll: document.getElementById("expandAll"),
  collapseAll: document.getElementById("collapseAll"),
  random: document.getElementById("randomBtn"),
  foot: document.getElementById("footNote"),
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function norm(s) { return String(s == null ? "" : s).toLowerCase(); }

/* 每题的可检索文本（年份/学科/名字/考点/正文全都进来） */
var INDEX = QUESTIONS.map(function (it) {
  var kp = (it.kp || []).join(" ");
  var parts = [it.year, it.qno, it.subject, it.type, it.title, kp, it.score]
    .concat(it.answerKey || [], it.mustWrite || [], it.skip || [], it.pitfalls || [], [it.detail || ""]);
  return norm(parts.join(" \u0001 "));
});

/* 搜索词展开：学科别名、年份、题号都算命中 */
function expandTokens(q) {
  var raw = norm(q).split(/\s+/).filter(Boolean);
  var out = [];
  raw.forEach(function (t) {
    if (/^(20\d{2})$/.test(t)) { out.push([t, t + "年"]); return; }
    var alias = null;
    for (var i = 0; i < SUBJECTS.length; i++) {
      var list = SUBJ_ALIAS[SUBJECTS[i]];
      for (var j = 0; j < list.length; j++) { if (list[j] === t) { alias = list; break; } }
      if (alias) break;
    }
    out.push(alias || [t]);
  });
  return out;
}

function matches(i) {
  var it = QUESTIONS[i];
  if (state.year !== "all" && String(it.year) !== String(state.year)) return false;
  if (state.subject !== "all" && it.subject !== state.subject) return false;
  var tokens = expandTokens(state.q);
  if (!tokens.length) return true;
  var hay = INDEX[i];
  return tokens.every(function (alts) {
    return alts.some(function (t) { return hay.indexOf(t) >= 0; });
  });
}

function activeTokens() {
  var q = state.q.trim();
  if (!q) return [];
  return q.split(/\s+/).filter(Boolean).filter(function (t) { return t.length >= 1; });
}

function highlight(text) {
  var safe = esc(text);
  var toks = activeTokens();
  if (!toks.length) return safe;
  var sorted = toks.slice().sort(function (a, b) { return b.length - a.length; });
  sorted.forEach(function (t) {
    var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    safe = safe.replace(re, "<mark>$1</mark>");
  });
  return safe;
}

function li(items) {
  if (!items || !items.length) return "";
  return "<ul>" + items.map(function (x) { return "<li>" + highlight(x) + "</li>"; }).join("") + "</ul>";
}

function cardHtml(i) {
  var it = QUESTIONS[i];
  var cls = SUBJ_CLASS[it.subject] || "";
  var isOpen = !!state.open[i];
  var head = ''
    + '<button class="card-head" data-toggle="' + i + '" aria-expanded="' + isOpen + '">'
    +   '<span class="head-top">'
    +     '<span class="idx">' + it.year + " · " + it.qno + '</span>'
    +     '<span class="subj ' + cls + '">' + esc(it.subject) + '</span>'
    +     (isOpen ? '' : '<span class="chev">展开 ▾</span>')
    +   '</span>'
    +   '<div class="card-title">' + highlight(it.title || it.type || "") + '</div>'
    +   '<div class="head-sub">'
    +     '<span>' + highlight(it.type || "") + '</span>'
    +     (it.score ? '<span>分值 ' + esc(it.score) + '</span>' : '')
    +     (it.budgetMin ? '<span>目标 ' + esc(it.budgetMin) + ' 分钟</span>' : '')
    +   '</div>'
    + '</button>';

  var answer = '<div class="answer">'
    + '<div class="sec-label">答案</div>'
    + li(it.answerKey)
    + (isOpen ? detailsHtml(it) : "")
    + '</div>';

  return '<article class="card' + (isOpen ? " open" : "") + '" id="c' + i + '">' + head + answer + '</article>';
}

function detailsHtml(it) {
  var h = '<div class="details">';
  if (it.detail) {
    h += '<div class="sec-label">详解</div><p class="detail-text">' + highlight(it.detail) + '</p>';
  }
  if (it.mustWrite && it.mustWrite.length) {
    h += '<div class="sec-label green">怎么写才给分</div>' + li(it.mustWrite);
  }
  if (it.skip && it.skip.length) {
    h += '<div class="sec-label warn">这些别写（浪费时间）</div>' + li(it.skip);
  }
  if (it.pitfalls && it.pitfalls.length) {
    h += '<div class="sec-label warn">易失分点</div>' + li(it.pitfalls);
  }
  h += '</div>';
  if (it.kp && it.kp.length) {
    h += '<div class="kp-row">' + it.kp.map(function (k) {
      return '<button class="kp" data-kp="' + esc(k) + '"># ' + esc(k) + '</button>';
    }).join("") + '</div>';
  }
  return h;
}

function visibleIndexes() {
  var out = [];
  for (var i = 0; i < QUESTIONS.length; i++) if (matches(i)) out.push(i);
  return out;
}

function render() {
  var idxs = visibleIndexes();
  el.count.textContent = "共 " + idxs.length + " 题" + (idxs.length !== QUESTIONS.length ? "（全部 " + QUESTIONS.length + " 题）" : "");
  el.list.innerHTML = idxs.map(cardHtml).join("");
  el.empty.hidden = idxs.length !== 0;
}

function renderChips() {
  var years = META.years || [];
  el.years.innerHTML = ['<button class="chip" data-year="all" aria-pressed="' + (state.year === "all") + '">全部年份</button>']
    .concat(years.map(function (y) {
      return '<button class="chip" data-year="' + y + '" aria-pressed="' + (String(state.year) === String(y)) + '">' + y + "</button>";
    })).join("");
  el.subjects.innerHTML = ['<button class="chip" data-subject="all" aria-pressed="' + (state.subject === "all") + '">全部学科</button>']
    .concat(SUBJECTS.map(function (s) {
      var c = SUBJ_CLASS[s];
      return '<button class="chip ' + c + '" data-subject="' + s + '" aria-pressed="' + (state.subject === s) + '">' + s + "</button>";
    })).join("");
}

function renderSuggests() {
  var kps = META.topKp || [];
  el.suggests.innerHTML = kps.slice(0, 10).map(function (k) {
    return '<button data-suggest="' + esc(k) + '">' + esc(k) + "</button>";
  }).join("");
}

function setQuery(v) {
  state.q = v;
  el.q.value = v;
  el.clear.hidden = !v;
  render();
}

document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-toggle],[data-year],[data-subject],[data-suggest],[data-kp]");
  if (!t) return;
  if (t.dataset.toggle != null) {
    var i = t.dataset.toggle;
    state.open[i] = !state.open[i];
    var card = document.getElementById("c" + i);
    if (card) {
      var wasOpen = !state.open[i];
      card.outerHTML = cardHtml(Number(i));
      var next = document.getElementById("c" + i);
      if (wasOpen && next) next.scrollIntoView({ block: "nearest" });
    }
    return;
  }
  if (t.dataset.year) { state.year = t.dataset.year === "all" ? "all" : t.dataset.year; renderChips(); render(); return; }
  if (t.dataset.subject) { state.subject = t.dataset.subject; renderChips(); render(); return; }
  if (t.dataset.suggest) { setQuery(t.dataset.suggest); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (t.dataset.kp) { setQuery(t.dataset.kp); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
});

el.q.addEventListener("input", function () {
  state.q = el.q.value;
  el.clear.hidden = !el.q.value;
  render();
});
el.clear.addEventListener("click", function () { setQuery(""); el.q.focus(); });
el.expandAll.addEventListener("click", function () {
  visibleIndexes().forEach(function (i) { state.open[i] = true; });
  render();
});
el.collapseAll.addEventListener("click", function () { state.open = {}; render(); });
el.random.addEventListener("click", function () {
  var idxs = visibleIndexes();
  if (!idxs.length) return;
  var pick = idxs[Math.floor(Math.random() * idxs.length)];
  state.open[pick] = false;
  render();
  var card = document.getElementById("c" + pick);
  if (card) card.scrollIntoView({ block: "center" });
});

renderChips();
renderSuggests();
render();
el.foot.textContent = "共 " + QUESTIONS.length + " 题 · " + (META.range || "") + " · 数据来自历年官方参考答案与解析，离线可用";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
