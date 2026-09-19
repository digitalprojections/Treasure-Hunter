import { EntityType, TileType, type GameState, type Resources, type Tile, type TileVisualId } from '../types';
import { REQUIRED_RELIC_COUNT } from './mapGenerator';
import type { CharacterAnimationState } from './spritebox';

type ObjectRule = { action: string; stamina?: number; cost?: Partial<Resources>; reward?: Partial<Resources>; recovery?: number; reveal?: number };
const fight = (stamina: number, gold: number): ObjectRule => ({ action: 'Defeat', stamina, reward: { gold } });
const collect = (reward: Partial<Resources>): ObjectRule => ({ action: 'Collect', reward });
const recover = (recovery: number): ObjectRule => ({ action: 'Recover', recovery });
const clear = (cost: Partial<Resources>): ObjectRule => ({ action: 'Clear', cost });
export const TRAPPED_CACHE = { minGems: 1, maxGems: 3, minStamina: 2, maxStamina: 5 } as const;
export const objectRules: Partial<Record<TileVisualId, ObjectRule>> = {
  goblin: fight(3, 12), wolf: fight(3, 12), skeleton: fight(4, 16), harpy: fight(4, 16), orc: fight(5, 22), troll: fight(6, 28),
  turret: fight(4, 18), cannon: fight(5, 22), fireTurret: fight(6, 26), magicTurret: fight(6, 26),
  gold: collect({ gold: 20 }), goldMine: collect({ gold: 30, stone: 4 }), wood: collect({ wood: 8 }), stone: collect({ stone: 8 }),
  well: recover(6), village: recover(8),
  barricade: clear({ wood: 4 }), woodenGate: clear({ wood: 5 }), stoneGate: clear({ stone: 4 }), ironGate: clear({ stone: 5 }), magicGate: clear({ gems: 1 }),
  altar: collect({ gems: 1 }),
  roadSign: { action: 'Survey', reveal: 2 }, quest: { action: 'Survey', reveal: 3 }, random: { action: 'Investigate' },
  fish: recover(2), turtle: { action: 'Observe', reveal: 2 }, rabbit: { action: 'Observe', reveal: 2 }, deer: { action: 'Observe', reveal: 2 }, boar: { action: 'Observe', reveal: 2 }, falcon: { action: 'Observe', reveal: 3 },
};

export function describeInteraction(tile: Tile): string {
  if (tile.entity && (!tile.entityFound || tile.entity === EntityType.EXIT)) {
    if (tile.entity === EntityType.TRAP) return `Recover ${TRAPPED_CACHE.minGems}–${TRAPPED_CACHE.maxGems} gems · costs ${TRAPPED_CACHE.minStamina}–${TRAPPED_CACHE.maxStamina} stamina`;
    if (tile.entity === EntityType.EXIT) return `Embark with ${REQUIRED_RELIC_COUNT} relics`;
    return `${tile.entity.replaceAll('_', ' ')} · enter to investigate`;
  }
  if (!tile.visual || tile.visualConsumed) return 'Move · 1 stamina';
  if (tile.visual.id === 'random') return 'Investigate: gain 20 gold or lose up to 20 gold · costs 1 stamina';
  if (tile.visual.id === 'teleport') return 'Travel to another discovered portal';
  const rule = objectRules[tile.visual.id];
  if (!rule) return 'Move · 1 stamina';
  const cost = Object.entries(rule.cost ?? {}).map(([resource, amount]) => `${amount} ${resource}`).join(', ');
  return `${rule.action === 'Defeat' ? 'Attack' : rule.action} ${tile.visual.label} · ${1 + (rule.stamina ?? 0)} stamina${cost ? `, ${cost}` : ''}`;
}

export interface MoveResult {
  state: GameState;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  animation: CharacterAnimationState;
  combatTargetId?: string;
  revealedTileIds?: string[];
  achievement?: 'treasure_found' | 'relic_collected' | 'island_escape';
}

