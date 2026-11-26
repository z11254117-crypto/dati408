/* 408 大题答案 · 前端逻辑（题库 + 做题记录） */
import { QUESTIONS, META } from "./data.js";
import * as S from "./store.js";

var SUBJECTS = ["数据结构", "计算机组成原理", "操作系统", "计算机网络"];
var SUBJ_CLASS = { "数据结构": "s1", "计算机组成原理": "s2", "操作系统": "s3", "计算机网络": "s4" };
var SUBJ_ALIAS = {
  "数据结构": ["数据结构", "数构", "ds"],
  "计算机组成原理": ["计算机组成原理", "组成原理", "组原", "计组", "co"],
  "操作系统": ["操作系统", "系统", "os"],
  "计算机网络": ["计算机网络", "计网", "网络", "cn"],
};
var MARK_FILTERS = [
  { v: "all", t: "全部" },
  { v: "none", t: "没做过" },
  { v: "bad", t: "不会" },
  { v: "fuzzy", t: "模糊" },
  { v: "ok", t: "掌握" },
  { v: "done", t: "做过的" }
];

var state = { q: "", year: "all", subject: "all", mark: "all", open: {}, view: "library", recFilter: "all" };
var editing = null; // { qIndex, recId }

var el = {};
["q","clearBtn","suggests","yearRow","subjectRow","markRow","count","list","empty","expandAll","collapseAll",
 "randomBtn","footNote","tabbar","recBadge","viewLibrary","viewRecords","recStats","recFilter","recList","recEmpty",
 "overlay","sheet","sheetBody","fileInput","importInput","toast","brandName","backupBtn"].forEach(function (id) { el[id] = document.getElementById(id); });

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function norm(s) { return String(s == null ? "" : s).toLowerCase(); }

var INDEX = QUESTIONS.map(function (it) {
  var kp = (it.kp || []).join(" ");
  var parts = [it.year, it.qno, it.subject, it.type, it.title, kp, it.score]
    .concat(it.answerKey || [], it.mustWrite || [], it.skip || [], it.pitfalls || [], [it.detail || ""]);
  return norm(parts.join(" \u0001 "));
});

function expandTokens(query) {
  var raw = norm(query).split(/\s+/).filter(Boolean);
  return raw.map(function (t) {
    if (/^(20\d{2})$/.test(t)) return [t];
    for (var i = 0; i < SUBJECTS.length; i++) {
      if (SUBJ_ALIAS[SUBJECTS[i]].indexOf(t) >= 0) return SUBJ_ALIAS[SUBJECTS[i]];
    }
    return [t];
  });
}
function markGroup(q) {
  var m = S.latestMark(q);
  if (!m) return S.countOf(q) > 0 ? "fuzzy" : "none";
  return m;
}
function matches(i) {
  var it = QUESTIONS[i];
  if (state.year !== "all" && String(it.year) !== String(state.year)) return false;
  if (state.subject !== "all" && it.subject !== state.subject) return false;
  if (state.mark !== "all") {
    var n = S.countOf(it);
    var g = markGroup(it);
    if (state.mark === "none" && n > 0) return false;
    if (state.mark === "done" && n === 0) return false;
    if (state.mark !== "none" && state.mark !== "done" && g !== state.mark) return false;
  }
  var tokens = expandTokens(state.q);
  if (!tokens.length) return true;
  var hay = INDEX[i];
  return tokens.every(function (alts) {
    return alts.some(function (t) { return hay.indexOf(t) >= 0; });
  });
}
function activeTokens() {
  var q = state.q.trim();
  return q ? q.split(/\s+/).filter(Boolean) : [];
}
function highlight(text) {
  var raw = String(text == null ? "" : text);
  var toks = activeTokens();
  if (!toks.length) return esc(raw);
  var pat = toks
    .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
    .sort(function (a, b) { return b.length - a.length; })
    .join("|");
  var re = new RegExp("(" + pat + ")", "gi");
  var out = "", last = 0, m;
  while ((m = re.exec(raw)) !== null) {
    if (m[0].length === 0) { re.lastIndex++; continue; }
    if (m.index > last) out += esc(raw.slice(last, m.index));
    out += "<mark>" + esc(m[0]) + "</mark>";
    last = m.index + m[0].length;
  }
  out += esc(raw.slice(last));
  return out;
}
function li(items) {
  if (!items || !items.length) return "";
  return "<ul>" + items.map(function (x) { return "<li>" + highlight(x) + "</li>"; }).join("") + "</ul>";
}
function subsOf(q) {
  var s = q.subs;
  if (!s || !s.length) return [{ label: "本题", hint: "" }];
  return s;
}
function dotsHtml(subs) {
  if (!subs) return "";
  var vals = Object.values(subs);
  if (!vals.length) return "";
  return '<span class="dot-strip">' + vals.map(function (v) {
    return '<i class="dot ' + esc(v) + '"></i>';
  }).join("") + "</span>";
}

