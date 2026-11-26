import { createRequire } from 'module';
const require = createRequire("E:/DSH-home/profiles/desktop/node_modules/");
const puppeteer = require("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = [];
page.on("pageerror", e => errs.push(String(e).slice(0,150)));
await page.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 800));

// 1) 高亮正确性：搜索含单字母 k 的词
await page.evaluate(() => { const i = document.getElementById("q"); i.value = "链表倒数第 k 个结点"; i.dispatchEvent(new Event("input")); });
await new Promise(r => setTimeout(r, 400));
const titleRaw = await page.$eval(".card-title", e => e.innerHTML);
const titleText = await page.$eval(".card-title", e => e.textContent);
const liText = await page.$eval(".card li", e => e.textContent);
const out = { titleRaw, titleText, liText, marks: await page.$$eval("mark", ns => ns.map(n => n.textContent)) };

// 2) Tab 切换
await page.click('.tab[data-view="records"]');
await new Promise(r => setTimeout(r, 500));
out.afterTab = await page.evaluate(() => ({
  recHidden: document.getElementById("viewRecords").hidden,
  libHidden: document.getElementById("viewLibrary").hidden,
  brand: document.getElementById("brandName").textContent,
  backupVisible: !document.getElementById("backupBtn").hidden,
  recCards: document.querySelectorAll(".rec-card").length,
}));
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/22-records-tab.png" });
// 3) 从记录回到题库并定位题目
await page.click('.tab[data-view="library"]');
await new Promise(r => setTimeout(r, 300));
out.backToLib = await page.evaluate(() => document.getElementById("viewLibrary").hidden === false);
out.errs = errs;
await browser.close();
console.log(JSON.stringify(out, null, 1));
