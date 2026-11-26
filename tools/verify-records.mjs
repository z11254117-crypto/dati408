import { createRequire } from 'module';
const require = createRequire("E:/DSH-home/profiles/desktop/node_modules/");
const puppeteer = require("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = [];
page.on("pageerror", e => errs.push("pageerror:" + String(e).slice(0,200)));
page.on("console", m => { if (m.type() === "error") errs.push("console:" + m.text().slice(0,200)); });
await page.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 900));
const out = {};

// 找一道小问>=3 的题（2009-42）
await page.evaluate(() => { const i = document.getElementById("q"); i.value = "链表倒数第 k 个结点"; i.dispatchEvent(new Event("input")); });
await new Promise(r => setTimeout(r, 400));
await page.click('.mark-act');
await new Promise(r => setTimeout(r, 400));
out.parts = await page.$$eval(".q-part", ns => ns.map(n => n.querySelector(".q-part-label").textContent.replace(/\s+/g, " ").trim()));
// 逐问点：不会 / 模糊 / 掌握
const segs = await page.$$(".q-part .seg");
const pick = async (i, cls) => { const b = await segs[i].$("button." + cls); if (b) await b.click(); };
await pick(0, "bad"); await pick(1, "fuzzy"); if (segs[2]) await pick(2, "ok");
await new Promise(r => setTimeout(r, 200));
out.pressed = await page.$$eval(".q-part .seg button[aria-pressed='true']", ns => ns.map(n => n.textContent));
await page.type("#fNote", "第一问只写了思路没写复杂度；第三问把 O(nlogn) 写成 O(n)");
const fi = await page.$("#fileInput");
await fi.uploadFile("E:/xin/dshwork/408-app/.shots/01-home.png");
await new Promise(r => setTimeout(r, 1800));
out.thumbs = await page.$$eval("#fThumbs .thumb", ns => ns.length);
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/20-sheet.png" });
await page.click("#fSave");
await new Promise(r => setTimeout(r, 700));
out.card = await page.$eval(".mark-row", e => e.textContent.replace(/\s+/g, " "));
out.dots = await page.$$eval(".mark-row .dot", ns => ns.map(n => n.className.replace("dot ", "")));
out.kb = await page.evaluate(() => Math.round((localStorage.getItem("dati408.v1.records") || "").length / 1024));

await page.click('.tab[data-view="records"]');
await new Promise(r => setTimeout(r, 500));
out.stats = await page.$$eval(".stat", ns => ns.map(n => n.textContent.replace(/\s+/g, "")));
out.recParts = await page.$$eval(".rec-parts div", ns => ns.map(n => n.textContent.replace(/\s+/g, " ")));
out.recNote = await page.$eval(".rec-note", e => e.textContent);
out.recThumbs = await page.$$eval(".rec-thumbs img", ns => ns.length);
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/21-records.png" });

// 按"不会"筛选
await page.evaluate(() => { const b = Array.from(document.querySelectorAll("#recFilter .chip")).find(c => c.textContent === "不会"); if (b) b.click(); });
await new Promise(r => setTimeout(r, 300));
out.filteredNone = await page.$$eval(".rec-card", ns => ns.length);
out.errs = errs.slice(0, 4);
await browser.close();
console.log(JSON.stringify(out, null, 1));
