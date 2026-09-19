import { needsCameraFollow } from './utils/mapCamera';
import { discoveryRewardEffect } from './utils/rewardFeedback';
import { revealsWithinIsland, type RevealSnapshot, type TileRevealEffect, type TileRevealKind } from './utils/tileReveal';
import { TileRevealParticles } from './components/TileRevealParticles';
import { appendLog, type ExpeditionLog } from './utils/expeditionLog';
import { useGameAudio } from './useGameAudio';
import { musicCueForOutcome } from './utils/musicFlow';
import { statSymbols } from './data/statSymbols';
import { useRandomIdle } from './useRandomIdle';
import { getActorIdleDuration } from './utils/actorIdle';
import { createIdlePlayback, advanceIdlePlayback } from './utils/idlePlayback';
import { version as appVersion } from '../package.json';
import { moveHero, describeInteraction, TRAPPED_CACHE } from './utils/interactions';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Skull, 
  Map as MapIcon, 
  Compass, 
  Telescope, 
  Settings, 
  Coins, 
  Trees, 
  Mountain as MountainIcon, 
  Sparkles,
  Shield,
  Calendar
} from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Tile, TileType, EntityType, GameState } from './types';
import { generateIsland, getStartingPosition, REQUIRED_RELIC_COUNT } from './utils/mapGenerator';
import { entitySpriteBoxes, symbolSpriteBoxes, tileTerrainSpriteBoxes, visualSpriteBoxes } from './data/spriteboxes';
import { getObjectSpriteBox } from './data/objectAssets';
import { activeCharacter } from './data/characters';
import { SpriteBox } from './SpriteBox';
import { CharacterAnimationState, getHorizontalFacingAfterMove, HorizontalFacing, SpriteBoxModule } from './utils/spritebox';
import { canUseCharacterSkill, CharacterSkill, getSkillCostLabel, spendSkillCost, startSkillCooldown, tickSkillCooldowns } from './utils/characterSkills';
import { classifyTerrainTiles, TerrainTileClassification } from './utils/terrainTiles';
import { getTileAssetPresentation } from './utils/tileVisualPresentation';
import { cn } from './utils/styles';

const GAMES_API_BASE_URL = (import.meta.env.VITE_GAMES_API_URL || '').replace(/\/$/, '');

function gameApiUrl(path: string) {
  return `${GAMES_API_BASE_URL}${path}`;
}

type PointsAwardResponse = {
  awarded: number;
  reason?: string;
  transaction_id?: string;
  balance_after?: number;
  totals?: {
    earned_today: number;
    playtime_earned_today: number;
    achievement_earned_today: number;
    daily_cap: number;
    playtime_daily_cap: number;
    achievement_daily_cap: number;
  };
};

type GameSessionResponse = {
  session_id: string;
  totals?: PointsAwardResponse['totals'];
};

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const playerAnimationDurationMs: Record<CharacterAnimationState, number> = {
  idle: 0,
  attack: 1120,
  walk: 520,
  scout: 900,
  collect: 900,
  hit: 760,
  escape: 2400,
};

// Decorative icons retain adjacent text labels and numeric values.
const StatIcon = ({ src, fallback }: { src?: string, fallback: React.ReactNode }) => {
  const [failed, setFailed] = useState(false);
  return !src || failed || src.startsWith('data:') ? <>{fallback}</> :
    <img data-stat-symbol src={src} alt="" aria-hidden="true" draggable={false}
      className="h-6 w-6 shrink-0 object-contain" onError={() => setFailed(true)} />;
};

// Sub-components
const ResourceItem = ({ icon: Icon, image, value, label, color }: { icon: any, image?: string, value: number, label: string, color: string }) => (
  <div className="flex shrink-0 items-center gap-2 bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 rounded-md shadow-inner">
    <div className={cn("p-1 rounded-full bg-opacity-20", color)}>
      <StatIcon src={image} fallback={<Icon size={16} className={color.replace('bg-', 'text-')} />} />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] text-slate-500 font-bold uppercase leading-none tracking-wider">{label}</span>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  </div>
);

const SidebarSection = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: any }) => (
  <div className="sidebar-card bg-slate-900 border border-slate-800 rounded-lg shadow-xl">
    <div className="sidebar-card-heading flex items-center gap-2 border-b border-slate-800">
      {Icon && <Icon size={14} className="text-slate-500" />}
      <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{title}</h3>
    </div>
    {children}
  </div>
);

interface LogItemProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  count: number;
}

