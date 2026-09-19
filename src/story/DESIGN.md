# Treasure Hunter — additive storyline

The Bell That Remembers follows Elin through the existing procedural expeditions. Letters, nearby landmark conversations, and recovered relics reveal her story. Replies can be recorded in a persistent in-session journal. Oracle clues come from the actual generated map.

## Gameplay contract
The story is presentation only. It receives GameState without a setter or game-action dispatcher. Dialogue changes text and journal entries only. It does not alter generation, map dimensions, fog, movement, stamina, resources, combat, skills, resting, relic requirements, rewards, or automatic island progression. No bespoke corridors, puzzle gates, life/light systems, forced choices, or replacement UI are included.

## Verification
Run `python scripts/verify-additive-story.py` to compare gameplay code with the pre-story baseline. Narrative tests exercise frozen game state, real clues, discovery-dependent conversations and relic milestones. Existing gameplay tests remain authoritative for expedition rules.
