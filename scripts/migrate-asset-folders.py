"""One-time, repeatable migration of legacy images to object folders (no overwrites)."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1] / 'assets'
domains = ('barriers', 'enemies', 'wildlife', 'resources', 'structures', 'symbols', 'terrain')
moves = []
for domain in domains:
    for source in (root / domain).glob('*.png'):
        match = re.fullmatch(r'(barricade)(\d*)', source.stem) if domain == 'barriers' else None
        name = match[1] if match else source.stem
        filename = f'variant_{int(match[2] or 0) + 1:02}.png' if match else 'static.png'
        moves.append((source, root / domain / name / filename))
for folder in (root / 'heroes').iterdir():
    if not folder.is_dir():
        continue
    for source in folder.glob('*.png'):
        if source.stem == folder.name:
            moves.append((source, folder / 'static.png'))
        elif source.stem.startswith('bg_removed__'):
            moves.append((source, folder / 'cutout.png'))
for source, target in moves:
    assert source.resolve().is_relative_to(root.resolve())
    assert target.resolve().is_relative_to(root.resolve())
    if target.exists():
        raise FileExistsError(f'Refusing to overwrite {target}')
for source, target in moves:
    target.parent.mkdir(parents=True, exist_ok=True)
    source.rename(target)
    print(f'{source.relative_to(root)} -> {target.relative_to(root)}')
print(f'Migrated {len(moves)} images without overwrites.')
