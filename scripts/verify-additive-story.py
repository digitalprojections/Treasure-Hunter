"""Guard the original gameplay against accidental story-layer changes."""
import subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
def original(path):
    return subprocess.check_output(['git', 'show', f'0fec9a5:{path}'], cwd=root).decode().replace('\r\n','\n')
app = (root / 'src/App.tsx').read_text()
app = app.replace("import { ExpeditionStory } from './story/ExpeditionStory';\n", '')
app = app.replace('        {gameState && <ExpeditionStory state={gameState} island={islandNumber} viewport={mapViewport} hidden={mobilePanelOpen || audioSettingsOpen} />}\n', '')
assert app.rstrip().replace('tile={tile} \n', 'tile={tile}\n') == original('src/App.tsx').rstrip().replace('tile={tile} \n', 'tile={tile}\n'), 'Gameplay/UI differs from baseline beyond the additive story mount'
for path in ['src/utils/mapGenerator.ts', 'src/utils/interactions.ts', 'src/utils/characterSkills.ts', 'src/components/ExpeditionOracle.tsx']:
    assert (root / path).read_text() == original(path), f'Original behavior changed: {path}'
print('PASS: original App, map generation, movement/interactions, skills and oracle are unchanged; story is additive only.')
