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
- Imported external vehicle GLB files from Kenney Car Kit 3.1 (`sedan-sports`, `suv`, `truck`, `police`) into `assets/models/kenney-car-kit/`. License is CC0; copied `License.txt`. Added `GLTFLoader` and uses the external model as the visible shell with procedural damage parts as fallback/detachable wreckage.
- Fixed Kenney GLB texture loading by copying `Textures/colormap.png`. Validated all four external GLB vehicles in Playwright: model loaded marker matched the selected vehicle, no request failures, no console errors, nonblank WebGL screenshots.
- Added tablet/touch controls: on-screen steering pad, gas, brake, view, pause, and restart controls. Touch input feeds the same driving logic as keyboard input.
- Validated tablet controls on an iPad Pro landscape profile: controls were visible, gas moved the vehicle, view switched to cockpit, pause entered paused mode, restart reset score/damage, and there were no console/page errors.
- Replaced the police vehicle with Kay Lousberg's CC0 Poly Pizza Police Car GLB and updated local license/source notes. Validated the police model locally in Playwright: the GLB loaded, chase/cockpit view switching worked, driving and impact damage worked, iPad landscape touch controls stayed visible, and there were no request failures or console errors.
- Deployed the police model replacement through GitHub Actions and verified GitHub Pages served both the game page and the new police GLB with HTTP 200.
- Added runtime WebAudio sound system: procedural engine loop, collision impact/crash sounds, and UI tones for start/pause/view/end states. Added `M` key mute toggle and HUD/start-screen sound status hints.
- Validated post-audio build with develop-web-game Playwright client (`output/web-game-sound`): gameplay screenshots/states generated, `audioEnabled` surfaced in text state, and no console/page errors were emitted.
- Ran an extra Playwright keyboard check from the skill runtime to verify `M` mute toggle: `audioEnabled` switched `true -> false -> true` and in-game message updated correctly.
- Updated README controls list to include `M` sound toggle so docs match runtime behavior.
- Replaced the four active vehicle GLB models with more realistic Poly Pizza models: supercar (sport), Range Rover (SUV), Humvee (pickup slot), and Dodge Charger (police slot). Added new assets under `assets/models/poly-pizza-realistic/`.
- Added local attribution file `assets/models/poly-pizza-realistic/ATTRIBUTION.txt` with model title, creator, source URL, download URL, and CC-BY 3.0 license link.
- Updated external model transform support with optional `modelRotationX` / `modelRotationZ` and recalibrated per-vehicle scale/offset/rotation values (including tiny-unit supercar normalization from GLB bounds).
- Fixed residual procedural shell overlay when external GLBs are loaded by tracking extra shell parts (windshield/rear deck/mirrors/spoiler/rails/police add-ons) and hiding/resetting them together with the main shell.
- Validated with develop-web-game Playwright client (`output/web-game-models-regression`) plus per-vehicle Playwright screenshots (`output/web-game-models/vehicle-*.png`): all four external models load (`window.__debug_external_model_loaded` matched each selection), orientations/scales are correct in chase view, and no console/page errors were emitted.
- Re-downloaded all four Poly Pizza realistic GLB assets to ensure local files are complete and not stale.
- Updated external GLB material handling to use `THREE.DoubleSide`, reducing missing-face artifacts on single-sided geometry.
- Added persistent front/rear direction markers (front warm white, rear red) so heading is always distinguishable.
- Recalibrated `modelRotationY` defaults for all four vehicles so visual heading better matches movement with arrow-key steering.
- Validation: `node --check game.js` passed.
- Follow-up heading fix: Playwright screenshots showed sport/SUV/police were aligned, but the Humvee pickup was still sideways at `Math.PI / 2`; `0` made it drive backward, and `Math.PI` made chase view show the rear with the vehicle moving forward. Updated pickup `modelRotationY` to `Math.PI`.
- Validation: `node --check game.js` passed, ran the develop-web-game Playwright client for all four vehicles, visually inspected screenshots, and no `errors-*.json` files were generated.
- External-view steering fix: user reported chase/external view left-right steering was visually reversed while cockpit view was correct. Changed the visible car group rotation from `-p.angle` to `p.angle`; cockpit camera and physics still use `forwardVector(p.angle)`.
- Validation: `node --check game.js` passed, ran develop-web-game Playwright right-turn and left-turn checks in chase view, inspected screenshots, and no `errors-*.json` files were generated.

## TODO

- Optional next improvements: higher-detail licensed GLB models, more arenas, persistent best score.
