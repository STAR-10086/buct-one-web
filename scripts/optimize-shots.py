# 把 pic/ 下 5 张截图优化为 public/shots/shot-{id}.webp（宽 540 = 2x 显示尺寸，q82）
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PIC = ROOT / "pic"
OUT = ROOT / "public" / "shots"
OUT.mkdir(parents=True, exist_ok=True)

MAPPING = {
    "workbench": "工作台.png",
    "timetable": "课表.png",
    "score": "成绩.png",
    "homework": "作业.png",
    "profile": "我的.png",
}
TARGET_W = 540
for slot, name in MAPPING.items():
    src = PIC / name
    if not src.exists():
        print("MISSING", name)
        continue
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w > TARGET_W:
        im = im.resize((TARGET_W, round(h * TARGET_W / w)), Image.LANCZOS)
    dst = OUT / ("shot-" + slot + ".webp")
    im.save(dst, "WEBP", quality=82, method=6)
    print(slot, "<-", name, f"{w}x{h}", "->", f"{im.size[0]}x{im.size[1]}", dst.stat().st_size, "bytes")
print("DONE")
