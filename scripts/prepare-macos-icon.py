#!/usr/bin/env python3
"""Compose a macOS icon: logo centered on a white rounded-square plate.

Writes src/assets/app-icon-mac.png and src/assets/icon.icns. All icns sizes
are generated from the same 1024 master so the white plate is consistent.

The plate follows Apple's macOS icon grid: an 824×824 rounded rect centered
on a 1024 canvas (100px gutter). The artwork is inset so the white plate
reads as a frame and the fanned cards are not clipped by the corner radius.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/assets/app-logo.png"
OUTPUT_PNG = ROOT / "src/assets/app-icon-mac.png"
OUTPUT_ICNS = ROOT / "src/assets/icon.icns"
MASTER_SIZE = 1024
# Apple's macOS icon grid (1024 canvas): 824 plate, 100px gutter, r=185.4.
PLATE_SIZE = 824
CORNER_RADIUS = 185.4
# Source already has ~6% side padding; 86% leaves a visible white margin
# without shrinking the fan into a sticker.
LOGO_FILL = 0.86
SUPERSAMPLE = 4

ICONSET_FILES = [
    (16, "icon_16x16.png"),
    (32, "icon_16x16@2x.png"),
    (32, "icon_32x32.png"),
    (64, "icon_32x32@2x.png"),
    (128, "icon_128x128.png"),
    (256, "icon_128x128@2x.png"),
    (256, "icon_256x256.png"),
    (512, "icon_256x256@2x.png"),
    (512, "icon_512x512.png"),
    (1024, "icon_512x512@2x.png"),
]


def rounded_square_mask(size: int, radius: float) -> Image.Image:
    scale = SUPERSAMPLE
    hi = size * scale
    hi_radius = radius * scale
    mask = Image.new("L", (hi, hi), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, hi - 1, hi - 1), radius=hi_radius, fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def compose_macos_icon(source: Path, size: int = MASTER_SIZE) -> Image.Image:
    logo = Image.open(source).convert("RGBA")
    if logo.width != logo.height:
        raise SystemExit(f"Source icon must be square, got {logo.width}x{logo.height}")

    logo_size = round(PLATE_SIZE * LOGO_FILL)
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    plate = Image.new("RGBA", (PLATE_SIZE, PLATE_SIZE), (255, 255, 255, 255))
    mask = rounded_square_mask(PLATE_SIZE, CORNER_RADIUS)
    plate.putalpha(mask)
    offset = (PLATE_SIZE - logo_size) // 2
    plate.alpha_composite(logo, (offset, offset))
    red, green, blue, alpha = plate.split()
    plate = Image.merge("RGBA", (red, green, blue, ImageChops.multiply(alpha, mask)))

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = (size - PLATE_SIZE) // 2
    canvas.paste(plate, (inset, inset), plate)
    return canvas


def write_icns(master: Image.Image, dest: Path) -> None:
    iconset = ROOT / "src-tauri" / "icons" / "icon.iconset"
    if iconset.exists():
        shutil.rmtree(iconset)
    iconset.mkdir(parents=True, exist_ok=True)
    try:
        for px, name in ICONSET_FILES:
            png_path = iconset / name
            resized = master.resize((px, px), Image.Resampling.LANCZOS)
            resized.save(png_path, "PNG")
            subprocess.run(
                ["sips", "-s", "format", "png", str(png_path), "--out", str(png_path)],
                check=True,
                capture_output=True,
            )
        subprocess.run(
            ["iconutil", "-c", "icns", str(iconset), "-o", str(dest)],
            check=True,
        )
    finally:
        shutil.rmtree(iconset, ignore_errors=True)


def main() -> int:
    if not SOURCE.exists():
        print(f"Source icon not found: {SOURCE}", file=sys.stderr)
        return 1
    if shutil.which("iconutil") is None:
        print("iconutil not found; macOS is required to build .icns", file=sys.stderr)
        return 1

    master = compose_macos_icon(SOURCE)
    OUTPUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    master.save(OUTPUT_PNG, "PNG")
    write_icns(master, OUTPUT_ICNS)
    print(f"Prepared macOS icon: {OUTPUT_PNG.relative_to(ROOT)}")
    print(f"Prepared macOS icns: {OUTPUT_ICNS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