/* ===== 题库卡片 ===== */
function cardHtml(i) {
  var it = QUESTIONS[i];
  var cls = SUBJ_CLASS[it.subject] || "";
  var isOpen = !!state.open[i];
  var cnt = S.countOf(it);
  var last = S.lastAttempt(it);
  var lastMark = S.latestMark(it);
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
  var mark = '<div class="mark-row">'
    + (cnt
        ? '<span class="mark-badge ' + (lastMark || "fuzzy") + '">第 ' + cnt + ' 次 · ' + (S.MARK_TEXT[lastMark] || "已记录") + '</span>'
          + dotsHtml(last ? last.subs : null)
          + '<span class="mark-count">' + esc(last ? last.date : "") + '</span>'
        : '<span class="mark-count">还没做过</span>')
    + '<button class="mark-act" data-record="' + i + '">' + (cnt ? "再记一次" : "记一次") + '</button>'
    + '</div>';
  return '<article class="card' + (isOpen ? " open" : "") + '" id="c' + i + '">' + head + answer + mark + '</article>';
}
function detailsHtml(it) {
  var h = '<div class="details">';
  if (it.detail) h += '<div class="sec-label">详解</div><p class="detail-text">' + highlight(it.detail) + '</p>';
  if (it.mustWrite && it.mustWrite.length) h += '<div class="sec-label green">怎么写才给分</div>' + li(it.mustWrite);
  if (it.skip && it.skip.length) h += '<div class="sec-label warn">这些别写（浪费时间）</div>' + li(it.skip);
  if (it.pitfalls && it.pitfalls.length) h += '<div class="sec-label warn">易失分点</div>' + li(it.pitfalls);
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
  el.yearRow.innerHTML = ['<button class="chip" data-year="all" aria-pressed="' + (state.year === "all") + '">全部年份</button>']
    .concat(years.map(function (y) {
      return '<button class="chip" data-year="' + y + '" aria-pressed="' + (String(state.year) === String(y)) + '">' + y + "</button>";
    })).join("");
  el.subjectRow.innerHTML = ['<button class="chip" data-subject="all" aria-pressed="' + (state.subject === "all") + '">全部学科</button>']
    .concat(SUBJECTS.map(function (s) {
      return '<button class="chip ' + SUBJ_CLASS[s] + '" data-subject="' + s + '" aria-pressed="' + (state.subject === s) + '">' + s + "</button>";
    })).join("");
  el.markRow.innerHTML = MARK_FILTERS.map(function (m) {
    return '<button class="chip" data-mark="' + m.v + '" aria-pressed="' + (state.mark === m.v) + '">' + m.t + "</button>";
  }).join("");
}
function renderSuggests() {
  el.suggests.innerHTML = (META.topKp || []).slice(0, 10).map(function (k) {
    return '<button data-suggest="' + esc(k) + '">' + esc(k) + "</button>";
  }).join("");
}

