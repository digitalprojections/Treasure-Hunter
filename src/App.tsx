/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Calendar
} from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Tile, TileType, EntityType, GameState } from './types';
import { generateIsland, getStartingPosition, REQUIRED_RELIC_COUNT } from './utils/mapGenerator';
import { entityAssets, getVisualAsset, playerAsset, symbolAssets, tileTerrainAssets } from './data/assets';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// Sub-components
const ResourceItem = ({ icon: Icon, value, label, color }: { icon: any, value: number, label: string, color: string }) => (
  <div className="flex shrink-0 items-center gap-2 bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 rounded-md shadow-inner">
    <div className={cn("p-1 rounded-full bg-opacity-20", color)}>
      <Icon size={16} className={color.replace('bg-', 'text-')} />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] text-slate-500 font-bold uppercase leading-none tracking-wider">{label}</span>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  </div>
);

const SidebarSection = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: any }) => (
  <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-lg p-3 lg:p-4 shadow-xl relative overflow-hidden">
    <div className="flex items-center gap-2 mb-3 lg:mb-4 border-b border-slate-800 pb-2">
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
}

const LogItem: React.FC<LogItemProps> = ({ message, type, timestamp }) => {
  const colors = {
    info: 'text-slate-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400'
  };
  return (
    <div className={cn("text-[11px] font-mono mb-2 border-l-2 pl-3 border-slate-800", colors[type || 'info'])}>
      <span className="opacity-50 mr-2">[{timestamp}]</span>
      {message}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [logs, setLogs] = useState<{ message: string, type: 'info' | 'success' | 'warning' | 'error', timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsEarnedToday, setPointsEarnedToday] = useState(0);
  const gameSessionIdRef = useRef(createSessionId());
  const sharedApiSessionIdRef = useRef<string | null>(null);
  const [sharedApiSessionId, setSharedApiSessionId] = useState<string | null>(null);

  // Initialize Game
  const startNewGame = useCallback(() => {
    gameSessionIdRef.current = createSessionId();
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
    });
    setLogs([{ message: "Shipwrecked! You've landed on a mysterious island...", type: 'warning', timestamp: new Date().toLocaleTimeString([], { hour12: false }) }]);
  }, []);

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
    setLogs(prev => [{ message, type, timestamp }, ...prev.slice(0, 19)]);
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

  // Movement Logic
  const handleMove = (x: number, y: number) => {
    if (!gameState || gameState.isGameOver) return;

    const dx = Math.abs(x - gameState.playerPos.x);
    const dy = Math.abs(y - gameState.playerPos.y);

    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return;

    const targetTile = gameState.tiles.find(t => t.x === x && t.y === y);
    if (!targetTile || targetTile.type === TileType.DEEP_WATER) return;

    if (gameState.resources.gold < 5) {
      addLog("You need survival supplies (gold) to move!", "error");
      return;
    }

    if (gameState.stamina <= 0) {
      addLog("You are too exhausted to move! Conclude the day to rest.", "error");
      return;
    }

    setGameState(prev => {
      if (!prev) return null;

      const newTiles = prev.tiles.map(t => {
        if (Math.abs(t.x - x) <= 1 && Math.abs(t.y - y) <= 1) {
          return { ...t, discovered: true };
        }
        return t;
      });

      let newResources = { ...prev.resources };
      let newStats = { ...prev.stats };
      let message = "";
      let logType: 'info' | 'success' | 'warning' | 'error' = 'info';

      const updatedTiles = newTiles.map(t => {
        const isTargetEntity = t.x === x && t.y === y && t.entity;
        const canTriggerEntity = isTargetEntity && (!t.entityFound || t.entity === EntityType.EXIT);

        if (canTriggerEntity) {
          // Entity logic remains mostly same but could add variance
          if (t.entity === EntityType.TREASURE) {
            newResources.gold += Math.floor(Math.random() * 50) + 20;
            newStats.treasuresFound += 1;
            message = "Found a buried treasure chest!";
            logType = 'success';
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
            awardAchievement('treasure_found', `${gameSessionIdRef.current}:treasure:${newStats.treasuresFound}`, 'finding treasure');
          } else if (t.entity === EntityType.TRAP) {
            newResources.gold = Math.max(0, newResources.gold - 40);
            newStats.trapsTriggered += 1;
            message = "Triggered a hidden dart trap!";
            logType = 'error';
          } else if (t.entity === EntityType.RELIC) {
            newStats.relicsCollected += 1;
            message = "Uncovered an Ancient Relic!";
            logType = 'success';
            confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
            awardAchievement('relic_collected', `${gameSessionIdRef.current}:relic:${newStats.relicsCollected}`, 'collecting a relic');
            
            // If all relics found, reveal the exit
            if (newStats.relicsCollected >= REQUIRED_RELIC_COUNT) {
              message = "All relics collected! The Extraction Point has been signaled. Find the Ship to escape!";
              logType = 'success';
            }
          } else if (t.entity === EntityType.EXIT) {
            if (newStats.relicsCollected >= REQUIRED_RELIC_COUNT) {
              message = "Escape successful! You've set sail for a new island.";
              logType = 'success';
              confetti({ particleCount: 200, spread: 160, origin: { y: 0.5 } });
              awardAchievement('island_escape', `${gameSessionIdRef.current}:escape:${newStats.daysElapsed}`, 'escaping the island');
              // Trigger new game in next frame
              setTimeout(startNewGame, 3000);
            } else {
              message = `The Ship remains docked. You must find all ${REQUIRED_RELIC_COUNT} relics before you can leave.`;
              logType = 'warning';
              return t;
            }
          } else if (t.entity === EntityType.RUIN) {
            newResources.stone += 10;
            message = "Scavenged some stone from old ruins.";
            logType = 'info';
          }
          return { ...t, entityFound: true };
        }
        return t;
      });

      if (message) addLog(message, logType);
      
      if (targetTile.type === TileType.FOREST) {
        newResources.wood += 2;
        addLog("Gathered some firewood.", "info");
      }

      return {
        ...prev,
        tiles: updatedTiles,
        playerPos: { x, y },
        resources: newResources,
        stamina: prev.stamina - 1,
        stats: newStats
      };
    });
  };

  const handleScout = () => {
    if (!gameState || gameState.resources.gold < 50) {
      addLog("Insufficient gold for scouting mission.", "error");
      return;
    }
    
    setGameState(prev => {
      if (!prev) return null;
      const { x, y } = prev.playerPos;
      const newTiles = prev.tiles.map(t => {
        if (Math.abs(t.x - x) <= 2 && Math.abs(t.y - y) <= 2) {
          return { ...t, discovered: true };
        }
        return t;
      });
      addLog("Scouting mission completed. Local map updated.", "info");
      return {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - 50 },
        tiles: newTiles
      };
    });
  };

  const handleSurvey = () => {
    if (!gameState || gameState.resources.gold < 100) {
      addLog("Insufficient gold for terrain survey.", "error");
      return;
    }

    const relics = gameState.tiles.filter(t => t.entity === EntityType.RELIC && !t.entityFound);
    if (relics.length === 0) {
      addLog("The survey sensor detects no remaining relics on this island.", "warning");
      return;
    }

    setGameState(prev => {
      if (!prev) return null;
      // Just mark one as discovered for the user as a "hint"
      const nearest = relics[0]; 
      const newTiles = prev.tiles.map(t => {
        if (t.id === nearest.id) return { ...t, discovered: true };
        return t;
      });
      addLog("Survey complete: A relic signal has been triangulated.", "success");
      return {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - 100 },
        tiles: newTiles
      };
    });
  };

  const handleGetClue = async () => {
    if (!gameState || gameState.resources.gold < 25) {
      addLog("The archives require an offering of gold (25) to speak.", "error");
      return;
    }

    addLog("Consulting the ancient archives...", "info");
    try {
      const response = await fetch(gameApiUrl('/api/games/treasure-hunter/clue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState }),
      });
      const data = await response.json();
      if (data.clue) {
        addLog(`ARCHIVE: ${data.clue}`, 'warning');
        setGameState(prev => prev ? { ...prev, resources: { ...prev.resources, gold: prev.resources.gold - 25 } } : null);
      }
    } catch (e) {
      addLog("The spirits are silent...", "error");
    }
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return null;
      const recoveredStamina = Math.min(prev.maxStamina, prev.stamina + 10);
      addLog(`Day ${prev.stats.daysElapsed} concludes. You rested and recovered 10 stamina.`, 'warning');
      return {
        ...prev,
        stamina: recoveredStamina,
        stats: { ...prev.stats, daysElapsed: prev.stats.daysElapsed + 1 }
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

  if (loading) return <div className="flex items-center justify-center h-[100dvh] bg-[#0F172A] text-slate-400 font-mono text-xs tracking-widest uppercase animate-pulse">Initializing Expedition Data...</div>;

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#0F172A] text-slate-100 font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col border-4 lg:border-8 border-slate-900">
      {/* Header */}
      <header className="shrink-0 bg-slate-800/50 border-b border-slate-700 flex flex-wrap lg:flex-nowrap items-center gap-2 px-2 sm:px-4 lg:px-6 py-2 justify-between shadow-2xl z-20 backdrop-blur-sm">
        <div className="min-w-0 flex flex-1 flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded flex shrink-0 items-center justify-center text-slate-900 font-bold shadow-lg shadow-amber-500/20">
              <MapIcon size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black tracking-tighter uppercase text-white leading-none truncate">
                Isle Finder <span className="text-amber-500 text-sm">v2.4</span>
              </h1>
              <p className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Procedural Expeditions</p>
            </div>
          </div>

          <div className="hidden lg:block h-8 w-[1px] bg-slate-700 mx-1" />

          <div className="flex min-w-0 flex-1 gap-2 sm:gap-3 overflow-x-auto pb-1 lg:pb-0">
            <ResourceItem icon={Coins} value={Math.max(0, gameState?.resources.gold || 0)} label="Gold" color="bg-amber-500" />
            <ResourceItem icon={Trees} value={gameState?.resources.wood || 0} label="Wood" color="bg-emerald-500" />
            <ResourceItem icon={MountainIcon} value={gameState?.resources.stone || 0} label="Stone" color="bg-slate-400" />
            <ResourceItem icon={Sparkles} value={gameState?.resources.gems || 0} label="Gems" color="bg-purple-500" />
            {user && <ResourceItem icon={Trophy} value={pointsEarnedToday} label="Pts Today" color="bg-cyan-500" />}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="flex gap-3 sm:gap-4 items-center bg-slate-900/80 px-3 sm:px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Day</span>
              <span className="text-xs font-mono font-bold text-amber-500">{gameState?.stats.daysElapsed}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Stamina</span>
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
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 grid grid-rows-[minmax(5rem,16dvh)_minmax(0,1fr)_minmax(7rem,20dvh)] lg:grid-rows-1 lg:grid-cols-[minmax(13rem,18rem)_minmax(0,1fr)_minmax(14rem,20rem)] overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="custom-scrollbar min-h-0 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-2 sm:p-3 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-2xl z-10 overflow-y-auto">
          <section>
            <h3 className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 lg:mb-4">Current Expedition</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="p-3 lg:p-4 bg-slate-800/50 rounded border border-slate-700/50 backdrop-blur-sm">
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
                  <span>Exploration Progress</span>
                  <span>{Math.round((gameState?.tiles.filter(t => t.discovered).length || 0) / (gameState?.tiles.length || 1) * 100)}%</span>
                </div>
              </div>
            </div>
          </section>

          <SidebarSection title="Field Manual">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <LegendItem label="Deep Water" image={tileTerrainAssets[TileType.DEEP_WATER]} color="bg-blue-950" />
              <LegendItem label="Water" image={tileTerrainAssets[TileType.WATER]} color="bg-blue-800" />
              <LegendItem label="Sand" image={tileTerrainAssets[TileType.SAND]} color="bg-amber-300" />
              <LegendItem label="Grass" image={tileTerrainAssets[TileType.GRASS]} color="bg-emerald-700" />
              <LegendItem label="Forest" image={tileTerrainAssets[TileType.FOREST]} color="bg-emerald-950" />
              <LegendItem label="Mountain" image={tileTerrainAssets[TileType.MOUNTAIN]} color="bg-slate-600" />
              <div className="col-span-2 border-t border-slate-800 my-1 pt-2 opacity-80">
                <LegendItem label="Treasure" color="bg-transparent" image={entityAssets[EntityType.TREASURE]} />
                <LegendItem label="Relic" color="bg-transparent" image={entityAssets[EntityType.RELIC]} />
                <LegendItem label="Trap" color="bg-transparent" image={entityAssets[EntityType.TRAP]} />
                <LegendItem label="Ruin" color="bg-transparent" image={entityAssets[EntityType.RUIN]} />
                <LegendItem label="Exit Port" color="bg-transparent" image={entityAssets[EntityType.EXIT]} />
              </div>
            </div>
          </SidebarSection>

          <section>
            <h3 className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 lg:mb-4">Relic Discovery</h3>
            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center justify-between p-2 lg:p-3 bg-slate-800/30 rounded border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Trophy size={14} className="text-amber-500" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Total Relics</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-500">{gameState?.stats.relicsCollected} / {REQUIRED_RELIC_COUNT}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 lg:p-3 bg-slate-800/30 rounded border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Skull size={14} className="text-red-500" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Traps Sprung</span>
                </div>
                <span className="font-mono text-xs font-bold text-red-400">{gameState?.stats.trapsTriggered}</span>
              </div>
            </div>
          </section>

          <SidebarSection title="Field Gear">
            <div className="grid grid-cols-2 gap-3 text-white">
              <button 
                onClick={handleScout}
                className="flex flex-col items-center p-3 bg-slate-800 border border-slate-700 rounded hover:border-amber-500/50 hover:bg-slate-700/50 group transition-all shadow-lg active:scale-95"
              >
                <Telescope size={18} className="text-slate-500 group-hover:text-amber-500 mb-2 transition-colors" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 group-hover:text-slate-200">Scout</span>
                <span className="text-[10px] text-amber-500 font-mono mt-1">$50</span>
              </button>
              <button 
                onClick={handleSurvey}
                className="flex flex-col items-center p-3 bg-slate-800 border border-slate-700 rounded hover:border-amber-500/50 hover:bg-slate-700/50 group transition-all shadow-lg active:scale-95"
              >
                <Compass size={18} className="text-slate-500 group-hover:text-amber-500 mb-2 transition-colors" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 group-hover:text-slate-200">Survey</span>
                <span className="text-[10px] text-amber-500 font-mono mt-1">$100</span>
              </button>
            </div>
          </SidebarSection>

          <section className="mt-auto space-y-4">
            <button 
              onClick={handleGetClue}
              className="w-full flex items-center justify-center gap-3 p-4 bg-purple-900/40 border border-purple-500/30 rounded-lg group hover:bg-purple-800/50 transition-all shadow-xl active:scale-95"
            >
              <Sparkles size={20} className="text-purple-400 group-hover:animate-spin-slow" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] items-start text-purple-300 font-bold uppercase tracking-widest">Ancient Archives</span>
                <span className="text-[9px] text-purple-400 font-mono italic">Seek a clue ($25)</span>
              </div>
            </button>
          </section>
        </aside>

        {/* Map Visualization */}
        <section className="min-h-0 p-2 sm:p-3 lg:p-6 bg-slate-950 flex flex-col items-center justify-center relative shadow-[inset_0_0_100px_rgba(0,0,0,0.4)] overflow-hidden">
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
                isCurrent={gameState.playerPos.x === tile.x && gameState.playerPos.y === tile.y}
                onClick={() => handleMove(tile.x, tile.y)}
              />
            ))}
          </div>
        </section>

        {/* Bottom Console / Log (Combined better) */}
        <aside className="min-h-0 flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 shadow-2xl z-10">
          <div className="min-h-0 flex flex-1 flex-col p-2 sm:p-3 lg:p-6 border-b border-slate-800">
            <h3 className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 lg:mb-4">Expedition Log</h3>
            <div className="min-h-0 flex-1 overflow-y-auto pr-2 custom-scrollbar font-mono text-[11px]">
              {logs.map((log, i) => (
                <LogItem key={i} message={log.message} type={log.type} timestamp={log.timestamp} />
              ))}
              {logs.length === 0 && <div className="text-slate-700 italic">No activity recorded...</div>}
            </div>
          </div>
          
          <div className="shrink-0 p-2 sm:p-3 lg:p-6 space-y-2 lg:space-y-3">
             <button 
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
              <button className="py-2 lg:py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold uppercase text-[10px] tracking-widest rounded opacity-50 cursor-not-allowed">
                Settings
              </button>
            </div>
          </div>
        </aside>
      </main>

      <footer className="hidden sm:flex shrink-0 h-8 lg:h-10 bg-slate-950 border-t border-slate-900 items-center justify-between px-4 lg:px-8 text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
        <span>Experimental Build v0.8.2</span>
        <span>Secure Session Linked</span>
        <span>Satellite Uplink: Active</span>
      </footer>
    </div>
  );
}

