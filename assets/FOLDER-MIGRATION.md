# Asset folder migration

The engine now enforces the folder contract. Run `npm run assets:check` to identify remaining nonconforming files. The engine does not relocate files or infer substitutes from their current locations.

## Target layout

```text
assets/
  terrain/plains/static.png
  resources/gold/static.png
  barriers/barricade/variant_01.png
  defenses/turret/level_01.png
  heroes/engineer/
    static.png             (optional portrait)
    cutout.png             (optional transparent still)
    idle/idle_001.png
    walk/walk_001.png
    damage/any_name_001.png
    death/any_name_001.png
```

README files describe what belongs in each folder. Empty action folders contain
only `.gitkeep` so Git retains them. Do not rename `.gitkeep` into an image.

Create another object:

```sh
python scripts/scaffold-object.py heroes knight --kind animated
python scripts/scaffold-object.py defenses ice_tower --kind upgradable
python scripts/scaffold-object.py structures forge --kind static
```

The prepared migration script `scripts/migrate-asset-folders.py` moves flat
images into per-object folders and converts hero portraits/cutouts to canonical
names. It preflights all destinations, refuses overwrites, and only moves files
inside this repository's assets directory. Barricade appearances stay variants.

The engine uses object-folder bindings:
42 existing tile visuals, six terrain bindings, six entity bindings, and the
existing mage action timings. Object IDs, labels and gameplay behavior remain.
Current rendering modules are backed up under ignored `tmp/folder-contract-backup`.

Asset discovery is independent from gameplay registration. Adding an image does
not invent combat stats, costs, placement rules or playable-character skills.
