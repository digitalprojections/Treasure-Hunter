"""Report PNG artwork bounds and proportional tile fit; requires Pillow.

Usage: python scripts/check-asset-fit.py [asset directory]
Read-only: original artwork is never modified.
"""
import argparse
from pathlib import Path
from PIL import Image


def inspect(directory: Path) -> None:
    paths = sorted(directory.rglob('*.png'))
    if not paths:
        raise SystemExit(f'No PNG assets found in {directory}')
    for path in paths:
        with Image.open(path) as source:
            width, height = source.size
            bounds = source.convert('RGBA').getchannel('A').getbbox()
        scale = 100 / max(width, height)
        print(f'{path}: {width}x{height}; alpha={bounds}; '
              f'contained={width * scale:.1f}% x {height * scale:.1f}%')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path, nargs='?', default=Path('assets/heroes'))
    inspect(parser.parse_args().directory)
