# Spritebox Asset Convention

Spriteboxes are controlled by stable module IDs in code and by predictable asset names on disk.

## Folder Layout

- Keep game art under `assets/<domain>/`.
- Use lower snake case for files: `magic_turret_001.png`, `stone_bridge.png`.
- A zip may represent a packed module later, but its internal names should follow the same convention.

## Module Types

- `static`: one still asset, or multiple still variants selected by seed.
- `looper`: ordered frames that repeat at a configured frame rate.

## Naming Rules

- Static stills may use plain names: `forest.png`.
- Static variants should use numeric suffixes when order matters: `barricade_001.png`.
- Looper frames must use numeric suffixes: `cannon_001.png`, `cannon_002.png`, `cannon_003.png`.
- The spritebox resolver sorts numbered frames numerically, so `*_010` plays after `*_009`.

## Control IDs

Use code IDs as stable handles for dynamic control:

- Terrain: `terrain.<name>`
- Entity: `entity.<name>`
- Visual object: `visual.<name>`
- Hero state: `hero.<name>.<state>`
- Symbol: `symbol.<name>`

Do not rename IDs casually; saved gameplay, animation controls, and future editors should address spriteboxes by those IDs.

## Character States

Characters are spritebox sets. Supported states are:

- `idle`
- `walk`
- `scout`
- `collect`
- `hit`
- `escape`

Place future character frames under a character folder and keep the state in the filename:

- `assets/heroes/explorer/walk_001.png`
- `assets/heroes/explorer/walk_002.png`
- `assets/heroes/explorer/collect_001.png`
- `assets/heroes/explorer/hit_001.png`

The board chooses states from gameplay events; the spritebox only owns asset playback.
