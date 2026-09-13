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

Character animations are discovered automatically from:

```text
assets/<domain>/<character>/<state>/<frame>.png
assets/enemies/goblin/idle/Sprite_Animation_centered_001.png
assets/enemies/goblin/idle/Sprite_Animation_centered_002.png
assets/heroes/mage/walk/walk_001.png
```

- Domains: `heroes`, `enemies`, and `wildlife`.
- The character folder supplies the character name; its child folder supplies the animation state.
- Any positive number of frames is supported, including a single frame. Numeric suffixes determine playback order; padding and consecutive numbering are optional.
- PNG, WebP, and JPEG frames are supported. Keep frames directly inside the state folder.
- Add/remove frames, states, or characters and rebuild; no import list or frame count needs editing. Restart development if file watching is disabled.
- `src/data/characterAnimations.ts` exposes every discovered character and state. Existing enemy/wildlife map visuals automatically use their `idle` animation, with existing static art as fallback.
- Mage gameplay states use discovered clips while preserving their configured playback speed. Additional state names are registered, but need gameplay events to trigger them; new character names need game rules to spawn them.
- Run `npm run assets:inspect` to list discovered animations and frame counts.

The board chooses states from gameplay events; the spritebox owns asset playback.

## Terrain layers and encounters

Every tile always renders its terrain image. Objects appear above terrain, the hero above objects, and unexplored tiles remain covered by fog. Consumed objects and defeated enemies are removed from view.

Click an adjacent tile (or focus it and press Enter/Space) to move and interact. Hover text states the action and its cost.

- Movement costs 1 stamina. Gold is reserved for skills and loot; walking does not require gold.
- Enemies and armed defenses require additional stamina (3–6) and grant gold once (12–28). Insufficient stamina blocks the move without charging anything. Combat resolves on entry.
- Resource piles and shrines grant their listed supplies once. Forest terrain itself does not grant repeatable resources.
- Wells, villages, potions, and fish restore stamina once, capped at the hero's maximum.
- Barricades and gates require wood, stone, or a gem. Clearing them makes the tile passable on later visits without paying again.
- Signs and wildlife observations reveal nearby tiles once. Bridges, flowers, cacti, and stumps remain scenery.
- Portals connect to another discovered portal. A lone portal remains inactive.
- Treasure, relics, ruins, and traps resolve once. The ship stays available after an early visit; collecting all relics reveals it. Successful escape locks movement during the transition.

Rules and costs live in `src/utils/interactions.ts`. Run `npm run test:gameplay` for repeatable interaction checks.
