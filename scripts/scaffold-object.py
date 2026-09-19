"""Create a fillable object folder: python scripts/scaffold-object.py heroes knight --kind animated"""
import argparse
from pathlib import Path
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('category', choices=['heroes', 'enemies', 'wildlife', 'defenses', 'structures', 'resources', 'barriers', 'terrain', 'symbols'])
parser.add_argument('name')
parser.add_argument('--kind', choices=['static', 'upgradable', 'animated'], default='static')
args = parser.parse_args()
if not re.fullmatch(r'[a-z][a-z0-9_]*', args.name):
    parser.error('Object name must be lowercase snake_case')
root = Path(__file__).resolve().parents[1] / 'assets'
folder = root / args.category / args.name
folder.mkdir(parents=True, exist_ok=True)
actions = ['idle', 'walk', 'scout', 'collect', 'hit', 'damage', 'death', 'escape'] if args.category == 'heroes' else ['idle', 'walk', 'attack', 'damage', 'death']
if args.kind == 'animated':
    for action in actions:
        target = folder / action
        target.mkdir(exist_ok=True)
        (target / '.gitkeep').touch(exist_ok=True)
instruction = {
    'static': 'Add static.png, or variant_01.png, variant_02.png, etc. for alternative appearances.',
    'upgradable': 'Add level_01.png, level_02.png, etc. Each file is one upgrade stage, not an animation frame.',
    'animated': 'Fill action folders with numbered images such as idle/idle_001.png. Any filename ending in _001, _002, etc. works. Add optional static.png and cutout.png at the object root.',
}[args.kind]
readme = folder / 'README.md'
if not readme.exists():
    readme.write_text(f'# {args.category}/{args.name}\n\n{instruction}\n\nEmpty folders are safe. No image imports are needed. Restart development or rebuild after adding assets.\n\nSee ../../CONVENTIONS.md for the full contract.\n', encoding='utf-8')
print(folder)