/* ===== 记录页 ===== */
function renderRecords() {
  var all = S.allAttempts();
  var st = S.stats();
  el.recStats.innerHTML = ''
    + '<div class="stat"><b>' + st.total + '</b><span>总记录</span></div>'
    + '<div class="stat bad"><b>' + st.bad + '</b><span>不会</span></div>'
    + '<div class="stat fuzzy"><b>' + st.fuzzy + '</b><span>模糊</span></div>'
    + '<div class="stat ok"><b>' + st.ok + '</b><span>掌握</span></div>';
  el.recFilter.innerHTML = MARK_FILTERS.filter(function (m) { return m.v !== "none"; }).map(function (m) {
    return '<button class="chip" data-recfilter="' + m.v + '" aria-pressed="' + (state.recFilter === m.v) + '">' + m.t + "</button>";
  }).join("");

  var list = all.filter(function (a) {
    if (state.recFilter === "all" || state.recFilter === "done") return true;
    var vals = Object.values(a.subs || {});
    return vals.indexOf(state.recFilter) >= 0;
  });
  el.recEmpty.hidden = list.length !== 0;
  el.recList.innerHTML = list.map(function (a) {
    var q = byQid(a.qid);
    var cls = q ? (SUBJ_CLASS[q.subject] || "") : "";
    var parts = Object.keys(a.subs || {}).map(function (k) {
      var v = a.subs[k];
      return '<div><span class="mark-badge ' + esc(v) + '">' + (S.MARK_TEXT[v] || v) + '</span><span>' + esc(k) + '</span></div>';
    }).join("");
    var imgs = (a.images || []).map(function (d, ii) {
      return '<img src="' + d + '" data-zoom="' + a.id + ":" + ii + '" alt="记录图片" />';
    }).join("");
    return '<article class="rec-card">'
      + '<div class="rec-card-head">'
      +   '<span class="rec-nth">第 ' + a.n + ' 次</span>'
      +   (q ? '<span class="subj ' + cls + '">' + esc(q.subject) + '</span>' : '')
      +   '<span class="mark-count">' + esc(a.date) + '</span>'
      + '</div>'
      + '<div class="rec-title">' + esc(q ? (q.year + " · " + q.qno + "　" + (q.title || q.type)) : a.qid) + '</div>'
      + (parts ? '<div class="rec-parts">' + parts + '</div>' : '')
      + (a.note ? '<div class="rec-note">' + esc(a.note) + '</div>' : '')
      + (imgs ? '<div class="rec-thumbs">' + imgs + '</div>' : '')
      + '<div class="rec-actions">'
      +   '<button data-openq="' + esc(a.qid) + '">看这题</button>'
      +   '<button data-editrec="' + esc(a.qid) + ":" + a.id + '">修改</button>'
      +   '<button class="muted" data-delrec="' + esc(a.qid) + ":" + a.id + '">删除</button>'
      + '</div>'
      + '</article>';
  }).join("");
  var badge = el.recBadge;
  if (st.total > 0) { badge.hidden = false; badge.textContent = String(st.total); } else { badge.hidden = true; }
}
function byQid(id) {
  var p = String(id).split("-");
  return QUESTIONS.find(function (q) { return String(q.year) === p[0] && String(q.qno) === p[1]; }) || null;
}
function indexOfQid(id) {
  var p = String(id).split("-");
  return QUESTIONS.findIndex(function (q) { return String(q.year) === p[0] && String(q.qno) === p[1]; });
}

