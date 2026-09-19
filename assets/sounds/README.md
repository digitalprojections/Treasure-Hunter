# Treasure Hunter sound effects

Place MP3, OGG, WAV, M4A, or WebM files directly in event folders:
`walk/`, `attack/`, `collect/`, `hit/`, `scout/`, `escape/`, `warning/`, `rest/`.
Names describe the gameplay action. Multiple files provide random variations.
Empty folders use built-in synthesized effects; recordings override synthesis
for their event. Idle animations are always silent. Warning sounds
are limited to once every 1.2 seconds. Unknown or nested folders are ignored
and reported in the browser console.

Run `python scripts/scaffold-audio.py` to recreate the standard empty folders.
Refresh development after adding files; production needs a rebuild.
