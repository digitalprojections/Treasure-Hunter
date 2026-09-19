import { discoveryRewardEffect } from '../src/utils/rewardFeedback';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { TileRevealParticles } from '../src/components/TileRevealParticles';
import { revealsWithinIsland } from '../src/utils/tileReveal';
import { moveHero } from '../src/utils/interactions';
import { SynthSfx } from '../src/utils/synthSfx';
import { EntityType, TileType, type GameState, type TileVisualId } from '../src/types';
import '../src/index.css';

const root = createRoot(document.querySelector('#board')!);
const button = document.querySelector<HTMLButtonElement>('#run')!;
const output = document.querySelector<HTMLPreElement>('#result')!;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition: unknown, message: string) => { if (!condition) throw Error(message); };
button.onclick = async () => {
  button.disabled = true;
  output.textContent = 'Running';
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
  const results: { source: string; revealed: number; cleanup: string; soundRms: number }[] = [];
  try {
    await context.resume();
    for (const animal of ['relic', 'gem', 'treasure', 'turtle', 'rabbit', 'deer', 'boar', 'falcon', 'roadSign', 'quest', 'regular', 'skill']) {
      const state: GameState = {
        playerPos: { x: 2, y: 3 }, stamina: 20, maxStamina: 20, isGameOver: false,
        resources: { gold: 100, wood: 20, stone: 10, gems: 0 },
        stats: { treasuresFound: 0, relicsCollected: 0, trapsTriggered: 0, daysElapsed: 1 },
        tiles: Array.from({ length: 49 }, (_, i) => ({
          id: String(i), x: i % 7, y: Math.floor(i / 7), type: TileType.GRASS,
          discovered: Math.abs(i % 7 - 2) <= 1 && Math.abs(Math.floor(i / 7) - 3) <= 1,
          ...(i === 24 && ['relic', 'gem', 'treasure'].includes(animal)
            ? { entity: animal === 'gem' ? EntityType.TRAP : animal === 'relic' ? EntityType.RELIC : EntityType.TREASURE } : {}),
          ...(i === 24 && !['regular', 'skill', 'gem', 'relic', 'treasure'].includes(animal) ? { visual: { id: animal as TileVisualId, label: animal, tone: 'wildlife' as const } } : {}),
        })),
      };
      const result = animal === 'skill'
        ? { state: { ...state, tiles: state.tiles.map(tile => ({ ...tile, discovered: true })) } }
        : moveHero(state, 3, 3);
      const reward = discoveryRewardEffect(state, result.state, 'achievement' in result ? result.achievement : undefined);
      const ids = reward ? [reward.tileId] : revealsWithinIsland({ island: 1, tiles: state.tiles }, { island: 1, tiles: result.state.tiles });
      const kind = reward?.kind ?? (animal === 'regular' ? 'regular' : 'special');
      const revealing = new Set(ids);
      assert(revealing.size > 0, animal + ': no reveals');
      const render = () => flushSync(() => root.render(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {result.state.tiles.map(tile => <div key={tile.id} data-tile-id={tile.id}
            className={kind === 'relic' && revealing.has(tile.id) ? "tile-with-relic-effect" : undefined}
            style={{ position: 'relative', aspectRatio: '1', background: tile.discovered ? '#356957' : '#1e293b', overflow: kind === 'relic' && revealing.has(tile.id) ? 'visible' : 'hidden' }}>
            {tile.visual?.label}
            {revealing.has(tile.id) && <TileRevealParticles kind={kind} onComplete={() => { revealing.delete(tile.id); render(); }} />}
          </div>)}
        </div>
      ));
      render();
      const expected = ids.length;
      const effects = [...document.querySelectorAll<HTMLElement>('.tile-reveal')];
      assert(effects.length === expected, animal + ': particle tile mismatch');
      assert(effects.every(element => getComputedStyle(element).pointerEvents === 'none'), 'Particles intercept input');
      assert(document.querySelectorAll('.tile-reveal-spark').length === expected * (kind === 'regular' ? 0 : 8), 'Wrong animation style');
      if (kind === 'relic') {
        const effect = effects[0], tile = effect.parentElement!;
        assert(effect.getBoundingClientRect().width >= tile.getBoundingClientRect().width * 2, 'Relic effect is too small');
        assert(getComputedStyle(tile).overflow === 'visible', 'Relic effect is clipped');
        assert(parseFloat(getComputedStyle(effect).animationDuration) >= 2.4, 'Relic effect is too brief');
      }
      synth.setVolume(0.65); synth.play(reward ? 'collect' : kind === 'special' ? 'reveal' : 'walk');
      await delay(160);
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample ** 2, 0) / samples.length);
      assert(rms > 0.0001, animal + ': reveal chime produced no signal');
      await delay(kind === 'relic' ? 2500 : reward ? 1600 : 1200);
      assert(document.querySelectorAll('.tile-reveal').length === 0, animal + ': particles did not clean up');
      results.push({ source: animal, revealed: expected, cleanup: 'PASS', soundRms: rms });
      output.textContent = JSON.stringify({ result: 'RUNNING', results }, null, 2);
    }
    output.textContent = JSON.stringify({ result: 'PASS', results }, null, 2);
  } catch (error) {
    output.textContent = JSON.stringify({ result: 'FAIL', error: String(error), results }, null, 2);
  } finally {
    synth.dispose(); button.disabled = false;
  }
};