/* ===== 记录面板 ===== */
function openSheet(html) {
  el.sheetBody.innerHTML = html;
  el.overlay.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeSheet() {
  el.overlay.hidden = true;
  el.sheetBody.innerHTML = "";
  document.body.style.overflow = "";
  editing = null;
}
function partRowsHtml(q, subs) {
  return subsOf(q).map(function (p, i) {
    var cur = (subs || {})[p.label];
    return '<div class="q-part">'
      + '<span class="q-part-label"><b>' + esc(p.label) + '</b>' + esc(p.hint || "") + '</span>'
      + '<span class="seg">'
      +   S.MARKS.map(function (m) {
            return '<button type="button" class="' + m.v + '" data-part="' + esc(p.label) + '" data-val="' + m.v + '" aria-pressed="' + (cur === m.v) + '">' + m.t + '</button>';
          }).join("")
      + '</span></div>';
  }).join("");
}
function recordSheet(qIndex, recId) {
  var q = QUESTIONS[qIndex];
  var list = S.attemptsOf(q);
  var rec = recId ? list.find(function (a) { return a.id === recId; }) : null;
  editing = { qIndex: qIndex, recId: recId || null };
  var n = rec ? rec.n : (list.reduce(function (m, a) { return Math.max(m, a.n); }, 0) + 1);
  var date = rec ? rec.date : new Date().toISOString().slice(0, 10);
  var prev = list.filter(function (a) { return !recId || a.id !== recId; }).map(function (a) {
    var vals = Object.values(a.subs || {});
    var mark = vals.indexOf("bad") >= 0 ? "bad" : vals.indexOf("fuzzy") >= 0 ? "fuzzy" : vals.length ? "ok" : "fuzzy";
    return '<div class="attempt-item">'
      + '<span><span class="mark-badge ' + mark + '">第 ' + a.n + ' 次</span> <small>' + esc(a.date) + '</small></span>'
      + '<button data-editrec="' + S.qid(q) + ":" + a.id + '">修改</button>'
      + '</div>';
  }).join("");
  var html = ''
    + '<h3>' + esc(q.title || q.type) + '</h3>'
    + '<div class="sub">' + q.year + " 年 · 第 " + q.qno + " 题 · " + esc(q.subject) + (q.score ? " · " + esc(q.score) : "") + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">这是第几次做</div>'
    +   '<input id="fN" class="date-input" type="number" min="1" step="1" value="' + n + '" style="width:96px" />'
    + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">日期</div>'
    +   '<input id="fDate" class="date-input" type="date" value="' + date + '" />'
    + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">每一问的情况 <span class="hint">点一下就好</span></div>'
    +   partRowsHtml(q, rec ? rec.subs : {})
    + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">文字备注 <span class="hint">错在哪、卡在哪、下次注意什么</span></div>'
    +   '<textarea id="fNote" class="note" placeholder="例：第二问漏了页目录项地址要乘 4；计算题单位没写">' + esc(rec ? rec.note : "") + '</textarea>'
    + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">拍照 / 选图 <span class="hint">拍下自己的草稿或错题</span></div>'
    +   '<div class="thumbs" id="fThumbs"></div>'
    + '</div>'
    + '<div class="sheet-actions">'
    +   '<button class="btn primary" id="fSave">保存记录</button>'
    +   (rec ? '<button class="btn danger" id="fDel">删除</button>' : '')
    + '</div>'
    + (prev ? '<div class="field"><div class="field-label">这道题以前的记录</div><div class="attempt-list">' + prev + '</div></div>' : '')
    + '<div class="mark-count" style="margin-top:12px">' + S.usageText() + '</div>';
  openSheet(html);
  sheetImages = rec ? (rec.images || []).slice() : [];
  sheetSubs = Object.assign({}, rec ? rec.subs : {});
  renderThumbs();
}
var sheetImages = [];
var sheetSubs = {};

function renderThumbs() {
  var box = document.getElementById("fThumbs");
  if (!box) return;
  box.innerHTML = sheetImages.map(function (d, i) {
    return '<div class="thumb"><img src="' + d + '" alt="" /><button type="button" data-rmimg="' + i + '">×</button></div>';
  }).join("") + '<button class="add-img" type="button" id="addImg"><span>＋</span>拍照/选图</button>';
}
async function addImages(files) {
  var added = 0, failed = 0;
  for (var i = 0; i < files.length; i++) {
    try {
      var d = await S.compressImage(files[i]);
      var probe = S.canAddImages(sheetImages, [d]);
      if (!probe.ok) { toast("存储快满了，先删几张旧图或备份后清理"); break; }
      sheetImages.push(d);
      added++;
    } catch (e) { failed++; }
  }
  renderThumbs();
  if (added) toast("已加入 " + added + " 张" + (failed ? "，" + failed + " 张失败" : ""));
  else if (failed) toast("图片读取失败");
}
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.toast.hidden = true; }, 2200);
}
function saveRecord() {
  if (!editing) return;
  var q = QUESTIONS[editing.qIndex];
  var nEl = document.getElementById("fN"), dEl = document.getElementById("fDate"), noteEl = document.getElementById("fNote");
  var payload = {
    n: Math.max(1, parseInt(nEl && nEl.value ? nEl.value : "1", 10) || 1),
    date: (dEl && dEl.value) || new Date().toISOString().slice(0, 10),
    subs: sheetSubs,
    note: noteEl ? noteEl.value.trim() : "",
    images: sheetImages.slice(),
  };
  var hasAny = Object.keys(payload.subs).length || payload.note || payload.images.length;
  if (!hasAny) { toast("至少点一个小问，或写点备注/加张图"); return; }
  try {
    if (editing.recId) { S.updateAttempt(q, editing.recId, payload); toast("已更新"); }
    else { S.addAttempt(q, payload); toast("已记录第 " + payload.n + " 次"); }
  } catch (e) {
    toast("保存失败，可能是本机存储已满");
    return;
  }
  closeSheet();
  render();
  renderRecords();
}

