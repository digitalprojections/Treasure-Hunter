"""Recursively resize PNG tiles in place without cropping; requires Pillow.

Usage: python scripts/resize-tiles.py assets/defenses --size 96
"""
import argparse
from pathlib import Path
from PIL import Image


def resize_tiles(directory: Path, size: int) -> None:
    if size <= 0:
        raise ValueError("Size must be positive")
    paths = sorted(directory.rglob("*.png"))
    if not paths:
        raise ValueError(f"No PNG files found in {directory}")
    for path in paths:
        with Image.open(path) as source:
            previous = source.size
            if previous == (size, size):
                continue
            result = source.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
        result.save(path)
        with Image.open(path) as saved:
            assert saved.size == (size, size), path
        print(f"{path.name}: {previous} -> {size}x{size}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--size", type=int, default=96)
    args = parser.parse_args()
    resize_tiles(args.directory, args.size)