const LogItem: React.FC<LogItemProps> = ({ message, type, timestamp, count }) => {
  const colors = {
    info: 'text-slate-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400'
  };
  return (
    <div key={count} data-repeat-count={count} data-tone={type || 'info'} className={cn("expedition-message text-[11px] font-mono mb-3", count > 1 && "notice-repeat", colors[type || 'info'])}>
      <span className="opacity-50 mr-2">[{timestamp}]</span>
      {message}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [islandNumber, setIslandNumber] = useState(0);
  const [tileReveals, setTileReveals] = useState<Record<string, TileRevealEffect>>({});
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const mapViewport = useRef<HTMLElement | null>(null);
  const cameraFrame = useRef<number | null>(null);
  const stopCamera = useCallback(() => {
    if (cameraFrame.current !== null) cancelAnimationFrame(cameraFrame.current);
    cameraFrame.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);
  const centerHero = useCallback(() => {
    const viewport = mapViewport.current;
    const hero = viewport?.querySelector<HTMLElement>('.tile-current-hero');
    if (!viewport || !hero || window.innerWidth >= 1024) return;
    const bounds = viewport.getBoundingClientRect(), target = hero.getBoundingClientRect();
    stopCamera();
    const startX = viewport.scrollLeft, startY = viewport.scrollTop;
    const endX = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, startX + target.left - bounds.left - (viewport.clientWidth - target.width) / 2));
    const endY = Math.max(0, Math.min(viewport.scrollHeight - viewport.clientHeight, startY + target.top - bounds.top - (viewport.clientHeight - target.height) / 2));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      viewport.scrollTo({ left: endX, top: endY, behavior: 'instant' });
      return;
    }
    const started = performance.now();
    const glide = (now: number) => {
      const progress = Math.min(1, (now - started) / 1000);
      const eased = progress * progress * (3 - 2 * progress);
      viewport.scrollTo({ left: startX + (endX - startX) * eased, top: startY + (endY - startY) * eased, behavior: 'instant' });
      cameraFrame.current = progress < 1 ? requestAnimationFrame(glide) : null;
    };
    cameraFrame.current = requestAnimationFrame(glide);
  }, [stopCamera]);
  useEffect(() => {
    const frame = requestAnimationFrame(centerHero);
    window.addEventListener('resize', centerHero);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', centerHero); };
  }, [islandNumber, mobilePanelOpen, centerHero]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const viewport = mapViewport.current;
      const hero = viewport?.querySelector<HTMLElement>('.tile-current-hero');
      if (!viewport || !hero) return;
      const bounds = viewport.getBoundingClientRect(), target = hero.getBoundingClientRect();
      if (needsCameraFollow(target.left - bounds.left + target.width / 2,
        target.top - bounds.top + target.height / 2, viewport.clientWidth, viewport.clientHeight)) centerHero();
    });
    return () => cancelAnimationFrame(frame);
  }, [gameState?.playerPos.x, gameState?.playerPos.y, centerHero]);
  const revealRevision = useRef(0);
  const pendingRevealKind = useRef<TileRevealKind>('regular');
  const previousRevealState = useRef<RevealSnapshot | null>(null);
  const finishTileReveal = useCallback((tileId: string, revision: number) => {
    setTileReveals(current => {
      if (current[tileId]?.revision !== revision) return current;
      const next = { ...current };
      delete next[tileId];
      return next;
    });
  }, []);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const { volumes, setVolumes, playSound, playMusicEvent, musicStatus } = useGameAudio(!gameState ? 'menu' : gameState.isGameOver ? 'victory' : 'play', islandNumber);
  useEffect(() => {
    if (!gameState) { previousRevealState.current = null; return; }
    const snapshot = { island: islandNumber, tiles: gameState.tiles };
    const ids = revealsWithinIsland(previousRevealState.current, snapshot);
    previousRevealState.current = snapshot;
    const kind = pendingRevealKind.current;
    pendingRevealKind.current = 'regular';
    if (!ids.length) return;
    const revision = ++revealRevision.current;
    setTileReveals(current => {
      const next = { ...current };
      for (const id of ids) {
        const existing = current[id]?.kind;
        if (!existing || existing === 'regular' || existing === 'special') next[id] = { revision, kind };
      }
      return next;
    });
    if (kind === 'special') playSound('reveal');
  }, [gameState, islandNumber, playSound]);
  const [logs, setLogs] = useState<ExpeditionLog[]>([]);
  const [cacheOffer, setCacheOffer] = useState<{ x: number; y: number; kind: 'cache' | 'marker' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointsEarnedToday, setPointsEarnedToday] = useState(0);
  const [spriteClockMs, setSpriteClockMs] = useState(0);
  const [playerAnimation, setPlayerAnimation] = useState<CharacterAnimationState>('idle');
  const [idleElapsedMs, setIdleElapsedMs] = useState(0);
  const [animationRevision, setAnimationRevision] = useState(0);
  const [combat, setCombat] = useState<{ targetId: string; startedAt: number; dx: number; dy: number } | null>(null);
  const combatTimeoutRef = useRef<number | null>(null);
  const [playerFacing, setPlayerFacing] = useState<HorizontalFacing>('right');
  const gameSessionIdRef = useRef(createSessionId());
  const sharedApiSessionIdRef = useRef<string | null>(null);
  const [sharedApiSessionId, setSharedApiSessionId] = useState<string | null>(null);
  const playerAnimationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const startedAt = performance.now();
    const intervalId = window.setInterval(() => {
      setSpriteClockMs(performance.now() - startedAt);
    }, 120);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return () => {
      if (combatTimeoutRef.current !== null) window.clearTimeout(combatTimeoutRef.current);
      if (playerAnimationTimeoutRef.current !== null) {
        window.clearTimeout(playerAnimationTimeoutRef.current);
      }
    };
  }, []);

  const playPlayerAnimation = useCallback((animation: CharacterAnimationState) => {
    if (playerAnimationTimeoutRef.current !== null) {
      window.clearTimeout(playerAnimationTimeoutRef.current);
      playerAnimationTimeoutRef.current = null;
    }

    setPlayerAnimation(animation);
    setAnimationRevision(value => value + 1);

    const duration = playerAnimationDurationMs[animation];
    if (duration > 0) {
      playerAnimationTimeoutRef.current = window.setTimeout(() => {
        setPlayerAnimation('idle');
        playerAnimationTimeoutRef.current = null;
      }, duration);
    }
  }, []);

  useEffect(() => {
    setIdleElapsedMs(0);
    const idle = activeCharacter.spriteBoxes.idle;
    if (loading || gameState?.isGameOver || playerAnimation !== 'idle' || idle.kind !== 'looper' || idle.frames.length < 2) return;
    const durationMs = idle.frames.length * idle.frameMs;
    let playback = createIdlePlayback(performance.now());
    const timer = window.setInterval(() => {
      const now = performance.now();
      playback = document.hidden
        ? createIdlePlayback(now)
        : advanceIdlePlayback(playback, now, durationMs);
      setIdleElapsedMs(playback.elapsedMs);
    }, 60);
    return () => window.clearInterval(timer);
  }, [playerAnimation, animationRevision, loading, gameState?.isGameOver]);

  // Initialize Game
  const startNewGame = useCallback(() => {
    if (combatTimeoutRef.current !== null) window.clearTimeout(combatTimeoutRef.current);
    combatTimeoutRef.current = null;
    setCombat(null);
    setTileReveals({});
    setCacheOffer(null);
    playPlayerAnimation('idle');
    gameSessionIdRef.current = createSessionId();
    setIslandNumber(number => number + 1);
    const tiles = generateIsland();
    const startPos = getStartingPosition(tiles);
    
    // Discover starting tile and neighbors
    const initialTiles = tiles.map(t => {
      if (Math.abs(t.x - startPos.x) <= 1 && Math.abs(t.y - startPos.y) <= 1) {
        return { ...t, discovered: true };
      }
      return t;
    });

    setGameState({
      tiles: initialTiles,
      playerPos: startPos,
      resources: { gold: 100, wood: 20, stone: 10, gems: 0 },
      stamina: 20,
      maxStamina: 20,
      stats: { treasuresFound: 0, relicsCollected: 0, trapsTriggered: 0, daysElapsed: 1 },
      isGameOver: false,
      skillCooldowns: {},
    });
    setLogs([{ id: createSessionId(), count: 1, message: "Shipwrecked! You've landed on a mysterious island...", type: 'warning', timestamp: new Date().toLocaleTimeString([], { hour12: false }) }]);
  }, [playPlayerAnimation]);

  // Auth Handling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setPointsEarnedToday(0);
      sharedApiSessionIdRef.current = null;
      setSharedApiSessionId(null);
      setLoading(false);
      startNewGame();
    });
    return unsubscribe;
  }, [startNewGame]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    const incoming = { id: createSessionId(), count: 1, message, type, timestamp };
    setLogs(prev => appendLog(prev, incoming));
  };

  const applyPointsResult = (result: PointsAwardResponse, label: string, quiet = false) => {
    if (typeof result.totals?.earned_today === 'number') {
      setPointsEarnedToday(result.totals.earned_today);
    }

    if (quiet) return;

    if (result.awarded > 0) {
      const suffix = result.reason === 'points_ledger_not_configured' ? ' (ledger not configured yet)' : '';
      addLog(`Earned ${result.awarded} point${result.awarded === 1 ? '' : 's'} for ${label}.${suffix}`, 'success');
    } else if (result.reason === 'daily_cap_reached' || result.reason === 'achievement_event_cap_reached') {
      addLog(`Point cap reached for ${label}.`, 'warning');
    }
  };

  const postGameEvent = async <T,>(path: string, body: Record<string, unknown>) => {
    if (!user) return null;

    const token = await user.getIdToken();
    const response = await fetch(gameApiUrl(path), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Points request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const startSharedGameSession = async () => {
      try {
        const result = await postGameEvent<GameSessionResponse>('/api/games/treasure-hunter/session', {});
        if (!cancelled && result?.session_id) {
          sharedApiSessionIdRef.current = result.session_id;
          setSharedApiSessionId(result.session_id);
          if (typeof result.totals?.earned_today === 'number') {
            setPointsEarnedToday(result.totals.earned_today);
          }
        }
      } catch (error) {
        console.error('Shared game session failed:', error);
        if (!cancelled) {
          addLog('Shared game services are unavailable.', 'warning');
        }
      }
    };

    startSharedGameSession();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const postPointsEvent = async (path: string, body: Record<string, unknown>) => {
    const sessionId = sharedApiSessionIdRef.current;
    if (!sessionId) return null;

    return postGameEvent<PointsAwardResponse>(path, {
      ...body,
      sessionId,
    });
  };

  const awardAchievement = async (type: 'treasure_found' | 'relic_collected' | 'island_escape', eventId: string, label: string) => {
    if (!user || !sharedApiSessionIdRef.current) return;

    try {
      const result = await postPointsEvent('/api/games/treasure-hunter/achievement', { type, eventId });
      if (result) applyPointsResult(result, label);
    } catch (error) {
      console.error('Achievement points failed:', error);
      addLog('Point award service is unavailable.', 'warning');
    }
  };

  useEffect(() => {
    if (!user || !sharedApiSessionId) return;

    let stopped = false;

    const claimPlaytime = async (quiet = false) => {
      if (document.visibilityState === 'hidden') return;

      try {
        const result = await postPointsEvent('/api/games/treasure-hunter/playtime', {});

        if (!stopped && result) {
          applyPointsResult(result, 'active exploration', quiet || result.awarded === 0);
        }
      } catch (error) {
        console.error('Playtime points failed:', error);
        if (!quiet && !stopped) {
          addLog('Playtime points could not be recorded.', 'warning');
        }
      }
    };

    claimPlaytime(true);
    const intervalId = window.setInterval(() => claimPlaytime(false), 60000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') claimPlaytime(true);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, sharedApiSessionId]);

  const handleMove = (x: number, y: number, acceptCache = false) => {
    if (!gameState || combatTimeoutRef.current !== null) return;
    const clicked = gameState.tiles.find(tile => tile.x === x && tile.y === y);
    if (!acceptCache && clicked && ((clicked.entity === EntityType.TRAP && !clicked.entityFound) || (!clicked.entity && clicked.visual?.id === 'random' && !clicked.visualConsumed)) && clicked.discovered &&
        !gameState.isGameOver && Math.max(Math.abs(x - gameState.playerPos.x), Math.abs(y - gameState.playerPos.y)) === 1) {
      setCacheOffer({ x, y, kind: clicked.entity === EntityType.TRAP ? 'cache' : 'marker' });
      return;
    }
    setCacheOffer(null);
    const result = moveHero(gameState, x, y);
    if (result.combatTargetId) {
      setPlayerFacing(current => getHorizontalFacingAfterMove(current, gameState.playerPos.x, x));
      setCombat({ targetId: result.combatTargetId, startedAt: performance.now(),
        dx: x - gameState.playerPos.x, dy: y - gameState.playerPos.y });
      playPlayerAnimation('attack');
      playSound('attack');
      playMusicEvent('combat');
      combatTimeoutRef.current = window.setTimeout(() => {
        pendingRevealKind.current = 'special';
        setGameState(result.state);
        addLog(result.message, result.tone);
        setCombat(null);
        combatTimeoutRef.current = null;
      }, playerAnimationDurationMs.attack);
      return;
    }
    if (result.message) addLog(result.message, result.tone);
    if (result.state === gameState) {
      if (result.message && (result.tone === 'warning' || result.tone === 'error')) playSound('warning');
      return;
    }
    pendingRevealKind.current = result.animation === 'walk' ? 'regular' : 'special';
    if (result.animation !== 'idle' && (!result.revealedTileIds?.length || pendingRevealKind.current === 'regular')) {
      playSound(result.animation);
    }
    const rewardEffect = discoveryRewardEffect(gameState, result.state, result.achievement);
    if (rewardEffect) {
      const revision = ++revealRevision.current;
      setTileReveals(current => ({ ...current, [rewardEffect.tileId]: { revision, kind: rewardEffect.kind } }));
    }
    const musicCue = musicCueForOutcome(result);
    if (musicCue) playMusicEvent(musicCue);
    setPlayerFacing(current => getHorizontalFacingAfterMove(current, gameState.playerPos.x, result.state.playerPos.x));
    playPlayerAnimation(result.animation);
    setGameState(result.state);
    if (result.achievement) {
      const target = gameState.tiles.find(t => t.x === x && t.y === y)!;
      awardAchievement(result.achievement, `${gameSessionIdRef.current}:${result.achievement}:${target.id}`, result.message);
      if (result.achievement === 'island_escape') setTimeout(startNewGame, 3000);
    }
  };

  const chargeSkill = (state: GameState, skill: CharacterSkill): GameState => {
    const chargedState = spendSkillCost(state, skill);
    return {
      ...chargedState,
      skillCooldowns: startSkillCooldown(chargedState.skillCooldowns, skill),
    };
  };

  const handleUseSkill = async (skill: CharacterSkill) => {
    if (combatTimeoutRef.current !== null) return;
    if (!gameState || gameState.isGameOver) return;

    const availability = canUseCharacterSkill(skill, gameState);
    if (!availability.canUse) {
      addLog(availability.reason || `${skill.label} is unavailable.`, 'error');
      return;
    }

    if (skill.id === 'relic_survey') {
      const relics = gameState.tiles.filter(t => t.entity === EntityType.RELIC && !t.entityFound);
      if (relics.length === 0) {
        addLog('No unrecovered relic signals detected.', 'warning');
        return;
      }
    }

    playPlayerAnimation(skill.animation);
    if (skill.id === 'archive_clue' && skill.animation !== 'idle') playSound(skill.animation);

    if (skill.id === 'archive_clue') {
      addLog('Consulting the archives...', 'info');
      try {
        const response = await fetch(gameApiUrl('/api/games/treasure-hunter/clue'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameState }),
        });
        const data = await response.json();
        if (data.clue) {
          addLog(`ARCHIVE: ${data.clue}`, 'warning');
          setGameState(prev => prev ? chargeSkill(prev, skill) : null);
        }
      } catch (e) {
        addLog('The archives are silent.', 'error');
      }
      return;
    }

    pendingRevealKind.current = 'special';
    setGameState(prev => {
      if (!prev) return null;
      const { x, y } = prev.playerPos;
      const range = skill.range;
      let message = '';
      let logType: 'info' | 'success' | 'warning' | 'error' = 'info';
      let changedTiles = prev.tiles;

      if (skill.id === 'scout_area') {
        changedTiles = prev.tiles.map(t => {
          if (Math.abs(t.x - x) <= range && Math.abs(t.y - y) <= range) {
            return { ...t, discovered: true };
          }
          return t;
        });
        message = 'Scouting complete. Local map updated.';
      }

      if (skill.id === 'relic_survey') {
        const nearest = prev.tiles.find(t => t.entity === EntityType.RELIC && !t.entityFound);
        changedTiles = prev.tiles.map(t => {
          if (nearest && t.id === nearest.id) return { ...t, discovered: true };
          return t;
        });
        message = 'Relic signal triangulated.';
        logType = 'success';
      }

      if (skill.id === 'trap_ward') {
        let trapsRevealed = 0;
        changedTiles = prev.tiles.map(t => {
          const inRange = Math.abs(t.x - x) <= range && Math.abs(t.y - y) <= range;
          if (inRange && t.entity === EntityType.TRAP && !t.entityFound) {
            trapsRevealed += 1;
            return { ...t, discovered: true };
          }
          return t;
        });
        message = trapsRevealed > 0 ? `Ward revealed ${trapsRevealed} trapped cache${trapsRevealed === 1 ? '' : 's'}.` : 'No trapped caches nearby.';
        logType = trapsRevealed > 0 ? 'success' : 'info';
      }

      if (message) addLog(message, logType);
      return {
        ...chargeSkill(prev, skill),
        tiles: changedTiles,
      };
    });
  };
  const handleEndTurn = () => {
    if (combatTimeoutRef.current !== null) return;
    if (!gameState) return;
    playSound('rest');
    playMusicEvent('rest');
    setGameState(prev => {
      if (!prev) return null;
      const recoveredStamina = Math.min(prev.maxStamina, prev.stamina + 10);
      addLog(`Day ${prev.stats.daysElapsed} concludes. You rested and recovered 10 stamina.`, 'warning');
      return {
        ...prev,
        stamina: recoveredStamina,
        stats: { ...prev.stats, daysElapsed: prev.stats.daysElapsed + 1 },
        skillCooldowns: tickSkillCooldowns(prev.skillCooldowns)
      };
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const terrainClassifications = useMemo(
    () => gameState ? classifyTerrainTiles(gameState.tiles) : new Map<string, TerrainTileClassification>(),
    [gameState?.tiles],
  );

  if (loading) return <div className="flex items-center justify-center h-[100dvh] bg-[#0F172A] text-slate-400 font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Expedition Data...</div>;

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0F172A] text-slate-100 font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col border-4 lg:border-8 border-slate-900">
      {cacheOffer && (
        <div className="encounter-overlay fixed inset-0 z-[100] flex items-center justify-center p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="cache-offer-title"
            onKeyDown={event => { if (event.key === 'Escape') setCacheOffer(null); }}
            className="encounter-frame w-full max-w-md">
            <div aria-hidden="true" className="encounter-crest"><Compass size={24} /></div>
            <p className="encounter-eyebrow">Expedition encounter</p>
            <h2 id="cache-offer-title" className="text-xl font-bold text-amber-100">{cacheOffer.kind === 'cache' ? 'Trapped cache' : 'Strange marker'}</h2>
            <p className="my-4 text-sm leading-relaxed text-slate-100">{cacheOffer.kind === 'cache' ? `Recover ${TRAPPED_CACHE.minGems}–${TRAPPED_CACHE.maxGems} gems for ${TRAPPED_CACHE.minStamina}–${TRAPPED_CACHE.maxStamina} stamina, including movement. Both amounts are random. Requires ${TRAPPED_CACHE.maxStamina} stamina to accept.` : 'Equal chance to gain 20 gold or lose up to 20 gold. Investigating costs 1 stamina, including movement.'}</p>
            {(gameState?.stamina ?? 0) < (cacheOffer.kind === 'cache' ? TRAPPED_CACHE.maxStamina : 1) && <p className="mb-3 text-sm text-amber-300">Rest to recover enough stamina.</p>}
            <div className="flex gap-3">
              <button autoFocus className="encounter-choice flex-1 px-3 py-2.5" onClick={() => setCacheOffer(null)}>Leave it</button>
              <button className="encounter-choice encounter-choice-primary flex-1 px-3 py-2.5 font-bold disabled:opacity-40"
                disabled={(gameState?.stamina ?? 0) < (cacheOffer.kind === 'cache' ? TRAPPED_CACHE.maxStamina : 1)}
                onClick={() => handleMove(cacheOffer.x, cacheOffer.y, true)}>{cacheOffer.kind === 'cache' ? 'Open cache' : 'Investigate'}</button>
            </div>
          </section>
        </div>
      )}
      {/* Header */}
      <header className="game-header shrink-0 bg-slate-800/50 border-b border-slate-700 flex flex-wrap lg:flex-nowrap items-center gap-2 px-2 sm:px-4 lg:px-6 py-2 justify-between shadow-2xl z-20 backdrop-blur-sm">
        <div className="header-primary min-w-0 flex flex-1 flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-4">
          <div className="game-brand flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded flex shrink-0 items-center justify-center text-slate-900 font-bold shadow-lg shadow-amber-500/20">
              <MapIcon size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tighter uppercase text-white leading-none truncate">
                Treasure Hunter <span className="text-amber-500 text-sm">v{appVersion}</span>
              </h1>
              <p className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Procedural Expeditions</p>
            </div>
          </div>

          <div className="hidden lg:block h-8 w-[1px] bg-slate-700 mx-1" />

          <div className="resource-strip flex min-w-0 flex-1 gap-2 sm:gap-3 overflow-x-auto pb-1 lg:pb-0">
            <ResourceItem icon={Coins} image={statSymbols.gold} value={Math.max(0, gameState?.resources.gold || 0)} label="Gold" color="bg-amber-500" />
            <ResourceItem icon={Trees} image={statSymbols.wood} value={gameState?.resources.wood || 0} label="Wood" color="bg-emerald-500" />
            <ResourceItem icon={MountainIcon} image={statSymbols.stone} value={gameState?.resources.stone || 0} label="Stone" color="bg-slate-400" />
            <ResourceItem icon={Sparkles} image={statSymbols.gems} value={gameState?.resources.gems || 0} label="Gems" color="bg-purple-500" />
            {user && <ResourceItem icon={Trophy} image={statSymbols.points} value={pointsEarnedToday} label="Pts Today" color="bg-cyan-500" />}
          </div>
        </div>

        <div className="header-account flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="day-stamina flex gap-3 sm:gap-4 items-center bg-slate-900/80 px-3 sm:px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Day</span>
              <span className="text-xs font-mono font-bold text-amber-500">{gameState?.stats.daysElapsed}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800"></div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-tighter"><StatIcon src={statSymbols.stamina} fallback={null} />Stamina</span>
              <span className={cn("text-xs font-mono font-bold", (gameState?.stamina || 0) < 5 ? "text-red-500 animate-pulse" : "text-emerald-400")}>
                {gameState?.stamina} / {gameState?.maxStamina}
              </span>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/80 p-1 sm:pr-4 rounded-full border border-slate-700 shadow-md">
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-slate-700 shadow-sm" alt="User" />
              <button onClick={() => signOut(auth)} className="hidden sm:block text-[10px] font-bold text-slate-500 hover:text-white uppercase transition-colors tracking-widest">Logout</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 px-3 sm:px-6 py-2 bg-white text-slate-900 rounded font-bold text-xs sm:text-sm shadow-xl hover:opacity-90 transition-all active:scale-95 uppercase tracking-tight">
              Sign In
            </button>
          )}
          <button onClick={() => setAudioSettingsOpen(true)} aria-label="Audio settings" className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="mobile-vitals"><span>Day {gameState?.stats.daysElapsed}</span><span>Stamina <strong>{gameState?.stamina}/{gameState?.maxStamina}</strong></span></div>
      <div className="mobile-map-toolbar">
        <button onClick={() => setMobilePanelOpen(open => !open)} aria-expanded={mobilePanelOpen} aria-controls="expedition-panel">{mobilePanelOpen ? 'Close details' : 'Skills & details'}</button>
        <span role="status">{(gameState?.stats.relicsCollected ?? 0) >= REQUIRED_RELIC_COUNT ? 'All relics recovered · Return to ship' : `Relics ${gameState?.stats.relicsCollected ?? 0}/${REQUIRED_RELIC_COUNT}`}</span>
        <button onClick={centerHero}>Center hero</button>
      </div>
      <main className="game-layout min-h-0 flex-1 grid overflow-hidden">
        {/* Sidebar Controls */}
        <aside id="expedition-panel" data-mobile-open={mobilePanelOpen} className="expedition-panel min-h-0 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 shadow-2xl z-10">
          <section>
            <h3 className="panel-heading font-bold text-slate-500 uppercase">Current Expedition</h3>
            <div className="expedition-summary">
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-300">Island Map 09-X</span>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">Active</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (gameState?.tiles.filter(t => t.discovered).length || 0) / (gameState?.tiles.length || 1) * 100)}%` }}
                    className="bg-emerald-500 h-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter flex justify-between">
                  <span className="flex items-center gap-2"><StatIcon src={statSymbols.exploration} fallback={null} />Exploration Progress</span>
                  <span>{Math.round((gameState?.tiles.filter(t => t.discovered).length || 0) / (gameState?.tiles.length || 1) * 100)}%</span>
                </div>
              </div>
            </div>
          </section>

          <SidebarSection title="Field Manual">
            <div className="legend-grid grid grid-cols-2">
              <LegendItem label="Deep Water" spriteBox={tileTerrainSpriteBoxes[TileType.DEEP_WATER]} color="bg-blue-950" />
              <LegendItem label="Water" spriteBox={tileTerrainSpriteBoxes[TileType.WATER]} color="bg-blue-800" />
              <LegendItem label="Sand" spriteBox={tileTerrainSpriteBoxes[TileType.SAND]} color="bg-amber-300" />
              <LegendItem label="Grass" spriteBox={tileTerrainSpriteBoxes[TileType.GRASS]} color="bg-emerald-700" />
              <LegendItem label="Forest" spriteBox={tileTerrainSpriteBoxes[TileType.FOREST]} color="bg-emerald-950" />
              <LegendItem label="Mountain" spriteBox={tileTerrainSpriteBoxes[TileType.MOUNTAIN]} color="bg-slate-600" />
              <div className="legend-entities col-span-2 grid grid-cols-2 border-t border-slate-800 opacity-80">
                <LegendItem label="Treasure" color="bg-transparent" spriteBox={entitySpriteBoxes[EntityType.TREASURE]} />
                <LegendItem label="Relic" color="bg-transparent" spriteBox={entitySpriteBoxes[EntityType.RELIC]} />
                <LegendItem label="Trapped Cache" color="bg-transparent" spriteBox={entitySpriteBoxes[EntityType.TRAP]} />
                <LegendItem label="Ruin" color="bg-transparent" spriteBox={entitySpriteBoxes[EntityType.RUIN]} />
                <LegendItem label="Exit Port" color="bg-transparent" spriteBox={entitySpriteBoxes[EntityType.EXIT]} />
              </div>
            </div>
          </SidebarSection>

          <section>
            <h3 className="panel-heading font-bold text-slate-500 uppercase">Relic Discovery</h3>
            <div className="relic-stats">
              {gameState && gameState.stats.relicsCollected >= REQUIRED_RELIC_COUNT && !gameState.isGameOver && (
                <div className="relic-completion-notice" role="status">
                  <Trophy size={22} aria-hidden="true" />
                  <div><strong>All relics recovered</strong><span>Return to the ship</span></div>
                </div>
              )}
              <div className="flex items-center justify-between p-1.5 bg-slate-800/30 rounded border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Trophy size={14} className="text-amber-500" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total Relics</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-500">{gameState?.stats.relicsCollected} / {REQUIRED_RELIC_COUNT}</span>
              </div>
              
              <div className="flex items-center justify-between p-1.5 bg-slate-800/30 rounded border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <StatIcon src={statSymbols.traps} fallback={<Skull size={14} className="text-red-500" />} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Caches Disarmed</span>
                </div>
                <span className="font-mono text-xs font-bold text-red-400">{gameState?.stats.trapsTriggered}</span>
              </div>
            </div>
          </section>

          <SidebarSection title={`${activeCharacter.label} Skills`}>
            <div className="skill-grid grid grid-cols-2 text-white">
              {activeCharacter.skills.map((skill) => {
                const availability = gameState ? canUseCharacterSkill(skill, gameState) : { canUse: false };
                const Icon = getSkillIcon(skill.id);
                const cooldown = gameState?.skillCooldowns?.[skill.id] ?? 0;

                return (
                  <button
                    key={skill.id}
                    onClick={() => handleUseSkill(skill)}
                    disabled={!!combat || !availability.canUse}
                    title={availability.reason || skill.description}
                    className={cn(
                      "skill-button grid items-center p-1.5 bg-slate-800 border border-slate-700 rounded group transition-all shadow-lg active:scale-95",
                      availability.canUse
                        ? "hover:border-amber-500/50 hover:bg-slate-700/50"
                        : "opacity-55 cursor-not-allowed"
                    )}
                  >
                    <Icon size={14} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
                    <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 group-hover:text-slate-200 text-center leading-tight">{skill.label}</span>
                    <span className="skill-description text-[10px] text-slate-400 leading-tight">{skill.description}</span>
                    <span className="skill-cost text-[10px] text-amber-500 font-mono">{cooldown > 0 ? `${cooldown}d` : getSkillCostLabel(skill.cost)}</span>
                  </button>
                );
              })}
            </div>
          </SidebarSection>
        </aside>

        {/* Map Visualization */}
        <section ref={mapViewport} onPointerDown={stopCamera} onWheel={stopCamera} aria-label="Island map" tabIndex={0} className="map-area min-h-0 p-2 sm:p-3 lg:p-6 bg-slate-950 flex flex-col items-center justify-center relative shadow-[inset_0_0_100px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="hidden sm:block absolute top-3 lg:top-4 right-3 lg:right-8 bg-slate-900 px-3 py-1 rounded text-[10px] font-mono border border-slate-800 text-slate-500 uppercase tracking-widest shadow-lg">
            Region ID: #49F-22B
          </div>
          
          <div 
            className="treasure-map-board shrink-0 grid gap-0 p-1 bg-slate-900 border border-slate-800 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            style={{ 
              gridTemplateColumns: `repeat(12, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(12, minmax(0, 1fr))`,
            }}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            {gameState?.tiles.map((tile) => (
              <TileComponent 
                key={tile.id} 
                tile={tile} 
                revealEffect={tileReveals[tile.id]}
                extractionReady={tile.entity === EntityType.EXIT && gameState.stats.relicsCollected >= REQUIRED_RELIC_COUNT && !gameState.isGameOver}
                onRevealComplete={finishTileReveal}
                terrain={terrainClassifications.get(tile.id)}
                isCurrent={gameState.playerPos.x === tile.x && gameState.playerPos.y === tile.y}
                idleElapsedMs={idleElapsedMs}
                playerAnimation={playerAnimation}
                playerFacing={playerFacing}
                combat={combat}
                spriteClockMs={spriteClockMs}
                onClick={() => handleMove(tile.x, tile.y)}
              />
            ))}
          </div>
        </section>

        {/* Bottom Console / Log (Combined better) */}
        <aside className="game-console min-h-0 flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 shadow-2xl z-10">
          <div className="min-h-0 flex flex-1 flex-col p-2 sm:p-3 lg:p-6 border-b border-slate-800">
            <h3 className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 lg:mb-4">Expedition Log</h3>
            <div className="min-h-0 flex-1 overflow-y-auto pr-2 custom-scrollbar font-mono text-[11px]">
              {logs.map((log) => (
                <LogItem key={log.id} message={log.message} type={log.type} timestamp={log.timestamp} count={log.count} />
              ))}
              {logs.length === 0 && <div className="text-slate-700 italic">No activity recorded...</div>}
            </div>
          </div>
          
          <div className="console-actions shrink-0 p-2 sm:p-3 lg:p-6 space-y-2 lg:space-y-3">
             <button 
              disabled={!!combat}
              onClick={handleEndTurn}
              className="w-full py-2.5 lg:py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-widest rounded shadow-xl shadow-amber-900/20 transform hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Conclude Day
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={startNewGame}
                className="py-2 lg:py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold uppercase text-[10px] tracking-widest rounded transition-all"
              >
                Reset map
              </button>
              <button onClick={() => setAudioSettingsOpen(true)} className="py-2 lg:py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold uppercase text-[10px] tracking-widest rounded">
                Settings
              </button>
            </div>
          </div>
        </aside>
      </main>

      {audioSettingsOpen && <div className="encounter-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={event => { if (event.key === 'Escape') setAudioSettingsOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="audio-title" className="encounter-frame w-full max-w-sm p-6 text-slate-200">
          <h2 id="audio-title" className="mb-5 text-lg font-bold text-amber-200">Audio</h2>
          <p role="status" className="mb-4 text-xs text-slate-300">{musicStatus}</p>
          {(['music', 'sounds'] as const).map(channel => <label key={channel} className="mb-5 block text-sm">
            <span className="flex justify-between mb-2"><span>{channel === 'music' ? 'Music' : 'Sound effects'}</span><span>{volumes[channel] === 0 ? 'Muted' : `${Math.round(volumes[channel] * 100)}%`}</span></span>
            <input aria-label={channel === 'music' ? 'Music volume' : 'Sound effects volume'} type="range" min="0" max="1" step="0.05" value={volumes[channel]} onChange={event => setVolumes(current => ({ ...current, [channel]: Number(event.target.value) }))} className="w-full accent-amber-400" />
          </label>)}
          <button autoFocus onClick={() => setAudioSettingsOpen(false)} className="encounter-choice w-full py-2">Done</button>
        </section>
      </div>}
      <footer className="hidden sm:flex shrink-0 h-8 lg:h-10 bg-slate-950 border-t border-slate-900 items-center justify-between px-4 lg:px-8 text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
        <span>Treasure Hunter v{appVersion}</span>
        <span>Explore. Recover. Escape.</span>
      </footer>
    </div>
  );
}

function getSkillIcon(skillId: CharacterSkill['id']) {
  switch (skillId) {
    case 'scout_area':
      return Telescope;
    case 'relic_survey':
      return Compass;
    case 'trap_ward':
      return Shield;
    case 'archive_clue':
    default:
      return Sparkles;
  }
}
interface TileComponentProps {
  tile: Tile;
  extractionReady?: boolean;
  revealEffect?: TileRevealEffect;
  onRevealComplete: (tileId: string, revision: number) => void;
  terrain?: TerrainTileClassification;
  isCurrent: boolean;
  idleElapsedMs: number;
  playerAnimation: CharacterAnimationState;
  playerFacing: HorizontalFacing;
  spriteClockMs: number;
  combat: { targetId: string; startedAt: number; dx: number; dy: number } | null;
  onClick: () => void;
}

const LegendItem = ({ label, color, icon: Icon, spriteBox }: { label: string, color: string, icon?: any, spriteBox?: SpriteBoxModule }) => (
  <div className="legend-item flex items-center gap-2">
    <div className={cn("w-4 h-4 rounded shadow-inner border border-white/10 overflow-hidden", color)}>
      {spriteBox && <SpriteBox spriteBox={spriteBox} seed={`legend:${label}`} alt="" imageClassName="object-fill" />}
      {Icon && <Icon size={10} className="text-white mx-auto mt-[1px]" />}
    </div>
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
  </div>
);

function getPlayerAnimationMotion(animation: CharacterAnimationState) {
  switch (animation) {
    case 'walk':
      return { y: [0, -4, 0], scale: [1, 1.04, 1] };
    case 'scout':
      return { rotate: [0, -7, 7, 0], scale: [1, 1.06, 1] };
    case 'collect':
      return { y: [0, -7, 0], scale: [1, 1.16, 1] };
    case 'hit':
      return { x: [0, -5, 5, -3, 0], scale: [1, 0.92, 1] };
    case 'escape':
      return { y: [0, -9, 0], scale: [1, 1.18, 1], rotate: [0, -4, 4, 0] };
    case 'idle':
    default:
      return { x: 0, y: 0, rotate: 0, scale: 1 };
  }
}

const TileComponent: React.FC<TileComponentProps> = ({ tile, terrain, extractionReady, revealEffect, onRevealComplete, isCurrent, idleElapsedMs, playerAnimation, playerFacing, spriteClockMs, combat, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const getTileColor = (type: TileType) => {
    switch (type) {
      case TileType.WATER: return 'bg-blue-600/20';
      case TileType.DEEP_WATER: return 'bg-blue-900/40';
      case TileType.SAND: return 'bg-amber-200/20';
      case TileType.GRASS: return 'bg-emerald-600/30';
      case TileType.FOREST: return 'bg-emerald-900/40';
      case TileType.MOUNTAIN: return 'bg-slate-500/30';
      default: return 'bg-slate-800';
    }
  };

  const terrainSpriteBox = tileTerrainSpriteBoxes[tile.type];
  const entitySpriteBox = tile.entity ? entitySpriteBoxes[tile.entity] : undefined;
  const isCombatTarget = combat?.targetId === tile.id;
  const combatElapsedMs = combat ? Math.max(0, performance.now() - combat.startedAt) : 0;
  const attackAssetKey = tile.visual?.assetKey ?? (tile.visual
    ? `${['turret', 'cannon', 'fireTurret', 'magicTurret'].includes(tile.visual.id) ? 'defenses' : 'enemies'}/${tile.visual.id.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)}`
    : '');
  const visualSpriteBox = isCombatTarget ? getObjectSpriteBox(attackAssetKey, 'attack') : tile.visual
    ? (tile.visual.assetKey ? getObjectSpriteBox(tile.visual.assetKey, tile.visual.action) : undefined)
      ?? visualSpriteBoxes[tile.visual.id]
    : undefined;
  const assetPresentation = getTileAssetPresentation({
    visualTone: tile.visual?.tone,
    entityType: tile.entity,
  });
  const actorIdleDuration = getActorIdleDuration(tile, visualSpriteBox, isCombatTarget);
  const actorIdleElapsedMs = useRandomIdle(actorIdleDuration, `${tile.id}:${tile.visual?.assetKey ?? tile.visual?.id}`);
  const tileLabel = tile.type.replace('_', ' ');
  const edgeClassName = terrain?.exposedEdges.map((edge) => `terrain-edge-${edge}`);
  const isWaterTerrain = tile.type === TileType.WATER || tile.type === TileType.DEEP_WATER;
  const coastClassName = isWaterTerrain && terrain?.coastEdges.length
    ? [
      'terrain-water-coast',
      ...terrain.coastEdges.map((edge) => `terrain-water-coast-${edge}`),
    ]
    : isWaterTerrain
      ? ['terrain-water-open']
      : undefined;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={tile.discovered ? `${tileLabel}: ${describeInteraction(tile)}` : 'Explore unknown terrain'}
      title={tile.discovered ? describeInteraction(tile) : 'Explore unknown terrain'}
      data-tile-id={tile.id}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={tile.discovered ? { scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
      className={cn(
        "relative cursor-pointer aspect-square transition-all duration-700 group",
        (revealEffect?.kind === 'relic-complete' || revealEffect?.kind === 'relic' || revealEffect?.kind === 'treasure') ? "tile-with-discovery-effect" : "overflow-hidden",
        isCurrent && "tile-current-hero",
        extractionReady && "extraction-ready",
        !tile.discovered && "bg-slate-800"
      )}
    >
      {revealEffect && (
        <React.Fragment key={revealEffect.revision}>
          <TileRevealParticles kind={revealEffect.kind} onComplete={() => onRevealComplete(tile.id, revealEffect.revision)} />
        </React.Fragment>
      )}
      <AnimatePresence>
        {isHovered && tile.discovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap shadow-2xl pointer-events-none"
          >
            {tileLabel}
            {tile.visual && !tile.entity && !tile.visualConsumed && ` • ${tile.visual.label}`}
            {tile.entity && tile.entityFound && ` • ${tile.entity}`}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!tile.discovered && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-slate-800 z-20 flex items-center justify-center group-hover:bg-slate-700 transition-colors"
          >
            <SpriteBox
              spriteBox={symbolSpriteBoxes.fog}
              seed={`${tile.id}:fog`}
              alt=""
              imageClassName="object-fill opacity-70 grayscale"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "terrain-tile absolute inset-0 z-0",
          getTileColor(tile.type),
          `terrain-${tile.type}`,
          edgeClassName,
          coastClassName
        )}
        aria-hidden="true"
        data-terrain-variant={terrain?.variantKey}
        data-coast-edges={terrain?.coastEdges.join(' ')}
      >
        <SpriteBox
          spriteBox={terrainSpriteBox}
          seed={tile.id}
          elapsedMs={spriteClockMs}
          alt={tileLabel}
          className={cn('terrain-texture', tile.type === TileType.DEEP_WATER && 'brightness-50 saturate-150', tile.type === TileType.WATER && 'brightness-75 saturate-125')}
          imageClassName="object-fill"
        />
        <div className="absolute inset-0 bg-slate-950/10 mix-blend-multiply" />
      </div>
      
      {tile.discovered && visualSpriteBox && !entitySpriteBox && !tile.visualConsumed && (
        <motion.div data-layer="object" data-combat={isCombatTarget ? 'enemy' : undefined}
          animate={isCombatTarget ? { x: [0, -combat!.dx * 4, 0], y: [0, -combat!.dy * 4, 0] } : { x: 0, y: 0 }}
          transition={isCombatTarget ? { duration: 0.28, repeat: 3 } : { duration: 0 }}
          className={assetPresentation.containerClassName}>
          <SpriteBox spriteBox={visualSpriteBox} seed={tile.id} elapsedMs={isCombatTarget ? combatElapsedMs : actorIdleDuration > 0 ? actorIdleElapsedMs : spriteClockMs} level={tile.visual?.level}
            alt={tile.visual!.label} imageClassName={assetPresentation.imageClassName} />
        </motion.div>
      )}

      {tile.discovered && entitySpriteBox && (!tile.entityFound || tile.entity === EntityType.EXIT) && (
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          className={cn(
            assetPresentation.containerClassName,
            "transition-opacity",
            tile.entityFound && "opacity-30 grayscale"
          )}
        >
          <SpriteBox
            spriteBox={entitySpriteBox}
            seed={`${tile.id}:${tile.entity}`}
            elapsedMs={spriteClockMs}
            alt={tile.entity}
            imageClassName={assetPresentation.imageClassName}
          />
        </motion.div>
      )}

      <AnimatePresence>
        {isCurrent && (
          <motion.div 
            layoutId="player"
            data-combat={combat ? 'hero' : undefined}
            animate={combat ? { x: [0, combat.dx * 4, 0], y: [0, combat.dy * 4, 0] } : getPlayerAnimationMotion(playerAnimation)}
            transition={{ duration: 0.28, ease: 'easeOut', repeat: combat ? 3 : 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-visible"
          >
            <div data-layer="hero" className="relative h-full w-full">
              <SpriteBox
                spriteBox={activeCharacter.spriteBoxes[playerAnimation]}
                seed={`player:${activeCharacter.id}:${playerAnimation}`}
                elapsedMs={combat ? combatElapsedMs : playerAnimation === 'idle' ? idleElapsedMs : spriteClockMs}
                alt={activeCharacter.label}
                imageClassName={cn(
                  "object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.65)] transition-transform duration-150",
                  playerFacing === 'left' && "-scale-x-100"
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
