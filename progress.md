Original prompt: 做一个撞车模拟器的游戏，能够用github pages部署的

## Progress

- Created a static GitHub Pages-friendly web game plan: no build step, single `index.html`, canvas-based gameplay, and JavaScript/CSS assets in the repo root.
- Implemented the first static build (`index.html`, `style.css`, `game.js`, `README.md`).
- First Playwright run rendered correctly but revealed repeated wall damage while the car was clamped at the arena boundary.
- Fixed wall damage to trigger from meaningful impact speed only, and added a central crash target for a stable straight-line test.
- Re-ran the develop-web-game Playwright client: driving, collision, score, damage, obstacle HP, and screenshot all matched the expected gameplay state.
- Ran a direct Playwright keyboard check for controls not mapped by the skill client: `P` pause and `R` restart work, with no console/page errors.
- Added `.nojekyll` for simple GitHub Pages static publishing.
- Added `.gitignore` so local Playwright screenshots and macOS metadata are not accidentally published.
- Added `.github/workflows/pages.yml` for GitHub Actions based Pages deployment.
- Updated README deployment instructions to use GitHub Actions as the Pages source.
- Created public GitHub repository `mammgerL/car-crash-simulator`, pushed `main`, enabled Pages with `build_type=workflow`, and verified a successful manual GitHub Actions deployment.
- Started 3D upgrade request: replaced the 2D canvas game with a Three.js module, added a real 3D arena, third-person/cockpit camera switching, collision damage marks, windshield cracks, and 3D obstacle meshes.
- Updated controls/docs for `C`/`V` view switching and noted the Three.js CDN dependency.
- Initial 3D validation passed for chase/cockpit views, but mobile showed old 16:9 letterboxing; changed the stage to full-viewport rendering and made Three.js resize to the displayed canvas size.
- Re-validated after the full-viewport change: chase view, cockpit view, WebGL canvas pixels, collision damage, windshield cracks, desktop screenshot, and mobile screenshot all passed with no console/page errors.
- Upgraded the car damage model: more detailed car parts, progressive front crumple, bumper/headlight/hood/door/wheel detachment, loose part physics, smoke bursts, and cockpit hood deformation.
- Re-validated the wreck model locally: repeated crash reached ~80% damage with 7 loose parts and no console errors; cockpit view showed damaged hood/cracks and a nonblank WebGL canvas.
- Deployed commit `4b6bbd4` through GitHub Actions successfully and verified Pages returned HTTP 200.
- Added vehicle selection with four procedural vehicle types: sport sedan, SUV, pickup, and police car. Each has different size, mass, durability, acceleration, max speed, and handling. Validated all four choices in Playwright with no console errors.
- Researched free model options: CC0/Public Domain is safest for public GitHub Pages; CC-BY can work if attribution is added. Good candidates include explicit CC0 Sketchfab models, Pixabay GLB models, and CC0 game asset libraries such as Quaternius/Kenney-style packs.

## TODO

- Optional next improvements: import licensed GLB car models, mobile touch controls, more arenas, persistent best score.
