# Treasure Hunter — The Bell That Remembers

Chapter I is a playable survival puzzle, not a randomized answer quiz. The player chooses a route across a 12×12 island. Geography and the true bell vary by seed; a retry preserves both. The original expedition remains available through Free expedition.

## Dramatic question
Elin disappeared while trying to silence a voice beneath the island. Her brother follows her letter. The heartstone answers in her voice, but the ending raises the question of whether she has been rescued or something else has escaped.

## Rules and fairness
- Forty light at departure. Every cardinal land step costs one. Water and blocked passages reject movement without charging.
- Two oil flasks each restore twelve light and one life. No infinite resting or passive regeneration.
- Three life. Explicitly priced risks can wound or kill. Death retains the scene briefly before offering a same-seed retry.
- One rope creates a safe crossing. A jump also opens a return route but spends one life and four light.
- One bandage can save Mara, earning a direct clue and changing the ending, or restore the player later.
- The bell answer is fixed at generation. Mara and the tablet independently disclose it. Wrong bells cost two life and four light; repeated guessing can kill.
- The offering is deducible from the tablet, bowl, and oracle. Salt opens the heartstone; blood and force harm the player.
- Journal entries preserve discovered evidence. Reading and conversation do not consume light.

## Presentation and technical contract
The chapter uses the game's tile renderer, assets, music layers, reveal effects and oracle. The reducer owns movement, resource spending, puzzle conditions and terminal outcomes. Dialogue and oracle text derive from the same state. Animation does not drive game rules or timers. Tile identity remains stable during ordinary moves. The original game UI is retained. Conversations appear in dismissible map speech bubbles. The mobile oracle is dismissible, and the map scrolls independently.

## Verification
`npx tsx --test src/story/chapter.test.ts` checks every seed's full walking solution, fatal mistakes, depleted oil, remote-action rejection and 12×12 route freedom. Browser playtesting covers dialogue choices, journal, map movement, defeat, retry, and the ending.

## Continuation
The Borrowed Voice is an ending hook, not an implemented second chapter. A future chapter should carry Mara's survival forward and challenge the reliability of voices without invalidating objective evidence.
