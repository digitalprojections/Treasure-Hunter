# Defense assets

Each tower type has its own folder: cannon, fire_turret, magic_turret, turret.
Inside, level_01.png is the base image, followed by level_02.png and higher.
All current images are 96 x 96 RGBA PNGs.

Levels are discovered automatically and rendered as static images selected by
TileVisual.level. They are never cycled as animation frames.

See [the shared asset conventions](../CONVENTIONS.md) for discovery, naming,
fallback behavior, animation folders and validation commands.
