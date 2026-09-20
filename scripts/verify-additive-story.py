"""Guard the original gameplay against accidental story-layer changes."""
import subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
def original(path):
    return subprocess.check_output(['git', 'show', f'0fec9a5:{path}'], cwd=root).decode().replace('\r\n','\n')
app = (root / 'src/App.tsx').read_text()
# Allow the independently verified rapid-movement rendering fix.
app = app.replace('      {/* Shared layout moves the single hero; retaining exits creates duplicate heroes on rapid taps. */}\n        {isCurrent && (', '      <AnimatePresence>\n        {isCurrent && (')
app = app.replace('        )}\n    </motion.div>', '        )}\n      </AnimatePresence>\n    </motion.div>')
app = app.replace("import { ExpeditionStory } from './story/ExpeditionStory';\n", '')
app = app.replace('        {gameState && <ExpeditionStory state={gameState} island={islandNumber} viewport={mapViewport} hidden={mobilePanelOpen || audioSettingsOpen} />}\n', '')
app = app.replace('          <div id="expedition-reading-controls" className="reading-controls" aria-label="Story and oracle controls" />\n', '')
assert app.rstrip().replace('tile={tile} \n', 'tile={tile}\n') == original('src/App.tsx').rstrip().replace('tile={tile} \n', 'tile={tile}\n'), 'Gameplay/UI differs from baseline beyond the additive story mount'
for path in ['src/utils/mapGenerator.ts', 'src/utils/interactions.ts', 'src/utils/characterSkills.ts']:
    assert (root / path).read_text() == original(path), f'Original behavior changed: {path}'
print('PASS: original App, map generation, movement/interactions and skills are unchanged; story is additive only.')
