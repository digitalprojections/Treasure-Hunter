# Treasure Hunter sound effects

Place MP3, OGG, WAV, M4A, or WebM files directly in event folders:
`walk/`, `attack/`, `collect/`, `hit/`, `scout/`, `escape/`, `warning/`, `rest/`, `reveal/`.
Names describe the gameplay action. Multiple files provide random variations.
Empty folders use built-in synthesized effects; recordings override synthesis
for their event. Idle animations are always silent. Warning sounds
are limited to once every 1.2 seconds. Unknown or nested folders are ignored
and reported in the browser console.

Run `python scripts/scaffold-audio.py` to recreate the standard empty folders.
Refresh development after adding files; production needs a rebuild.

Special terrain reveals use one rising reveal chime per action, synchronized with
particles on newly discovered tiles. This uses the sound-effects volume and
never changes the background music. Already known tiles do not trigger it.

For a repeatable browser check, open `/scripts/verify-tile-reveals.html` on the
development server. It verifies animals, survey objects, skill-driven discoveries, ordinary reveals,
particle cleanup and real
synthesized audio signal while keeping test output muted.
