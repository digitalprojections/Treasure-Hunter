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

## Terrain Edge Sets

Each terrain map theme needs 16 cardinal tile variants to avoid baked edge art appearing inside a continuous region. The runtime classifies each tile by same-theme neighbors to the north, east, south, and west, then maps that four-bit result to one of these minimum variants:

- `isolated`
- `north`
- `east`
- `north-east`
- `south`
- `north-south`
- `east-south`
- `north-east-south`
- `west`
- `north-west`
- `east-west`
- `north-east-west`
- `south-west`
- `north-south-west`
- `east-south-west`
- `center`

Future edge artwork should keep those variant keys per terrain theme. Diagonal-only contact is not a join; corners should be represented inside the matching cardinal variant art.

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
