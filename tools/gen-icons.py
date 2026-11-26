"""生成 App 图标：暖纸底 + 墨色 408 + 朱红重点。"""
import os
from PIL import Image, ImageDraw, ImageFont

PAPER = (247, 242, 231, 255)
INK = (29, 25, 19, 255)
VERM = (180, 68, 44, 255)
AMBER = (179, 112, 31, 255)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")
os.makedirs(OUT, exist_ok=True)

FONTS = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def font(size):
    for path in FONTS:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw(size, scale=1.0, rounded=True):
    big = size * 4
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, big, big], radius=int(big * 0.225), fill=PAPER)
    else:
        d.rectangle([0, 0, big, big], fill=PAPER)

    # 左侧朱红竖条
    bar_w = int(big * 0.055 * scale)
    d.rounded_rectangle([int(big * 0.13), int(big * 0.24), int(big * 0.13) + bar_w, int(big * 0.76)],
                        radius=bar_w // 2, fill=VERM)
    # 底下墨色横线（答题纸）
    d.rounded_rectangle([int(big * 0.13), int(big * 0.78), int(big * 0.87), int(big * 0.80)], radius=bar_w // 2, fill=INK)
    d.rounded_rectangle([int(big * 0.13), int(big * 0.855), int(big * 0.62), int(big * 0.875)], radius=bar_w // 2, fill=AMBER)

    f = font(int(big * 0.40 * scale))
    text = "408"
    bbox = d.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((big * 0.545 - tw / 2, big * 0.455 - th / 2 - bbox[1]), text, font=f, fill=INK)
    return img.resize((size, size), Image.LANCZOS)


draw(512).save(os.path.join(OUT, "icon-512.png"))
draw(192).save(os.path.join(OUT, "icon-192.png"))
draw(180, scale=0.96).save(os.path.join(OUT, "icon-180.png"))
draw(512, scale=0.74, rounded=False).save(os.path.join(OUT, "icon-maskable-512.png"))
# 安卓启动图标（各密度）
MIPMAP = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
android_res = os.path.join(ROOT, "android", "res")
if os.path.isdir(android_res):
    for density, size in MIPMAP.items():
        d = os.path.join(android_res, "mipmap-" + density)
        os.makedirs(d, exist_ok=True)
        draw(size, scale=0.92, rounded=False).save(os.path.join(d, "ic_launcher.png"))
    print("mipmaps:", ",".join(MIPMAP))

print("icons:", sorted(os.listdir(OUT)))
