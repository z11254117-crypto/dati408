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
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/01-home.png" });
// 展开第一张卡
await page.click(".card-head");
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: "E:/xin/dshwork/408-app/.shots/02-open.png" });
const info = await page.evaluate(() => ({
  count: document.getElementById("count").textContent,
  cards: document.querySelectorAll(".card").length,
  firstTitle: document.querySelector(".card-title") ? document.querySelector(".card-title").textContent : "",
}));
await browser.close();
console.log("INFO " + JSON.stringify(info) + " ERRS " + JSON.stringify(errs.slice(0, 5)));
