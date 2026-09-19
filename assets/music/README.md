# Treasure Hunter music

Place MP3, OGG, WAV, M4A, or WebM original tracks directly in `menu/`, `play/`,
`victory/`, or `defeat/`. Filenames are unrestricted. Tracks cycle in filename
order within a scene. Empty scenes are silent. Playback starts after player
interaction and pauses while the tab is hidden.

The current game uses play and victory. Menu is used before game initialization;
defeat is reserved for a future loss state, not depleted stamina.
Audio settings save separate music and effects volumes; zero mutes a channel.
Refresh development after adding files; production needs a rebuild.

## Section-based musical flow

- `loops/exploration/`: each section repeats while exploring. Only a successfully
  completed combat cue advances to the next section, in filename order, wrapping
  at the end. Other events, failed, interrupted or muted cues do not advance the section.
  These take priority over full `play/` tracks.
- `events/combat/`, `discovery/`, `relic/`, `setback/`, `rest/`, `victory/`:
  short one-shot phrases for their gameplay events. Ordinary steps and resource
  pickups use SFX only. Relic cues play once over exploration at its normal
  volume. Other cues lower the background over 300 ms, then restore it.
  Higher-priority cues replace lower ones; equal/lower cues never stack.
  Cues follow music volume, not effects volume. Hidden tabs stop cues and pause loops.
- Full tracks remain untouched and serve as fallback when no exploration loops exist.

The initial theme uses sections from `Sunken Relic Run (2).mp3`.
`scripts/music-sections.json` records editable source timestamps and output paths.
Run `python scripts/build-music-flow.py` to regenerate the clips and validation
report (`section-report.json`). This requires Python/numpy and FFmpeg on PATH.
`scripts/analyze-music.py` suggests transitions using harmony, timbre and energy;
its beat-aligned candidates are a starting point for listening adjustments.
Loop joins blend into source pre-roll without shortening the section;
event phrases have short fade-ins and fade-outs. Rendering validates decoded
duration and finite samples. These are automatically selected cuts, not a
claim of a listening-approved musical edit.
