#!/usr/bin/env python3
"""
把课件整屏截图裁成卡片缩略图：聚焦中间的 3D 演示区，输出 3:2 的 WebP。
用法：python3 scripts/crop-thumbs.py
"""
from PIL import Image
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "thumbs-src"
OUT = ROOT / "public" / "thumbs"
OUT.mkdir(parents=True, exist_ok=True)
SRC.mkdir(parents=True, exist_ok=True)

# 课件布局固定：左侧讲解栏 ~0–26.5%，右侧中控台 ~74.5–100%，
# 中间 3D 视口正好在 26.5%–74.5% 之间。按这个范围裁，才不含侧栏。
LEFT = 0.265
RIGHT = 0.745
ASPECT = 3 / 2
OUT_W = 720
CENTER_Y = 0.62  # 往下取景：避开课件顶部工具条，让实验台主体居中


def crop_one(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGB")
    W, H = im.size
    left = int(W * LEFT)
    right = int(W * RIGHT)
    cw = right - left
    ch = int(cw / ASPECT)
    cy = int(H * CENTER_Y)
    top = max(0, min(H - ch, cy - ch // 2))
    im2 = im.crop((left, top, right, top + ch))
    out_h = int(OUT_W / ASPECT)
    im2 = im2.resize((OUT_W, out_h), Image.LANCZOS)
    im2.save(dst.with_suffix(".webp"), "WEBP", quality=84, method=6)


def main() -> None:
    files = sorted(SRC.glob("*.png"))
    if not files:
        print(f"没有找到源图，请先放到 {SRC}")
        sys.exit(1)
    for f in files:
        crop_one(f, OUT / f.stem)
    total = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"裁切完成 {len(files)} 张，共 {total / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
