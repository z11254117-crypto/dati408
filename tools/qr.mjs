import { createRequire } from 'module';
const require = createRequire("E:/DSH-home/profiles/desktop/node_modules/");
const QR = require("qrcode");
const items = [
  { text: "https://github.com/z11254117-crypto/dati408/releases/latest/download/dati408.apk", out: "E:/xin/dshwork/408-app/.shots/qr-apk.png" },
  { text: "https://z11254117-crypto.github.io/dati408/", out: "E:/xin/dshwork/408-app/.shots/qr-web.png" },
];
for (const it of items) {
  await QR.toFile(it.out, it.text, { width: 640, margin: 2, color: { dark: "#1d1913", light: "#f7f2e7" }, errorCorrectionLevel: "M" });
  console.log("qr ->", it.out);
}