/** Resolve a complete move without UI, timers, network calls or mutation of the input. */
export function moveHero(state: GameState, x: number, y: number, random = Math.random): MoveResult {
  const reject = (message = ''): MoveResult => ({ state, message, tone: 'warning', animation: 'idle' });
  const dx = Math.abs(x - state.playerPos.x), dy = Math.abs(y - state.playerPos.y);
  if (state.isGameOver || dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return reject();
  const target = state.tiles.find(t => t.x === x && t.y === y);
  if (!target || target.type === TileType.DEEP_WATER) return reject('Deep water is impassable.');
  const activeEntity = target.entity && (!target.entityFound || target.entity === EntityType.EXIT);
  const isTrappedCache = activeEntity && target.entity === EntityType.TRAP;
  if ((isTrappedCache || (!activeEntity && target.visual?.id === 'random' && !target.visualConsumed)) && !target.discovered) {
    return { state: { ...state, tiles: state.tiles.map(t => t.id === target.id ? { ...t, discovered: true } : t) },
      message: `Encounter discovered. ${describeInteraction(target)}. Click again to choose.`, tone: 'info', animation: 'scout' };
  }
  const rule = !activeEntity && !target.visualConsumed && target.visual ? objectRules[target.visual.id] : undefined;
  const requiredStamina = isTrappedCache ? TRAPPED_CACHE.maxStamina : 1 + (rule?.stamina ?? 0);
  if (state.stamina < requiredStamina) return reject(`Need ${requiredStamina} stamina to cover this encounter. Conclude the day to rest.`);
  const roll = (min: number, max: number) => min + Math.min(max - min, Math.max(0, Math.floor(random() * (max - min + 1))));
  const staminaCost = isTrappedCache ? roll(TRAPPED_CACHE.minStamina, TRAPPED_CACHE.maxStamina) : requiredStamina;
  if (state.stamina < staminaCost) return reject(`Need ${staminaCost} stamina to ${rule?.action.toLowerCase() ?? 'move'}. Conclude the day to rest.`);
  for (const [resource, amount] of Object.entries(rule?.cost ?? {})) {
    if (state.resources[resource as keyof Resources] < amount) return reject(`Need ${amount} ${resource} to clear ${target.visual!.label}.`);
  }
  const isCombat = rule?.action === 'Defeat';
  const next: GameState = { ...state, playerPos: isCombat ? { ...state.playerPos } : { x, y }, resources: { ...state.resources }, stats: { ...state.stats }, stamina: state.stamina - staminaCost, tiles: state.tiles.map(t => ({ ...t })) };
  const current = next.tiles.find(t => t.id === target.id)!;
  const result: MoveResult = { state: next, message: '', tone: 'info', animation: 'walk' };
  if (activeEntity) {
    current.entityFound = true;
    switch (target.entity) {
      case EntityType.TREASURE:
        next.resources.gold += Math.floor(random() * 50) + 20;
        next.stats.treasuresFound++;
        result.message = 'Recovered a treasure chest.'; result.achievement = 'treasure_found'; result.animation = 'collect'; break;
      case EntityType.RELIC:
        next.stats.relicsCollected++;
        result.message = 'Recovered an ancient relic.'; result.achievement = 'relic_collected'; result.animation = 'collect';
        if (next.stats.relicsCollected >= REQUIRED_RELIC_COUNT) {
          next.tiles.filter(t => t.entity === EntityType.EXIT).forEach(t => { t.discovered = true; });
          result.message = 'All relics recovered. The ship is marked on your map.';
        }
        break;
      case EntityType.TRAP:
        const gems = roll(TRAPPED_CACHE.minGems, TRAPPED_CACHE.maxGems);
        next.resources.gems += gems; next.stats.trapsTriggered++;
        result.message = `Disarmed a trapped cache. +${gems} gem${gems === 1 ? '' : 's'} for ${staminaCost} stamina.`;
        result.animation = 'collect'; result.tone = 'success'; break;
      case EntityType.RUIN:
        next.resources.stone += 10; result.message = 'Salvaged 10 stone from the ruins.'; result.animation = 'collect'; break;
      case EntityType.VILLAGE:
        next.stamina = Math.min(next.maxStamina, next.stamina + 8); result.message = 'The villagers helped you rest.'; break;
      case EntityType.EXIT:
        if (next.stats.relicsCollected >= REQUIRED_RELIC_COUNT) {
          next.isGameOver = true; result.achievement = 'island_escape'; result.animation = 'escape'; result.message = 'Escape successful. Sailing to a new island.';
        } else {
          current.entityFound = target.entityFound; result.message = `Recover all ${REQUIRED_RELIC_COUNT} relics before embarking.`; result.tone = 'warning'; result.animation = 'scout';
        }
        break;
    }
  } else if (rule) {
    for (const [key, value] of Object.entries(rule.cost ?? {})) next.resources[key as keyof Resources] -= value;
    for (const [key, value] of Object.entries(rule.reward ?? {})) next.resources[key as keyof Resources] += value;
    const recovered = Math.min(next.maxStamina - next.stamina, rule.recovery ?? 0);
    next.stamina += recovered;
    current.visualConsumed = true;
    result.animation = isCombat ? 'attack' : rule.reveal ? 'scout' : 'collect';
    if (isCombat) result.combatTargetId = target.id;
    const gains = Object.entries(rule.reward ?? {}).map(([key, value]) => `+${value} ${key}`).join(', ');
    result.message = `${rule.action === 'Defeat' ? 'Defeated' : rule.action === 'Clear' ? 'Cleared' : rule.action === 'Observe' ? 'Observed' : rule.action === 'Survey' ? 'Surveyed' : 'Used'} ${target.visual!.label}.${gains ? ` ${gains}.` : ''}${recovered ? ` Recovered ${recovered} stamina.` : ''}${rule.reveal ? ' Nearby terrain revealed.' : ''}`;
    result.tone = 'success';
    if (target.visual?.id === 'random') {
      const won = random() < 0.5;
      const amount = won ? 20 : Math.min(20, next.resources.gold);
      next.resources.gold += won ? amount : -amount;
      result.message = won ? 'The strange marker granted 20 gold.' : `The strange marker claimed ${amount} gold.`;
      result.tone = won ? 'success' : 'warning';
      result.animation = won ? 'collect' : 'hit';
    }
  } else if (target.visual?.id === 'teleport') {
    const portal = next.tiles.find(t => t.id !== target.id && t.discovered && t.visual?.id === 'teleport' && t.type !== TileType.DEEP_WATER && !t.entity);
    if (portal) { next.playerPos = { x: portal.x, y: portal.y }; result.message = 'Travelled to the linked portal.'; result.animation = 'scout'; }
    else result.message = 'Discover another portal to activate this connection.';
  }
  const radius = rule?.reveal ?? 1;
  for (const t of next.tiles) if (Math.abs(t.x - next.playerPos.x) <= radius && Math.abs(t.y - next.playerPos.y) <= radius) t.discovered = true;
  if (rule?.action === 'Observe' && rule.reveal) {
    const known = new Set(state.tiles.filter(t => t.discovered).map(t => t.id));
    const revealed = next.tiles.filter(t => t.discovered && !known.has(t.id)).map(t => t.id);
    if (revealed.length) result.revealedTileIds = revealed;
  }
  if (result.achievement) result.tone = 'success';
  return result;
}
