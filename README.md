# Treasure Cartographer

A procedural exploration game where you play as an island explorer revealing a hidden map to find ancient relics and escape dangerous islands.

## 🕹️ Gameplay Overview
The island is covered in fog. You must move your explorer to reveal adjacent tiles, manage your supplies, and locate the three ancient relics required to signal for extraction.

### Core Mechanics
- **Movement**: Move to any adjacent tile (including diagonals). Each move costs **1 Stamina**.
- **Stamina**: You start with 20 stamina. Resting (Ending the Turn) recovers 10 stamina. If you run out of moves, you must rest for the day.
- **Extraction**: Find the **Extraction Ship** (marked with a green ship icon) after collecting all 3 relics to move to the next island.

## 🗺️ Field Manual

### Terrain Types
- **Deep Water**: Impassable abyss.
- **Water**: Coastal waters, passable but limited.
- **Sand**: Soft shores, often where the Extraction Ship is docked.
- **Grass**: Standard inland terrain.
- **Forest**: Resource-rich woods. Exploring forests grants **Wood** supplies.
- **Mountain**: Rugged peaks. Hard to navigate but contains valuable minerals.

### Hidden Entities
- 🏺 **Relics**: The primary objective. Collect 3 to unlock the exit.
- 💰 **Treasure**: Chests containing variable amounts of **Gold**.
- 💀 **Traps**: Hidden dangers that drain your gold reserves.
- 🏛️ **Ruins**: Scavenge these for **Stone** resources.
- 🚢 **Exit Ship**: Appears on the coast. Your ticket to the next level (requires all 3 relics).

## 🛠️ Field Gear & Specials
- **Scout ($50)**: Reveals a 5x5 zone around your explorer.
- **Relic Survey ($100)**: Triangulates the location of one hidden relic and reveals its tile.
- **Ancient Archives ($25)**: Consult the spirits (powered by Gemini AI) for a cryptic atmospheric clue about the nearest relic's location.

## 🚀 Technical Configuration
- **Backend**: Express server with Vite middleware.
- **AI Integration**: Gemini 1.5 Flash for procedural clue generation.
- **Authentication**: Firebase Google Sign-In for progress tracking.
- **Persistence**: Firestore blueprint ready for multi-device sync.

## Shared Games API Integration

In production, Treasure Hunter can be deployed as a static game and use the
shared Battleship server for game backend calls. Set:

```dotenv
VITE_GAMES_API_URL=https://battleship.created.link
```

The shared backend hosts `/api/games/treasure-hunter/*`, verifies Firebase ID
tokens, issues game sessions, handles Gemini clues, applies reward caps, and
then signs Points Ledger requests server-side.

Signed-in players can earn capped rewards from server-authenticated events:

- Active playtime: defaults to **1 point per visible minute**, capped at **40/day**.
- Treasure found: defaults to **5 points**, capped at **20 events/day**.
- Relic collected: defaults to **20 points**, capped at **3 events/day**.
- Island escape: defaults to **50 points**, capped at **3 events/day**.
- Total earned game points are capped at **100/day** by default.

Set `POINTS_API_URL`, `POINTS_APP_ID`, `POINTS_APP_SECRET`,
`FIREBASE_PROJECT_ID`, and the cap variables on the shared Battleship server,
not in this static game bundle.
