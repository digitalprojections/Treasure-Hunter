# Treasure Hunter music

Place MP3, OGG, WAV, M4A, or WebM original tracks directly in `menu/`, `play/`,
`victory/`, or `defeat/`. Filenames are unrestricted. Exploration randomly chooses its first track when the game starts, then selects
the next track in filename order for each new island, wrapping after the last. That track repeats until the next island.
Other scene playlists cycle in filename order. Empty scenes are silent. Playback starts after player
interaction and pauses while the tab is hidden.

The current game uses play and victory. Menu is used before game initialization;
defeat is reserved for a future loss state, not depleted stamina.
Audio settings save separate music and effects volumes; zero mutes a channel.
Refresh development after adding files; production needs a rebuild.

## Section-based musical flow

- `loops/exploration/`: the starting section is random; a new island selects the next section
  and repeats throughout that island. Combat, discoveries, relics, rest, setbacks
  and victory cues never change or restart the background track. Reaching the next
  island (or generating a new map) selects the next track in filename order.
  These take priority over full `play/` tracks; the same one-track-per-island rule
  also applies to the full-track fallback.
- `events/combat/`, `discovery/`, `relic/`, `setback/`, `rest/`, `victory/`:
  short one-shot phrases for their gameplay events. Ordinary steps and resource
  pickups use SFX only. Every cue plays over the main loop at its selected volume.
  Cues never pause, restart, lower or raise the background. Only the overlays
  fade in and out. Higher-priority cues crossfade over lower ones; equal/lower cues never stack.
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

## Transition checks

Island track changes and loop boundaries overlap for one second using
equal-power fades. The previous section continues while the next loads. Cue
entries overlap over 240 ms; mute and hidden-tab pause stop every active layer.

Run `npm run test:music` for deterministic transition and lifecycle regressions.
With the development server running, open `/scripts/verify-music-playback.html`
and choose **Run playback check**. This plays the actual clips through a browser
audio analyser, checks overlapping transitions and silence gaps, then stops all
playback. The report covers runtime continuity; listen as well when changing
the clips or tuning their musical phrasing.