/* ===== 事件 ===== */
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-toggle],[data-year],[data-subject],[data-mark],[data-suggest],[data-kp],[data-record],[data-view],[data-recfilter],[data-editrec],[data-delrec],[data-openq],[data-zoom],[data-part],[data-rmimg],[data-close],#addImg,#fSave,#fDel");
  if (!t) return;
  var d = t.dataset || {};
  if (t.id === "addImg") { el.fileInput.click(); return; }
  if (t.id === "fSave") { saveRecord(); return; }
  if (t.id === "fDel") {
    if (editing && editing.recId && confirm("删除这次记录？")) {
      S.deleteAttempt(QUESTIONS[editing.qIndex], editing.recId);
      closeSheet(); render(); renderRecords(); toast("已删除");
    }
    return;
  }
  if (d.close) { closeSheet(); return; }
  if (d.toggle != null) {
    var i = d.toggle;
    state.open[i] = !state.open[i];
    var card = document.getElementById("c" + i);
    if (card) card.outerHTML = cardHtml(Number(i));
    return;
  }
  if (d.year) { state.year = d.year; renderChips(); render(); return; }
  if (d.subject) { state.subject = d.subject; renderChips(); render(); return; }
  if (d.mark) { state.mark = d.mark; renderChips(); render(); return; }
  if (d.recfilter) { state.recFilter = d.recfilter; renderRecords(); return; }
  if (d.suggest) { setQuery(d.suggest); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (d.kp) { setQuery(d.kp); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (d.record) { recordSheet(Number(d.record), null); return; }
  if (d.view) { setView(d.view); return; }
  if (d.editrec) {
    var p = d.editrec.split(":");
    recordSheet(indexOfQid(p[0]), p[1]);
    return;
  }
  if (d.delrec) {
    var q2 = d.delrec.split(":");
    if (confirm("删除这条记录？")) {
      var qq = byQid(q2[0]);
      if (qq) { S.deleteAttempt(qq, q2[1]); renderRecords(); render(); toast("已删除"); }
    }
    return;
  }
  if (d.openq) {
    var idx = indexOfQid(d.openq);
    setView("library");
    setQuery("");
    state.year = "all"; state.subject = "all"; state.mark = "all";
    renderChips();
    state.open[idx] = true;
    render();
    var node = document.getElementById("c" + idx);
    if (node) node.scrollIntoView({ block: "start" });
    return;
  }
  if (d.zoom) {
    var pp = d.zoom.split(":");
    var att = S.allAttempts().find(function (a) { return a.id === pp[1]; });
    if (att && att.images[Number(pp[2])]) {
      var box = document.createElement("div");
      box.className = "lightbox";
      box.innerHTML = '<img src="' + att.images[Number(pp[2])] + '" alt="" />';
      box.addEventListener("click", function () { box.remove(); });
      document.body.appendChild(box);
    }
    return;
  }
  if (d.part != null) {
    var key = d.part, val = d.val;
    if (sheetSubs[key] === val) delete sheetSubs[key];
    else sheetSubs[key] = val;
    var btn = t.closest(".seg");
    if (btn) {
      Array.prototype.forEach.call(btn.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", String(sheetSubs[key] === b.dataset.val));
      });
    }
    return;
  }
  if (d.rmimg != null) {
    sheetImages.splice(Number(d.rmimg), 1);
    renderThumbs();
    return;
  }
});

el.fileInput.addEventListener("change", function () {
  if (el.fileInput.files && el.fileInput.files.length) addImages(Array.prototype.slice.call(el.fileInput.files));
  el.fileInput.value = "";
});
el.q.addEventListener("input", function () {
  state.q = el.q.value;
  el.clearBtn.hidden = !el.q.value;
  render();
});
el.clearBtn.addEventListener("click", function () { setQuery(""); el.q.focus(); });
el.expandAll.addEventListener("click", function () {
  visibleIndexes().forEach(function (i) { state.open[i] = true; });
  render();
});
el.collapseAll.addEventListener("click", function () { state.open = {}; render(); });
el.randomBtn.addEventListener("click", function () {
  var idxs = visibleIndexes();
  if (!idxs.length) return;
  var pick = idxs[Math.floor(Math.random() * idxs.length)];
  state.open[pick] = false;
  render();
  var card = document.getElementById("c" + pick);
  if (card) card.scrollIntoView({ block: "center" });
});
el.backupBtn.addEventListener("click", function () { backupSheet(); });

