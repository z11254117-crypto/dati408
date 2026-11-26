# 408 大题答案 · 手机版

408 历年综合应用题（2009–2026，18 年 × 41–47 题 = 126 题）的考场答案手册，做成手机本地 App。

**默认只看答案，点开看详解与书写注意事项。**

## 它做什么

- 列表按年份排，每张卡片先给「答案」——就是官方参考答案的采分点，一眼看完。
- 点卡片展开：「详解」（这题在考什么、怎么下手）、「怎么写才给分」、「这些别写（浪费时间）」、「易失分点」，底部是考点标签。
- 搜索：一个框搜**年份 / 学科 / 题目名 / 考点**，也搜答案正文。
  - 输入 2021 只出 2021 年；输入「组原」或「计组」等效于「计算机组成原理」；输入「关键路径」出所有相关题。
  - 考点标签可点，点了直接变成搜索词。
- 筛选：年份 chips、学科 chips；「展开全部 / 收起全部」；「随机」抽一题自测。
- 完全离线：数据打包在 App 内，不联网、不上传、不申请网络权限。

## 安装到手机

两种方式，选一个：

1. **APK（推荐，真离线）**
   手机浏览器打开 https://github.com/z11254117-crypto/dati408/releases/latest/download/dati408.apk
   下载后允许「安装未知来源应用」即可。APK 是原生安卓包，装完不联网也能用。

2. **网页版（加到主屏幕）**
   手机浏览器打开 https://z11254117-crypto.github.io/dati408/ ，菜单里选「添加到主屏幕 / 安装应用」。

## 目录

    index.html                 页面骨架（手机竖屏）
    css/style.css              全部样式（浅色 + 深色跟随系统）
    js/data.js                 题目数据（由 tools/build-data.mjs 生成，勿手改）
    js/app.js                  搜索 / 筛选 / 折叠 / 渲染
    sw.js                      Service Worker（离线缓存）
    manifest.webmanifest       PWA 清单
    icons/                     图标
    tools/build-data.mjs       从 408exam/out 汇总数据
    tools/build-android-assets.mjs  生成 Android 离线资源
    tools/gen-icons.py         图标 + 安卓 mipmap 生成
    tools/shot.mjs             手机视口截图（自测用）
    serve.mjs                  本机静态服务器
    test/data.test.mjs         数据自检
    android/                   APK 工程（aapt2 + javac + d8，不走 Gradle）

## 开发

    node tools/build-data.mjs        # 重新生成 js/data.js
    node --test test/                # 数据自检
    node serve.mjs                   # http://localhost:8791/
    node tools/shot.mjs              # 手机视口截图到 .shots/

## 打包 APK

本地：bash android/build-apk.sh（需要 JDK 17 + Android SDK build-tools）。
本仓库默认走 GitHub Actions：push 到 main 会自动出包，产物在 Actions artifact 里。

## 数据来源与准确性

- 2009–2025：官方参考答案与解析 PDF（逐页 OCR），逐题整理，含《评分说明》原文。
- 2026：PGCode 408 历年真题库、CodeBrick、shuatigo 交叉核对。
- 全部 126 题经过一轮**逐题人工校对**：数值、公式、地址与源文本比对，OCR 可疑处回看扫描页；修正了散列函数、Cache 容量公式、跳转方向、缺漏小问等问题。
- 源文本本身残缺或自相矛盾的地方（如个别年份未印分值、2025-47 源文前后不一致），数据里如实标注，不编造。
