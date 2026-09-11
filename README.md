# D.A.B.S. — Department of Beverage Services

An over-the-top browser game about the state's most zealous alcohol enforcement agency.
Pilot the DABS Enforcement Blimp *Sober Skyhawk* over Port Tipsy, rappel through bar windows,
and cite every violation in the book — underage drinking, fake IDs, over-service, bartenders
drinking on duty, expired licenses, bottomless promos, contraband kegs and watered-down spirits —
until you unmask Baron Von Brewster and stop Operation Last Call.

## Play

**Play it now:** https://sam1am.github.io/DABS/

Or run it locally: open `index.html` in any modern browser (no build step, no dependencies). For the best
experience serve the folder over HTTP:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress saves automatically to your browser's localStorage.

## Controls

| Context | Keys |
|---|---|
| Menus | Arrows / mouse, Enter, number hotkeys, Esc back |
| Blimp flight | WASD / arrows to fly, **Space** citation cannon, **E** rappel into a glowing bar or dock at HQ |
| Rappel | A/D steer, S drop faster, W slow down, **Space** crash through the target window |
| Inspection | A/D walk, **E** inspect, **W+E** target the bartender or wall items, Shift sprint (stamina; get winded and you slow down), **Space** tackle a runner, 1–6 panel choices, **E** at the EXIT door to leave early |
| Showdowns | A/D move, **W** jump, **Space** throw citations |
| Anywhere | Esc pause, M mute |

## Structure

- Six districts, 40 bars (optional bars pay extra), six kingpin showdowns, a final airship battle and an ending.
- 12 upgrades (blimp, agent, combat), nine ranks, 22 awards, career records — all at HQ.
- Everything is procedural: characters, city, bars, music and sound effects are generated in code.

```
index.html        entry point
css/style.css
js/util.js        math, seeded RNG, easing
js/input.js       keyboard / mouse
js/save.js        localStorage profile
js/audio.js       Web Audio synth SFX + step-sequencer music
js/gfx.js         procedural characters, vehicles, props, particles, text
js/ui.js          buttons, menus, dialog boxes, banners
js/data.js        districts, bars, bosses, violations, upgrades, awards, story
js/main.js        game loop, scene manager, pause, achievements
js/scenes/        title, story, hq, city, rappel, bar, boss, results, ending
dev/sim.html      headless smoke-test harness (scripted play-through, logs to the HTTP server)
```

Debug URL parameters: `?scene=city&district=2`, `?scene=bar&district=0&bar=1&entry=perfect`,
`?scene=boss&district=4`, plus `nofade=1` and `warm=<seconds>` for screenshots.
