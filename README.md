# D.A.B.S. — Department of Alcoholic Beverage Services

A Utah-flavored parody browser game. DABS runs the state liquor stores and files compliance paperwork;
in this game its agents are convinced they are a tier-one tactical unit. Pilot the DABS Enforcement
Blimp *Sober Seagull* over the Wasatch Front, rappel through bar windows, and cite every violation in
the book — underage drinking, fake IDs, over-service, illegal happy hours, kegs smuggled in from
Evanston, and pours heavier than 1.5 oz — while reporting directly to a very patient Governor Cox.

Six districts, six kingpins. Each one stays hidden until you bust enough bars to flush them out, and
finding out who it is this time is half the fun, so they are not listed here.

<details><summary>Spoilers: the kingpins</summary>

A State Street used-car dealer from under the old Crossroads Mall who is definitely a human, "Super"
Dell Schanze, Post Malone, the Great Salt Lake whale, the Skinwalker, and Brigham Young, who would
like his territorial whiskey monopoly back and plans to turn the Great Salt Lake into the world's
largest margarita. The rim is already salted.

</details>

This is a parody. It is not affiliated with the State of Utah, DABS, or anyone depicted.

## Play

**Play it now:** https://sam1am.github.io/DABS/

Or run it locally: open `index.html` in any modern browser (no build step, no dependencies). For the best
experience serve the folder over HTTP:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress saves automatically to your browser's localStorage. (The Utah revamp uses a new save slot, so careers from the original version start over.)

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

- Six districts (State Street, Silicon Slopes, Park City, the Great Salt Lake, the Uintah Basin, Happy Valley), 40 bars (optional bars pay extra), six kingpin showdowns, a final airship battle and an ending.
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
