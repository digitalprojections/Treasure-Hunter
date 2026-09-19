# Game object asset conventions

Objects are identified by `category/type`, for example `defenses/fire_turret`.
Use lowercase snake_case folder names. Supported categories: heroes, enemies,
wildlife, defenses, structures, resources, barriers, terrain, and symbols.

| Purpose | Path below `assets/` | Selection |
| --- | --- | --- |
| Single static image | `structures/well/static.png` | Always this image |
| Static variants | `structures/well/variant_01.png` | Stable selection from object seed |
| Windows batch-renamed variants | `barriers/barricade/barricade (1).png` | Stable selection from object seed |
| Upgrade stages | `defenses/turret/level_01.png` | Explicit one-based object level |
| Windows batch-renamed levels | `defenses/turret/level (1).png` | Explicit one-based object level |
| Action animation | `heroes/mage/walk/walk_001.png` | Frame time within that action |
| Windows batch-renamed frames | `heroes/mage/walk/Frame (1).png` | Frame time within that action |

Windows `(n)` numbering is supported without zero-padding. The prefix is arbitrary
for variants and action frames; use `level (n)` for upgrade stages. Duplicate
numbers across naming styles are rejected. Barricade rendering uses the discovered
folder contents, with no fixed filename list or variant count.

For underscore names, use two digits for levels/variants and three for animation frames. Numbers sort
numerically; there is no fixed limit of four levels or any fixed frame count.
An object's own name, such as `heroes/archer/archer.png`, is also accepted as its
single static image. This is a documented convention, not a filename-search fallback.

Static objects can contain multiple upgrade images without becoming animations.
Do not mix level images and static variants in the same object. Duplicate numeric
indices, including duplicates across file extensions, produce a discovery error.
Unrecognized image files and export folders are rejected by discovery and reported by the audit. PNG, WebP, JPG and JPEG work.
Keep defense tile art at 96 x 96 pixels.

## Discovery and rendering

### Stat-display symbols

Names containing `_symbol` designate HUD/stat artwork, never map objects.
Keep these in `symbols/<name>_symbol/<name>_symbol.png` (or `static.png`).
The registry marks these objects `hud`; world selection cannot return their art.
Files using `_symbol` outside these object folders are reported by `assets:check`.
Fog, danger, quest and random markers do not carry this suffix and remain world art.

Current stat bindings: `discovered_symbol` for exploration percentage,
`bomb_symbol` for traps sprung, `potion_symbol` for stamina, and `star_symbol`
for points earned today. Key, scroll and waypoint symbols remain reserved until
matching stats exist. These icons do not create inventory items or map rewards.
Visible labels and values remain authoritative; missing HUD art retains the label
and uses the previous icon when available.

All raster HUD artwork must come from `assets/symbols/`. Resource counters bind
only to `symbols/gold_symbol`, `symbols/wood_symbol`, `symbols/stone_symbol`, and
`symbols/gem_symbol`. Missing symbol art uses generic UI icons; world resource
art must never be substituted.


`src/data/objectAssets.ts` uses Vite glob discovery. Add a matching folder or image,
then restart development or rebuild for deployment. A deployed browser cannot scan
your local asset directory; newly added files require a new build/deployment.

`TileVisual.assetKey` optionally selects a discovered object, and `action` selects
an animation (default `idle`). A missing action falls back to static art, then idle.
A missing object shows a missing-art marker. Damage, death, walk, and other actions are never guessed as substitutes for idle.
`TileVisual.level` selects a static upgrade image; omitted or invalid levels use
the base image. Missing intermediate levels use the closest lower available level;
levels below/above the range use the first/last image. Time and tile seed never
change a level-selected image. Changing game state immutably rerenders the image.

Example game visual:

```ts
{ id: 'turret', assetKey: 'defenses/turret', level: 2, label: 'Turret', tone: 'threat' }
```

The four existing defense types use discovered static levels without `assetKey`.
All consumers resolve category/type keys through the same folder contract. Flat assets are invalid; there is no legacy filename search. Character action files must have a numeric suffix, even for a single frame. New objects enter the registry
without imports, but spawning, combat, upgrade costs and player upgrade controls
are gameplay rules and are not inferred from image filenames. Animated upgrade
stages and per-level variants are not yet supported; do not put frames below
`level_01/` until that contract is implemented.

## Validation tools

`npm run assets:check` reports invalid image paths, duplicate indices, and objects without neutral art, and exits nonzero when issues exist. Runtime logs the same audit. It never modifies assets.

`npm run assets:objects` lists discovered static levels, variants and action frames.
`npm run test:defense-rendering` verifies actual rendered tower images through Vite.
`python scripts/resize-tiles.py assets/defenses --size 96` resizes nested PNG tiles.

Optional transparent stills use `category/type/cutout.png`. Animation suffixes may use `_N`, `-N`, or `(N)`; zero-padding is recommended, not required.
