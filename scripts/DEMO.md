# Treasure Hunter live demo

Open `?demo=1` or choose **Start self-playing demo** in Settings, then press **Start demo** to enable music. The 18x18 game map uses the same `TileComponent`, `SpriteBox`, and `TileRevealParticles` as normal gameplay. Live DOM actors move, fight, spawn loot, reveal fog, and update counters from the beat sequence. There is no canvas renderer, video, waveform, scrubber, or cinematic player UI.

Pause/resume, mute, and exit controls stay in the game header. The song and expedition repeat automatically. Switching tabs pauses. Exit starts a new normal game. The demo does not award account points or make gameplay API calls.

To replace the theme recording, update `assets/music/events/demo/sunken.wav` and run `npm run demo:analyze` (Python: librosa, numpy, scipy, soundfile). The generated score contains source SHA-256, duration, estimated tempo and individual beat times. The live sequence and route tests are in `src/utils/demoSequence.test.ts`.
