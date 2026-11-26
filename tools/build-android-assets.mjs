// 生成 Android WebView 用的离线资源：把 ESM 打成一个 classic 脚本
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ASSETS = join(ROOT, "android", "assets");

const data = await readFile(join(ROOT, "js", "data.js"), "utf8");
const app = await readFile(join(ROOT, "js", "app.js"), "utf8");

const dataBody = data.replace(/^export\s+/gm, "");
if (/^export\s/m.test(dataBody)) throw new Error("data.js 里还有 export 没处理");

const appBody = app.replace(/^import\s+[^;]*;\s*$/gm, "");
if (/^import\s/m.test(appBody)) throw new Error("app.js 里还有 import 语句没处理");

const bundle = [
  "/* 408 大题答案 · Android 离线包（由 tools/build-android-assets.mjs 生成，勿手改） */",
  "(function () {",
  '"use strict";',
  dataBody,
  appBody,
  "})();",
  "",
].join("\n");

await rm(ASSETS, { recursive: true, force: true });
await mkdir(join(ASSETS, "js"), { recursive: true });
await cp(join(ROOT, "css"), join(ASSETS, "css"), { recursive: true });
await cp(join(ROOT, "icons"), join(ASSETS, "icons"), { recursive: true });
await writeFile(join(ASSETS, "js", "bundle.js"), bundle);

let html = await readFile(join(ROOT, "index.html"), "utf8");
html = html
  .replace(/[ \t]*<link rel="manifest"[^>]*>\s*/g, "")
  .replace('<script type="module" src="js/app.js"></script>', '<script src="js/bundle.js"></script>');
if (!html.includes("js/bundle.js")) throw new Error("index.html 没被替换成离线脚本");
await writeFile(join(ASSETS, "index.html"), html);

const { execFileSync } = await import("node:child_process");
execFileSync(process.execPath, ["--check", join(ASSETS, "js", "bundle.js")], { stdio: "inherit" });
console.log("android assets ok · bundle " + bundle.length + " 字节");