function setQuery(v) { state.q = v; el.q.value = v; el.clearBtn.hidden = !v; render(); }
function setView(v) {
  state.view = v;
  el.viewLibrary.hidden = v !== "library";
  el.viewRecords.hidden = v !== "records";
  el.brandName.textContent = v === "records" ? "做题记录" : "大题答案";
  el.randomBtn.hidden = v !== "library";
  el.backupBtn.hidden = v !== "records";
  Array.prototype.forEach.call(el.tabbar.querySelectorAll(".tab"), function (b) {
    b.setAttribute("aria-pressed", String(b.dataset.view === v));
  });
  window.scrollTo({ top: 0 });
  if (v === "records") renderRecords();
}

/* ===== 备份 ===== */
function backupSheet() {
  var json = S.exportJSON();
  var st = S.stats();
  var html = ''
    + '<h3>备份与恢复</h3>'
    + '<div class="sub">共 ' + st.total + ' 条记录、' + st.images + ' 张图片 · ' + S.usageText() + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">导出 <span class="hint">复制下面文字，或存成文件</span></div>'
    +   '<textarea id="expText" class="note" style="min-height:120px">' + esc(json.slice(0, 400000)) + '</textarea>'
    +   '<div class="sheet-actions">'
    +     '<button class="btn" id="copyExp">复制</button>'
    +     '<button class="btn" id="dlExp">存成文件</button>'
    +   '</div>'
    + '</div>'
    + '<div class="field">'
    +   '<div class="field-label">导入 <span class="hint">选备份文件，或粘贴上面的文字</span></div>'
    +   '<textarea id="impText" class="note" placeholder="把之前的备份 JSON 粘到这里"></textarea>'
    +   '<div class="sheet-actions">'
    +     '<button class="btn" id="pickImp">选文件</button>'
    +     '<button class="btn primary" id="doImp">导入</button>'
    +   '</div>'
    + '</div>'
    + '<div class="sheet-actions"><button class="btn danger" id="wipe" style="flex:1">清空全部记录</button></div>';
  openSheet(html);
  var exp = document.getElementById("expText");
  document.getElementById("copyExp").onclick = function () {
    exp.select();
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(exp.value);
      else document.execCommand("copy");
      toast("已复制");
    } catch (e) { toast("请长按文本框手动复制"); }
  };
  document.getElementById("dlExp").onclick = function () {
    try {
      var blob = new Blob([exp.value], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "408dati-records-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      toast("已导出文件");
    } catch (e) { toast("这个环境不支持下载，请用复制"); }
  };
  document.getElementById("pickImp").onclick = function () { el.importInput.click(); };
  document.getElementById("doImp").onclick = function () {
    var text = document.getElementById("impText").value.trim();
    if (!text) { toast("先粘贴备份内容"); return; }
    try { var n = S.importJSON(text); toast("导入了 " + n + " 条记录"); closeSheet(); renderRecords(); render(); }
    catch (e) { toast("导入失败：" + e.message); }
  };
  document.getElementById("wipe").onclick = function () {
    if (confirm("清空全部做题记录？此操作不可恢复，建议先导出备份。")) {
      S.clearAll(); closeSheet(); renderRecords(); render(); toast("已清空");
    }
  };
}
el.importInput.addEventListener("change", function () {
  var f = el.importInput.files && el.importInput.files[0];
  if (!f) return;
  var fr = new FileReader();
  fr.onload = function () {
    try { var n = S.importJSON(String(fr.result)); toast("导入了 " + n + " 条记录"); closeSheet(); renderRecords(); render(); }
    catch (e) { toast("导入失败：" + e.message); }
  };
  fr.readAsText(f);
  el.importInput.value = "";
});

renderChips();
renderSuggests();
render();
renderRecords();
setView("library");
el.footNote.textContent = "共 " + QUESTIONS.length + " 题 · " + (META.range || "") + " · 记录只存在本机，离线可用";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
