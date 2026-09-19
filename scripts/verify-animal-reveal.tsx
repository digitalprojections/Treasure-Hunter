import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { TileRevealParticles } from '../src/components/TileRevealParticles';
import { moveHero } from '../src/utils/interactions';
import { SynthSfx } from '../src/utils/synthSfx';
import { TileType, type GameState, type TileVisualId } from '../src/types';
import '../src/index.css';

const root = createRoot(document.querySelector('#board')!);
const button = document.querySelector<HTMLButtonElement>('#run')!;
const output = document.querySelector<HTMLPreElement>('#result')!;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
button.onclick = async () => {
  button.disabled = true;
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  const silentOutput = context.createGain();
  silentOutput.gain.value = 0;
  analyser.connect(silentOutput); silentOutput.connect(context.destination);
  const synth = new SynthSfx(() => ({
    get state() { return context.state; },
    get currentTime() { return context.currentTime; },
    destination: analyser,
    createGain: () => context.createGain(), createOscillator: () => context.createOscillator(),
    resume: () => context.resume(), close: () => context.close(),
  }) as unknown as AudioContext);
  const results: { animal: string; revealed: number; cleanup: string; soundRms: number }[] = [];
  try {
    await context.resume();
    for (const animal of ['turtle', 'rabbit', 'deer', 'boar', 'falcon'] as TileVisualId[]) {
      const state: GameState = {
        playerPos: { x: 2, y: 3 }, stamina: 20, maxStamina: 20, isGameOver: false,
        resources: { gold: 100, wood: 20, stone: 10, gems: 0 },
        stats: { treasuresFound: 0, relicsCollected: 0, trapsTriggered: 0, daysElapsed: 1 },
        tiles: Array.from({ length: 49 }, (_, i) => ({
          id: String(i), x: i % 7, y: Math.floor(i / 7), type: TileType.GRASS,
          discovered: Math.abs(i % 7 - 2) <= 1 && Math.abs(Math.floor(i / 7) - 3) <= 1,
          ...(i === 24 ? { visual: { id: animal, label: animal, tone: 'wildlife' as const } } : {}),
        })),
      };
      const result = moveHero(state, 3, 3);
      const revealing = new Set(result.revealedTileIds);
      assert(revealing.size > 0, animal + ': no reveals');
      const render = () => flushSync(() => root.render(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {result.state.tiles.map(tile => <div key={tile.id} data-tile-id={tile.id}
            style={{ position: 'relative', aspectRatio: '1', background: tile.discovered ? '#356957' : '#1e293b', overflow: 'hidden' }}>
            {tile.visual?.label}
            {revealing.has(tile.id) && <TileRevealParticles onComplete={() => { revealing.delete(tile.id); render(); }} />}
          </div>)}
        </div>
      ));
      render();
      const expected = result.revealedTileIds!.length;
      const effects = [...document.querySelectorAll<HTMLElement>('[data-effect="animal-reveal"]')];
      assert(effects.length === expected, animal + ': particle tile mismatch');
      assert(effects.every(element => getComputedStyle(element).pointerEvents === 'none'), 'Particles intercept input');
      synth.setVolume(0.65); synth.play('reveal');
      await delay(160);
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample ** 2, 0) / samples.length);
      assert(rms > 0.0001, animal + ': reveal chime produced no signal');
      await delay(1200);
      assert(document.querySelectorAll('[data-effect="animal-reveal"]').length === 0, animal + ': particles did not clean up');
      results.push({ animal, revealed: expected, cleanup: 'PASS', soundRms: rms });
      output.textContent = JSON.stringify({ result: 'RUNNING', results }, null, 2);
    }
    output.textContent = JSON.stringify({ result: 'PASS', results }, null, 2);
  } catch (error) {
    output.textContent = JSON.stringify({ result: 'FAIL', error: String(error), results }, null, 2);
  } finally {
    synth.dispose(); button.disabled = false;
  }
};