interface TileComponentProps {
  tile: Tile;
  isCurrent: boolean;
  onClick: () => void;
}

const LegendItem = ({ label, color, icon: Icon, image }: { label: string, color: string, icon?: any, image?: string }) => (
  <div className="flex items-center gap-3 py-1">
    <div className={cn("w-4 h-4 rounded shadow-inner border border-white/10 overflow-hidden", color)}>
      {image && <img src={image} alt="" className="h-full w-full object-fill" draggable={false} />}
      {Icon && <Icon size={10} className="text-white mx-auto mt-[1px]" />}
    </div>
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
  </div>
);

const TileComponent: React.FC<TileComponentProps> = ({ tile, isCurrent, onClick }) => {
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

  const terrainAsset = tileTerrainAssets[tile.type];
  const entityAsset = tile.entity ? entityAssets[tile.entity] : undefined;
  const visualAsset = tile.visual ? getVisualAsset(tile.visual.id, tile.id) : undefined;
  const baseAsset = visualAsset && !entityAsset ? visualAsset : terrainAsset;
  const tileLabel = tile.type.replace('_', ' ');
  const baseLabel = tile.visual && !entityAsset ? tile.visual.label : tileLabel;

  return (
    <motion.div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={tile.discovered ? { scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
      className={cn(
        "relative cursor-pointer aspect-square overflow-hidden transition-all duration-700 group",
        !tile.discovered && "bg-slate-800"
      )}
    >
      <AnimatePresence>
        {isHovered && tile.discovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap shadow-2xl pointer-events-none"
          >
            {tileLabel}
            {tile.visual && !tile.entity && ` • ${tile.visual.label}`}
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
            <img src={symbolAssets.fog} alt="" className="h-full w-full object-fill opacity-70 grayscale" draggable={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("absolute inset-0 z-0", getTileColor(tile.type))}>
        <img
          src={baseAsset}
          alt={baseLabel}
          className={cn(
            "h-full w-full object-fill transition-transform duration-500 group-hover:scale-110",
            tile.type === TileType.DEEP_WATER && "brightness-50 saturate-150",
            tile.type === TileType.WATER && "brightness-75 saturate-125"
          )}
          draggable={false}
        />
        <div className="absolute inset-0 bg-slate-950/10 mix-blend-multiply" />
      </div>
      
      {tile.discovered && entityAsset && (
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          className={cn(
            "absolute inset-0 flex items-center justify-center z-10 p-1 transition-opacity",
            tile.entityFound && "opacity-30 grayscale"
          )}
        >
          <img
            src={entityAsset}
            alt={tile.entity}
            className="max-h-full max-w-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]"
            draggable={false}
          />
        </motion.div>
      )}

      <AnimatePresence>
        {isCurrent && (
          <motion.div 
            layoutId="player"
            className="absolute inset-0 z-30 flex items-center justify-center overflow-visible"
          >
            <div className="relative h-[118%] w-[118%] rounded-full shadow-[0_0_22px_rgba(255,255,255,0.32)] ring-2 ring-white/35">
              <img src={playerAsset} alt="Explorer" className="h-full w-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.65)]" draggable={false} />
              <div className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/70 animate-ping" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
