import { createRequire } from 'module';
const require = createRequire("E:/DSH-home/profiles/desktop/node_modules/");
const puppeteer = require("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = [];
page.on("pageerror", e => errs.push(String(e)));
page.on("console", m => { if (m.type() === "error") errs.push("console:" + m.text()); });
await page.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/01-home.png" });

await page.click(".card-head");
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/02-open.png" });

const probe = async (q) => {
  await page.evaluate(() => { const i = document.getElementById("q"); i.value = ""; });
  await page.click("#q", { clickCount: 3 });
  await page.type("#q", q);
  await new Promise(r => setTimeout(r, 350));
  return await page.evaluate(() => ({
    count: document.getElementById("count").textContent,
    first: document.querySelector(".card-title") ? document.querySelector(".card-title").textContent : "",
    titles: Array.from(document.querySelectorAll(".card-title")).slice(0, 4).map(t => t.textContent),
  }));
};
const results = {};
results["关键路径"] = await probe("关键路径");
results["组原"] = await probe("组原");
results["2021"] = await probe("2021");
results["页表"] = await probe("页表");
results["链"] = await probe("链");
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/03-search.png" });

// 学科 chip 筛选
await page.evaluate(() => { const i = document.getElementById("q"); i.value = ""; i.dispatchEvent(new Event("input")); });
await new Promise(r => setTimeout(r, 200));
const chips = await page.evaluate(() => Array.from(document.querySelectorAll("#subjectRow .chip")).map(c => c.textContent));
await page.evaluate(() => { const b = Array.from(document.querySelectorAll("#subjectRow .chip")).find(c => c.textContent.includes("操作系统")); if (b) b.click(); });
await new Promise(r => setTimeout(r, 300));
results["筛选-操作系统"] = await page.evaluate(() => ({
  count: document.getElementById("count").textContent,
  subs: Array.from(new Set(Array.from(document.querySelectorAll(".subj")).map(s => s.textContent))),
}));
await browser.close();
console.log(JSON.stringify({ chips, results, errs: errs.slice(0, 4) }, null, 1));
