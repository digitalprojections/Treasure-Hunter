"""Create the conventional audio folders without changing existing files."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "assets"
GROUPS = {
    "music": ("menu", "play", "victory", "defeat"),
    "sounds": ("walk", "attack", "collect", "hit", "scout", "escape", "warning", "rest", "reveal"),
}
for group, events in GROUPS.items():
    for event in events:
        (ROOT / group / event).mkdir(parents=True, exist_ok=True)
print("Treasure Hunter audio folders ready.")
