import { createRequire } from 'module';
const require = createRequire("E:/DSH-home/profiles/desktop/node_modules/");
const puppeteer = require("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 900));

async function addRecord(query, statuses, note, shot) {
  await page.evaluate((qq) => { const i = document.getElementById("q"); i.value = qq; i.dispatchEvent(new Event("input")); }, query);
  await new Promise(r => setTimeout(r, 350));
  await page.click(".mark-act");
  await new Promise(r => setTimeout(r, 400));
  const segs = await page.$$(".q-part .seg");
  for (let i = 0; i < segs.length; i++) {
    const cls = statuses[i] || "ok";
    const b = await segs[i].$(cls === "bad" ? "button.bad" : cls === "ok" ? "button.ok" : "button.fuzzy");
    if (b) await b.click();
  }
  await page.type("#fNote", note);
  if (shot) { await page.screenshot({ path: shot }); }
  await page.click("#fSave");
  await new Promise(r => setTimeout(r, 500));
}

await addRecord("链表倒数第 k 个结点", ["bad", "fuzzy", "ok"], "第一问只写了思路没写复杂度；第三问把 O(nlogn) 写成 O(n)", "E:/xin/dshwork/408-app/.shots/20-sheet.png");
await addRecord("关键路径", ["fuzzy", "ok"], "余量算反了，j 的活动余量应该是 6", null);
await addRecord("Cache 与虚存", ["ok", "ok"], "这次全对，注意组号位数", null);
await page.evaluate(() => { const i = document.getElementById("q"); i.value = ""; i.dispatchEvent(new Event("input")); });
await page.click('.tab[data-view="records"]');
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/21-records.png" });
const info = await page.evaluate(() => ({
  cards: document.querySelectorAll(".rec-card").length,
  stats: Array.from(document.querySelectorAll(".stat")).map(s => s.textContent.replace(/\s+/g, "")),
  badge: document.getElementById("recBadge").textContent,
}));
await browser.close();
console.log(JSON.stringify(info));
