import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("game");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resultTitle = document.getElementById("result-title");
const resultCopy = document.getElementById("result-copy");
const vehicleButtons = [...document.querySelectorAll(".vehicle-option")];

const WORLD = {
  minX: -120,
  maxX: 200,
  minZ: -65,
  maxZ: 65,
};

const keys = new Set();
const tmp = new THREE.Vector3();
const gltfLoader = new GLTFLoader();
const touchControls = {
  steer: 0,
  throttle: 0,
  brake: false,
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (from, to, t) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * clamp(t, 0, 1);
const rand = (min, max) => min + Math.random() * (max - min);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(canvas.width, canvas.height, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc1d5);
scene.fog = new THREE.Fog(0x9fc1d5, 60, 200);

const camera = new THREE.PerspectiveCamera(62, canvas.width / canvas.height, 0.08, 150);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xf7f0dc, 0x34443f, 2.2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.1);
sun.position.set(-18, 28, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
scene.add(sun);

const mats = {
  asphalt: new THREE.MeshStandardMaterial({ color: 0x33383a, roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x2f6b4f, roughness: 0.95 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x8b9396, roughness: 0.86 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xb5b8b2, roughness: 0.82 }),
  building: new THREE.MeshStandardMaterial({ color: 0x5b6468, roughness: 0.78 }),
  window: new THREE.MeshBasicMaterial({ color: 0xd6efff, transparent: true, opacity: 0.72 }),
  line: new THREE.MeshBasicMaterial({ color: 0xf2c14e }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.55, metalness: 0.08 }),
  red: new THREE.MeshStandardMaterial({ color: 0xe84855, roughness: 0.55, metalness: 0.04 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x14323d,
    roughness: 0.18,
    metalness: 0.02,
    transmission: 0,
    transparent: true,
    opacity: 0.72,
  }),
  tire: new THREE.MeshStandardMaterial({ color: 0x151719, roughness: 0.75 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x8d979e, roughness: 0.66, metalness: 0.1 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.52 }),
  cyan: new THREE.MeshStandardMaterial({ color: 0x31a9b8, roughness: 0.5, metalness: 0.04 }),
  black: new THREE.MeshBasicMaterial({ color: 0x090a0b }),
  spark: new THREE.MeshBasicMaterial({ color: 0xffd66b }),
  smoke: new THREE.MeshBasicMaterial({ color: 0x293036, transparent: true, opacity: 0.42 }),
  crack: new THREE.MeshBasicMaterial({ color: 0xdff7ff, transparent: true, opacity: 0.72 }),
};

const VEHICLES = {
  sport: {
    id: "sport",
    name: "运动轿车",
    color: 0xe84855,
    secondary: 0xf4efe6,
    length: 4.1,
    width: 1.72,
    bodyHeight: 0.6,
    cabinHeight: 0.62,
    rideHeight: 0.4,
    mass: 1,
    durability: 1.45,
    acceleration: 22,
    maxSpeed: 31,
    reverseSpeed: 9,
    handling: 3.2,
    radius: 1.38,
    style: "sport",
    model: "assets/models/poly-pizza-realistic/supercar.glb",
    modelScale: 0.01,
    modelYOffset: 0,
    modelRotationY: Math.PI / 2,
  },
  suv: {
    id: "suv",
    name: "越野 SUV",
    color: 0x2f6b4f,
    secondary: 0xf1efe5,
    length: 4.55,
    width: 1.95,
    bodyHeight: 0.84,
    cabinHeight: 0.78,
    rideHeight: 0.5,
    mass: 1.32,
    durability: 1.8,
    acceleration: 17,
    maxSpeed: 25,
    reverseSpeed: 7,
    handling: 2.45,
    radius: 1.58,
    style: "suv",
    model: "assets/models/poly-pizza-realistic/range-rover.glb",
    modelScale: 1,
    modelYOffset: 1.33,
    modelRotationY: Math.PI / 2,
  },
  pickup: {
    id: "pickup",
    name: "重型皮卡",
    color: 0xf2c14e,
    secondary: 0x30343a,
    length: 5.15,
    width: 2.02,
    bodyHeight: 0.78,
    cabinHeight: 0.68,
    rideHeight: 0.52,
    mass: 1.55,
    durability: 2.05,
    acceleration: 15,
    maxSpeed: 23,
    reverseSpeed: 7,
    handling: 2.08,
    radius: 1.72,
    style: "pickup",
    model: "assets/models/poly-pizza-realistic/humvee.glb",
    modelScale: 1,
    modelYOffset: 0.06,
    modelRotationY: Math.PI,
  },
  police: {
    id: "police",
    name: "警用轿车",
    color: 0xf4efe6,
    secondary: 0x151719,
    length: 4.35,
    width: 1.82,
    bodyHeight: 0.66,
    cabinHeight: 0.66,
    rideHeight: 0.42,
    mass: 1.12,
    durability: 1.65,
    acceleration: 20,
    maxSpeed: 29,
    reverseSpeed: 8,
    handling: 2.85,
    radius: 1.46,
    style: "police",
    model: "assets/models/poly-pizza-realistic/dodge-charger.glb",
    modelScale: 1,
    modelYOffset: 0.37,
    modelRotationY: Math.PI / 2,
  },
};

const state = {
  mode: "menu",
  viewMode: "chase",
  selectedVehicleId: "sport",
  timeLeft: 75,
  score: 0,
  bestImpact: 0,
  combo: 1,
  comboTimer: 0,
  cameraShake: 0,
  cameraYaw: 0,
  slowMo: 0,
  message: "",
  messageTimer: 0,
  player: null,
  obstacles: [],
  particles: [],
  skidMarks: [],
  damageMarks: [],
  damageHits: 0,
  looseParts: [],
  wreckLevel: 0,
  smokeTimer: 0,
};

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audio = {
  supported: Boolean(AudioContextClass),
  initialized: false,
  enabled: true,
  ctx: null,
  master: null,
  engineOscA: null,
  engineOscB: null,
  engineGain: null,
  noiseBuffer: null,
  lastImpactTime: 0,
};

function currentVehicle() {
  return VEHICLES[state.selectedVehicleId] || VEHICLES.sport;
}

function initAudio() {
  if (!audio.supported || audio.initialized) return;
  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  const engineFilter = ctx.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 900;
  engineFilter.Q.value = 0.8;

  const engineGain = ctx.createGain();
  engineGain.gain.value = 0;

  const engineOscA = ctx.createOscillator();
  engineOscA.type = "sawtooth";
  engineOscA.frequency.value = 45;
  const engineOscB = ctx.createOscillator();
  engineOscB.type = "triangle";
  engineOscB.frequency.value = 92;

  engineOscA.connect(engineFilter);
  engineOscB.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(master);
  engineOscA.start();
  engineOscB.start();

  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    const fade = 1 - i / channel.length;
    channel[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  audio.initialized = true;
  audio.ctx = ctx;
  audio.master = master;
  audio.engineOscA = engineOscA;
  audio.engineOscB = engineOscB;
  audio.engineGain = engineGain;
  audio.noiseBuffer = noiseBuffer;
}

function ensureAudioActive() {
  if (!audio.enabled) return;
  initAudio();
  if (!audio.ctx) return;
  if (audio.ctx.state === "suspended") audio.ctx.resume().catch(() => {});
}

function setAudioEnabled(enabled, showMessage = true) {
  if (!audio.supported) {
    if (showMessage) {
      state.message = "当前浏览器不支持网页音频";
      state.messageTimer = 1.6;
    }
    return;
  }
  audio.enabled = enabled;
  initAudio();
  if (!audio.ctx || !audio.master) return;
  if (enabled) ensureAudioActive();
  const now = audio.ctx.currentTime;
  audio.master.gain.cancelScheduledValues(now);
  audio.master.gain.setTargetAtTime(enabled ? 0.6 : 0.0001, now, 0.03);
  if (showMessage) {
    state.message = enabled ? "声音已开启" : "声音已关闭";
    state.messageTimer = 1.1;
  }
}

function toggleAudio() {
  setAudioEnabled(!audio.enabled, true);
}

function playUiTone(freq, duration = 0.09, level = 0.04, type = "triangle") {
  if (!audio.enabled) return;
  ensureAudioActive();
  if (!audio.ctx || !audio.master || audio.ctx.state !== "running") return;
  const now = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(level, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(now);
  osc.stop(now + duration);
}

function playImpact(amount) {
  if (!audio.enabled) return;
  ensureAudioActive();
  if (!audio.ctx || !audio.master || !audio.noiseBuffer || audio.ctx.state !== "running") return;
  const nowMs = performance.now();
  if (nowMs - audio.lastImpactTime < 70) return;
  audio.lastImpactTime = nowMs;

  const now = audio.ctx.currentTime;
  const noise = audio.ctx.createBufferSource();
  noise.buffer = audio.noiseBuffer;
  noise.playbackRate.value = clamp(1 + amount / 110, 0.9, 2.3);

  const band = audio.ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = clamp(420 + amount * 45, 420, 2600);
  band.Q.value = 0.8;

  const thud = audio.ctx.createOscillator();
  thud.type = "triangle";
  thud.frequency.setValueAtTime(clamp(90 + amount * 2.6, 90, 220), now);
  thud.frequency.exponentialRampToValueAtTime(clamp(50 + amount, 50, 140), now + 0.16);

  const noiseGain = audio.ctx.createGain();
  const thudGain = audio.ctx.createGain();
  const intensity = clamp(0.05 + amount / 180, 0.05, 0.25);
  noiseGain.gain.setValueAtTime(intensity, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  thudGain.gain.setValueAtTime(intensity * 0.8, now);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  noise.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(audio.master);
  thud.connect(thudGain);
  thudGain.connect(audio.master);

  noise.start(now);
  noise.stop(now + 0.22);
  thud.start(now);
  thud.stop(now + 0.2);
}

function updateAudio() {
  if (!audio.initialized || !audio.ctx || !audio.engineGain) return;
  const now = audio.ctx.currentTime;
  const p = state.player;
  const active = audio.enabled && state.mode === "playing" && p;
  const speed = p ? Math.abs(p.speed) : 0;
  const throttleIntent = active && (isDown("arrowup", "w") || touchControls.throttle > 0) ? 1 : 0;
  const brakeIntent = active && (isDown(" ", "space", "spacebar") || touchControls.brake) ? 1 : 0;
  const gain = active
    ? clamp(0.012 + speed * 0.003 + throttleIntent * 0.02 - brakeIntent * 0.008, 0.01, 0.13)
    : 0;
  const baseFreq = active ? 44 + speed * 5.4 + throttleIntent * 24 : 40;
  audio.engineGain.gain.setTargetAtTime(gain, now, active ? 0.07 : 0.16);
  audio.engineOscA.frequency.setTargetAtTime(baseFreq, now, 0.08);
  audio.engineOscB.frequency.setTargetAtTime(baseFreq * 2.02, now, 0.08);
}

const meshes = {
  car: null,
  carBody: null,
  carFront: null,
  carHood: null,
  carCabin: null,
  carRoof: null,
  carBumper: null,
  carRearBumper: null,
  carDoors: [],
  carLights: [],
  carWheels: [],
  carShellExtras: [],
  carDirectionMarkers: [],
  carExternalModel: null,
  carDamageGroup: null,
  cockpit: null,
  cockpitHood: null,
  cockpitCracks: [],
  obstacles: new Map(),
  particles: new Set(),
  skidMarks: new Set(),
  looseParts: new Set(),
};

function makeBox(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeCylinder(radius, height, material, segments = 28) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function rememberCarPart(part) {
  part.userData.baseTransform = {
    position: part.position.clone(),
    rotation: part.rotation.clone(),
    scale: part.scale.clone(),
  };
  part.userData.detached = false;
  return part;
}

function resetCarPart(part) {
  const base = part.userData.baseTransform;
  if (!base) return;
  part.visible = true;
  part.userData.detached = false;
  part.position.copy(base.position);
  part.rotation.copy(base.rotation);
  part.scale.copy(base.scale);
}

function loadExternalVehicleModel(vehicle, car) {
  if (!vehicle.model) return;
  gltfLoader.load(
    vehicle.model,
    (gltf) => {
      if (meshes.car !== car || state.selectedVehicleId !== vehicle.id) return;
      if (meshes.carExternalModel) car.remove(meshes.carExternalModel);
      const model = gltf.scene;
      model.name = `external-${vehicle.id}`;
      model.position.set(0, vehicle.modelYOffset || 0, 0);
      model.rotation.x = vehicle.modelRotationX || 0;
      model.rotation.y = vehicle.modelRotationY || 0;
      model.rotation.z = vehicle.modelRotationZ || 0;
      model.scale.setScalar(vehicle.modelScale || 1);
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.side = THREE.DoubleSide;
          child.material.roughness = Math.min(0.72, child.material.roughness ?? 0.6);
          child.material.metalness = Math.max(0.04, child.material.metalness ?? 0.02);
        }
      });
      car.add(model);
      meshes.carExternalModel = model;
      window.__debug_external_model_loaded = vehicle.id;
      setProceduralShellVisible(false);
      render();
    },
    undefined,
    () => {
      window.__debug_external_model_loaded = false;
      state.message = "外部车模加载失败，使用内置车身";
      state.messageTimer = 1.6;
    },
  );
}

function updateExternalVehicleDamage(damage) {
  if (!meshes.carExternalModel) return;
  meshes.carExternalModel.scale.x = (meshes.carProfile.vehicle.modelScale || 1) * (1 - damage * 0.08);
  meshes.carExternalModel.scale.y = (meshes.carProfile.vehicle.modelScale || 1) * (1 - damage * 0.04);
  meshes.carExternalModel.rotation.z = damage > 0.65 ? rand(-0.012, 0.012) : 0;
  meshes.carExternalModel.traverse((child) => {
    if (!child.isMesh || !child.material?.color) return;
    if (!child.userData.baseColor) child.userData.baseColor = child.material.color.clone();
    child.material.color.copy(child.userData.baseColor).lerp(new THREE.Color(0x6f6f6a), damage * 0.32);
  });
}

function setProceduralShellVisible(visible) {
  [
    meshes.carBody,
    meshes.carFront,
    meshes.carHood,
    meshes.carCabin,
    meshes.carRoof,
    meshes.carBumper,
    meshes.carRearBumper,
    ...meshes.carDoors,
    ...meshes.carLights,
    ...meshes.carWheels,
    ...meshes.carShellExtras,
  ].forEach((part) => {
    if (part && !part.userData.detached) part.visible = visible;
  });
}

function addBuilding(x, z, w, h, d, color) {
  const mat = mats.building.clone();
  mat.color.set(color);
  const building = makeBox(w, h, d, mat);
  building.position.set(x, h * 0.5, z);
  scene.add(building);

  const rows = Math.max(2, Math.floor(h / 1.25));
  const cols = Math.max(2, Math.floor(w / 1.8));
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 1; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if ((row + col) % 3 === 0) continue;
        const win = makeBox(0.5, 0.36, 0.035, mats.window.clone());
        win.position.set(x - w * 0.38 + col * (w * 0.76 / Math.max(1, cols - 1)), row * 1.05, z + side * (d * 0.5 + 0.022));
        scene.add(win);
      }
    }
  }
}

function addCrosswalk(x) {
  for (let z = -13; z <= 13; z += 1.25) {
    const stripe = makeBox(3.2, 0.022, 0.42, mats.white.clone());
    stripe.position.set(x, 0.035, z);
    scene.add(stripe);
  }
}

function buildWorld() {
  const worldCenterX = (WORLD.minX + WORLD.maxX) / 2;
  const worldW = WORLD.maxX - WORLD.minX;
  const worldD = WORLD.maxZ - WORLD.minZ;

  const cityBase = new THREE.Mesh(new THREE.PlaneGeometry(worldW + 60, worldD + 60), mats.concrete);
  cityBase.rotation.x = -Math.PI / 2;
  cityBase.position.set(worldCenterX, -0.055, 0);
  cityBase.receiveShadow = true;
  scene.add(cityBase);

  const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(worldW, 30), mats.asphalt);
  mainRoad.rotation.x = -Math.PI / 2;
  mainRoad.position.set(worldCenterX, 0, 0);
  mainRoad.receiveShadow = true;
  scene.add(mainRoad);

  for (const x of [-90, -60, -30, 0, 30, 60, 90, 120, 150, 180]) {
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(11, worldD + 10), mats.asphalt);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(x, 0.002, 0);
    crossRoad.receiveShadow = true;
    scene.add(crossRoad);
    addCrosswalk(x - 6);
    addCrosswalk(x + 6);
  }

  for (const z of [-17.2, 17.2]) {
    const sidewalk = makeBox(worldW, 0.14, 4.0, mats.sidewalk.clone());
    sidewalk.position.set(worldCenterX, 0.07, z);
    scene.add(sidewalk);
  }

  for (let x = WORLD.minX + 4; x < WORLD.maxX; x += 8) {
    const dash = makeBox(3.2, 0.024, 0.14, mats.line);
    dash.position.set(x, 0.03, -0.08);
    dash.receiveShadow = false;
    scene.add(dash);
    const sideLineA = makeBox(2.8, 0.022, 0.1, mats.white.clone());
    sideLineA.position.set(x + 1.2, 0.031, -7.5);
    const sideLineB = sideLineA.clone();
    sideLineB.position.z = 7.5;
    scene.add(sideLineA, sideLineB);
  }

  const curbMat = new THREE.MeshStandardMaterial({ color: 0x6c7478, roughness: 0.7 });
  for (const z of [WORLD.minZ + 0.25, WORLD.maxZ - 0.25, -15.2, 15.2]) {
    const curb = makeBox(worldW, 0.36, 0.32, curbMat);
    curb.position.set(worldCenterX, 0.18, z);
    scene.add(curb);
  }
  for (const x of [WORLD.minX + 0.25, WORLD.maxX - 0.25]) {
    const curb = makeBox(0.36, 0.4, worldD + 2, curbMat);
    curb.position.set(x, 0.2, 0);
    scene.add(curb);
  }

  const buildingColors = [0x59656b, 0x766f68, 0x4d5a61, 0x847d70, 0x66717a];
  for (let i = 0; i < 50; i += 1) {
    const x = WORLD.minX + 10 + i * 6.5;
    const upper = i % 2 === 0;
    const z = upper ? rand(-58, -22) : rand(22, 58);
    addBuilding(x, z, rand(3.4, 5.8), rand(4.8, 13.5), rand(3.2, 6.2), buildingColors[i % buildingColors.length]);
  }

  for (let i = 0; i < 60; i += 1) {
    const scuff = makeBox(rand(1.8, 5.2), 0.018, 0.05, mats.black);
    scuff.position.set(rand(WORLD.minX + 5, WORLD.maxX - 5), 0.034, rand(-12, 12));
    scuff.rotation.y = rand(-0.55, 0.55);
    scuff.material = mats.black.clone();
    scuff.material.transparent = true;
    scuff.material.opacity = 0.1;
    scene.add(scuff);
  }
}

function buildCar() {
  if (meshes.car) scene.remove(meshes.car);
  meshes.carExternalModel = null;
  meshes.carDoors = [];
  meshes.carLights = [];
  meshes.carWheels = [];
  meshes.carShellExtras = [];
  meshes.carDirectionMarkers = [];
  const vehicle = currentVehicle();
  const bodyMat = new THREE.MeshStandardMaterial({ color: vehicle.secondary, roughness: 0.52, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: vehicle.color, roughness: 0.55, metalness: 0.06 });
  const car = new THREE.Group();
  const shellExtras = [];

  const body = makeBox(vehicle.length * 0.92, vehicle.bodyHeight, vehicle.width, bodyMat.clone());
  body.position.y = vehicle.rideHeight + vehicle.bodyHeight * 0.5;
  car.add(body);

  const front = makeBox(vehicle.length * 0.28, vehicle.bodyHeight * 0.84, vehicle.width * 0.9, accentMat.clone());
  front.position.set(vehicle.length * 0.32, vehicle.rideHeight + vehicle.bodyHeight * 0.72, 0);
  car.add(front);

  const hood = makeBox(vehicle.length * 0.32, 0.15, vehicle.width * 0.82, accentMat.clone());
  hood.position.set(vehicle.length * 0.2, vehicle.rideHeight + vehicle.bodyHeight + 0.12, 0);
  hood.rotation.z = -0.05;
  car.add(hood);

  const windshield = makeBox(0.12, vehicle.cabinHeight * 0.9, vehicle.width * 0.68, mats.glass.clone());
  windshield.position.set(vehicle.length * 0.04, vehicle.rideHeight + vehicle.bodyHeight + vehicle.cabinHeight * 0.42, 0);
  windshield.rotation.z = -0.35;
  car.add(windshield);
  shellExtras.push(windshield);

  const cabin = makeBox(vehicle.length * 0.26, vehicle.cabinHeight, vehicle.width * 0.68, mats.glass.clone());
  cabin.position.set(vehicle.style === "pickup" ? -vehicle.length * 0.12 : -vehicle.length * 0.1, vehicle.rideHeight + vehicle.bodyHeight + vehicle.cabinHeight * 0.48, 0);
  car.add(cabin);

  const roof = makeBox(vehicle.length * 0.27, 0.13, vehicle.width * 0.66, bodyMat.clone());
  roof.position.set(cabin.position.x, vehicle.rideHeight + vehicle.bodyHeight + vehicle.cabinHeight + 0.11, 0);
  car.add(roof);

  const rearDeck = makeBox(vehicle.length * (vehicle.style === "pickup" ? 0.38 : 0.28), vehicle.style === "pickup" ? 0.24 : 0.18, vehicle.width * 0.85, vehicle.style === "pickup" ? accentMat.clone() : bodyMat.clone());
  rearDeck.position.set(-vehicle.length * 0.32, vehicle.rideHeight + vehicle.bodyHeight + 0.03, 0);
  rearDeck.rotation.z = 0.04;
  car.add(rearDeck);
  shellExtras.push(rearDeck);

  const rearWindow = makeBox(0.12, vehicle.cabinHeight * 0.68, vehicle.width * 0.62, mats.glass.clone());
  rearWindow.position.set(cabin.position.x - vehicle.length * 0.16, vehicle.rideHeight + vehicle.bodyHeight + vehicle.cabinHeight * 0.42, 0);
  rearWindow.rotation.z = 0.34;
  car.add(rearWindow);
  shellExtras.push(rearWindow);

  const bumper = makeBox(0.18, 0.26, vehicle.width * 1.05, mats.black.clone());
  bumper.position.set(vehicle.length * 0.5, vehicle.rideHeight + 0.22, 0);
  car.add(bumper);

  const rearBumper = makeBox(0.22, 0.3, vehicle.width * 0.96, mats.black.clone());
  rearBumper.position.set(-vehicle.length * 0.51, vehicle.rideHeight + 0.22, 0);
  car.add(rearBumper);

  const doors = [];
  for (const z of [-vehicle.width * 0.53, vehicle.width * 0.53]) {
    const door = makeBox(vehicle.length * 0.28, vehicle.bodyHeight * 0.82, 0.08, bodyMat.clone());
    door.position.set(vehicle.style === "pickup" ? -vehicle.length * 0.09 : -vehicle.length * 0.1, vehicle.rideHeight + vehicle.bodyHeight * 0.82, z);
    door.rotation.x = z > 0 ? 0.03 : -0.03;
    car.add(door);
    doors.push(door);

    const mirror = makeBox(0.18, 0.1, 0.18, mats.black.clone());
    mirror.position.set(vehicle.length * 0.1, vehicle.rideHeight + vehicle.bodyHeight + 0.32, z * 1.05);
    car.add(mirror);
    shellExtras.push(mirror);
  }

  const lights = [];
  for (const z of [-vehicle.width * 0.28, vehicle.width * 0.28]) {
    const light = makeBox(0.08, 0.14, 0.32, new THREE.MeshBasicMaterial({ color: 0xfff1aa }));
    light.position.set(vehicle.length * 0.52, vehicle.rideHeight + vehicle.bodyHeight * 0.75, z);
    car.add(light);
    lights.push(light);

    const tail = makeBox(0.08, 0.16, 0.28, new THREE.MeshBasicMaterial({ color: 0xb91f2d }));
    tail.position.set(-vehicle.length * 0.54, vehicle.rideHeight + vehicle.bodyHeight * 0.75, z);
    car.add(tail);
    lights.push(tail);
  }

  if (vehicle.style === "police") {
    const sideStripe = makeBox(vehicle.length * 0.62, 0.18, 0.04, new THREE.MeshBasicMaterial({ color: 0x111317 }));
    sideStripe.position.set(-0.18, vehicle.rideHeight + vehicle.bodyHeight * 0.88, vehicle.width * 0.54);
    car.add(sideStripe);
    shellExtras.push(sideStripe);
    const lightbar = makeBox(0.72, 0.14, 0.38, new THREE.MeshBasicMaterial({ color: 0x2368ff }));
    lightbar.position.set(cabin.position.x, roof.position.y + 0.14, 0);
    const redHalf = makeBox(0.34, 0.15, 0.39, new THREE.MeshBasicMaterial({ color: 0xe84855 }));
    redHalf.position.set(cabin.position.x + 0.19, roof.position.y + 0.15, 0);
    car.add(lightbar, redHalf);
    shellExtras.push(lightbar, redHalf);
  }

  if (vehicle.style === "sport") {
    const spoiler = makeBox(0.16, 0.08, vehicle.width * 0.78, mats.black.clone());
    spoiler.position.set(-vehicle.length * 0.49, roof.position.y - 0.46, 0);
    car.add(spoiler);
    shellExtras.push(spoiler);
  }

  if (vehicle.style === "suv" || vehicle.style === "pickup") {
    const rails = [-0.28, 0.28].map((z) => {
      const rail = makeBox(vehicle.length * 0.36, 0.05, 0.04, mats.black.clone());
      rail.position.set(cabin.position.x - 0.12, roof.position.y + 0.12, z);
      return rail;
    });
    car.add(...rails);
    shellExtras.push(...rails);
  }

  const frontMarker = makeBox(0.16, 0.07, Math.max(0.36, vehicle.width * 0.34), new THREE.MeshBasicMaterial({ color: 0xfff1aa }));
  frontMarker.position.set(vehicle.length * 0.56, vehicle.rideHeight + vehicle.bodyHeight * 0.98, 0);
  car.add(frontMarker);
  const rearMarker = makeBox(0.16, 0.07, Math.max(0.32, vehicle.width * 0.3), new THREE.MeshBasicMaterial({ color: 0xb91f2d }));
  rearMarker.position.set(-vehicle.length * 0.58, vehicle.rideHeight + vehicle.bodyHeight * 0.98, 0);
  car.add(rearMarker);

  const wheels = [];
  for (const x of [-vehicle.length * 0.31, vehicle.length * 0.3]) {
    for (const z of [-vehicle.width * 0.57, vehicle.width * 0.57]) {
      const wheelGroup = new THREE.Group();
      const tireRadius = vehicle.style === "suv" || vehicle.style === "pickup" ? 0.42 : 0.36;
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, 0.24, 28), mats.tire);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.5, tireRadius * 0.5, 0.27, 18), mats.metal.clone());
      rim.rotation.x = Math.PI / 2;
      rim.castShadow = true;
      wheelGroup.add(tire, rim);
      wheelGroup.position.set(x, vehicle.rideHeight, z);
      car.add(wheelGroup);
      wheels.push(wheelGroup);
    }
  }

  const damageGroup = new THREE.Group();
  car.add(damageGroup);
  scene.add(car);

  meshes.car = car;
  meshes.carBody = body;
  meshes.carFront = front;
  meshes.carHood = hood;
  meshes.carCabin = cabin;
  meshes.carRoof = roof;
  meshes.carBumper = bumper;
  meshes.carRearBumper = rearBumper;
  meshes.carDoors = doors;
  meshes.carLights = lights;
  meshes.carWheels = wheels;
  meshes.carShellExtras = shellExtras;
  meshes.carDirectionMarkers = [frontMarker, rearMarker];
  meshes.carDamageGroup = damageGroup;
  meshes.carProfile = {
    vehicle,
    bodyMat,
    accentMat,
    frontBase: front.position.clone(),
    hoodBase: hood.position.clone(),
    bumperBase: bumper.position.clone(),
    doorBase: doors.map((door) => door.position.clone()),
  };

  loadExternalVehicleModel(vehicle, car);

  [
    body,
    front,
    hood,
    windshield,
    cabin,
    roof,
    rearDeck,
    rearWindow,
    bumper,
    rearBumper,
    ...doors,
    ...lights,
    frontMarker,
    rearMarker,
    ...wheels,
    ...shellExtras,
  ].forEach(rememberCarPart);
}

function buildCockpit() {
  const cockpit = new THREE.Group();
  cockpit.visible = false;

  const dash = makeBox(1.9, 0.34, 0.26, new THREE.MeshStandardMaterial({ color: 0x191b1d, roughness: 0.7 }));
  dash.position.set(0, -0.74, -1.18);
  dash.castShadow = false;
  cockpit.add(dash);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 32), mats.black);
  wheel.position.set(-0.44, -0.52, -0.88);
  wheel.rotation.x = Math.PI / 2.6;
  cockpit.add(wheel);

  const hood = makeBox(2.1, 0.22, 1.4, mats.red.clone());
  hood.position.set(0, -0.9, -2.28);
  hood.rotation.x = -0.08;
  cockpit.add(hood);
  meshes.cockpitHood = hood;

  for (let i = 0; i < 10; i += 1) {
    const crack = makeBox(rand(0.16, 0.58), 0.012, 0.012, mats.crack);
    crack.position.set(rand(-0.7, 0.7), rand(-0.26, 0.35), -1.05);
    crack.rotation.z = rand(-1.25, 1.25);
    crack.visible = false;
    cockpit.add(crack);
    meshes.cockpitCracks.push(crack);
  }

  camera.add(cockpit);
  meshes.cockpit = cockpit;
}

function makePlayer() {
  const vehicle = currentVehicle();
  return {
    x: -80,
    z: 0,
    vx: 0,
    vz: 0,
    angle: 0,
    speed: 0,
    radius: vehicle.radius,
    damage: 0,
    lastSkid: 0,
  };
}

function makeObstacle(x, z, radius, type, hp, mass, material, shape) {
  const obstacle = {
    id: crypto.randomUUID(),
    x,
    z,
    vx: 0,
    vz: 0,
    radius,
    type,
    hp,
    maxHp: hp,
    mass,
    yaw: rand(-0.65, 0.65),
    spin: 0,
    hitTimer: 0,
    mesh: null,
  };

  let mesh;
  if (shape === "barrel") {
    mesh = makeCylinder(radius * 0.55, 1.35, material, 28);
    mesh.position.y = 0.68;
  } else if (shape === "tire") {
    mesh = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.42, radius * 0.16, 8, 28), mats.tire);
      tire.position.y = 0.32 + i * 0.3;
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      mesh.add(tire);
    }
  } else if (shape === "car") {
    mesh = new THREE.Group();
    const body = makeBox(radius * 2.15, 0.62, radius * 1.08, material);
    body.position.y = 0.58;
    const hood = makeBox(radius * 0.7, 0.18, radius * 0.92, material.clone ? material.clone() : material);
    hood.position.set(radius * 0.42, 1.0, 0);
    const cabin = makeBox(radius * 0.78, 0.52, radius * 0.76, mats.glass.clone());
    cabin.position.set(-radius * 0.22, 1.04, 0);
    const frontLights = makeBox(0.08, 0.1, radius * 0.62, new THREE.MeshBasicMaterial({ color: 0xfff1aa }));
    frontLights.position.set(radius * 1.12, 0.66, 0);
    const tailLights = makeBox(0.08, 0.12, radius * 0.58, new THREE.MeshBasicMaterial({ color: 0xb91f2d }));
    tailLights.position.set(-radius * 1.12, 0.66, 0);
    mesh.add(body, hood, cabin, frontLights, tailLights);
    for (const wx of [-radius * 0.72, radius * 0.72]) {
      for (const wz of [-radius * 0.58, radius * 0.58]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.18, 18), mats.tire);
        wheel.position.set(wx, 0.34, wz);
        wheel.rotation.x = Math.PI / 2;
        wheel.castShadow = true;
        mesh.add(wheel);
      }
    }
  } else {
    mesh = makeBox(radius * 1.7, radius * 0.95, radius * 1.25, material);
    mesh.position.y = radius * 0.48;
  }

  mesh.position.set(x, mesh.position.y || 0, z);
  mesh.rotation.y = obstacle.yaw;
  obstacle.mesh = mesh;
  meshes.obstacles.set(obstacle.id, mesh);
  scene.add(mesh);
  return obstacle;
}

function makeTrafficCar(x, z, yaw, color, type = "其它汽车") {
  const car = makeObstacle(x, z, 1.65, type, 72, 2.35, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08 }), "car");
  car.yaw = yaw;
  car.mesh.rotation.y = yaw;
  return car;
}

function createObstacles() {
  clearObstacles();
  return [
    // West zone x=-110 to -50
    makeTrafficCar(-110, -7.4, 0.04, 0x2d6a8e),
    makeTrafficCar(-103, 7.1, Math.PI + 0.06, 0x9d2f3f),
    makeTrafficCar(-95, -6.2, 0.08, 0xf4efe6),
    makeTrafficCar(-88, 7.4, Math.PI - 0.05, 0x2f6b4f),
    makeTrafficCar(-80, -3.8, Math.PI / 2, 0xd6a33a, "横停车辆"),
    makeTrafficCar(-72, 6.8, Math.PI + 0.04, 0x5d6a74),
    makeTrafficCar(-64, -7.5, -0.06, 0x8f3e2f),
    makeTrafficCar(-56, 3.6, -Math.PI / 2, 0x31a9b8, "横停车辆"),
    // Mid-west zone x=-45 to 0
    makeTrafficCar(-48, -7.2, 0.03, 0xf2c14e),
    makeTrafficCar(-40, 6.5, Math.PI - 0.04, 0x465c7a),
    makeTrafficCar(-32, -4.1, Math.PI / 2, 0x923a63, "横停车辆"),
    makeTrafficCar(-24, 7.3, Math.PI + 0.02, 0xb7b0a3),
    makeTrafficCar(-16, -7.1, -0.03, 0x3e7a56),
    makeTrafficCar(-8, 5.8, Math.PI - 0.07, 0x22272a),
    // Central zone x=5 to 60
    makeTrafficCar(5, -5.5, 0.05, 0x4a7fc1),
    makeTrafficCar(12, 7.0, Math.PI + 0.06, 0xe84855),
    makeTrafficCar(20, -7.4, -0.04, 0x7a5c3e),
    makeTrafficCar(28, 3.8, -Math.PI / 2, 0x3a8f5e, "横停车辆"),
    makeTrafficCar(36, 6.7, Math.PI + 0.03, 0x9e6b4a),
    makeTrafficCar(44, -6.8, 0.07, 0x4d6892),
    makeTrafficCar(52, 7.5, Math.PI - 0.05, 0xb34d2f),
    // East zone x=65 to 130
    makeTrafficCar(65, -5.2, 0.04, 0x2f7f6a),
    makeTrafficCar(74, 7.0, Math.PI + 0.05, 0x7a9e3e),
    makeTrafficCar(83, -7.6, -0.03, 0x5e3a92),
    makeTrafficCar(92, 4.2, Math.PI / 2, 0xc8a83a, "横停车辆"),
    makeTrafficCar(100, 6.4, Math.PI - 0.06, 0x3e7a9e),
    makeTrafficCar(108, -7.0, 0.04, 0x8f4a3a),
    makeTrafficCar(116, 7.2, Math.PI + 0.02, 0x4a6e8f),
    makeTrafficCar(124, -6.3, -0.05, 0x6f4a7e),
    // Far east zone x=135 to 190
    makeTrafficCar(135, 5.5, Math.PI - 0.03, 0x2d8ea3),
    makeTrafficCar(144, -7.3, 0.06, 0x9a4f68),
    makeTrafficCar(153, 6.8, Math.PI + 0.04, 0x4a8c5e),
    makeTrafficCar(162, -4.6, -Math.PI / 2, 0xd4823a, "横停车辆"),
    makeTrafficCar(170, 7.4, Math.PI - 0.02, 0x5e6a9e),
    makeTrafficCar(178, -6.9, 0.05, 0x8e4a2f),
    makeTrafficCar(187, 5.3, Math.PI + 0.07, 0x3e8f7a),
    // Scattered obstacles
    makeObstacle(-95, 0.5, 1.25, "施工桶", 32, 1.2, mats.yellow.clone(), "barrel"),
    makeObstacle(-60, -10.5, 1.08, "油桶", 24, 1.1, mats.red.clone(), "barrel"),
    makeObstacle(-10, 10.8, 1.22, "轮胎堆", 30, 1.4, mats.tire, "tire"),
    makeObstacle(40, 0.3, 1.25, "施工桶", 32, 1.2, mats.yellow.clone(), "barrel"),
    makeObstacle(85, -11.2, 1.45, "路障", 40, 1.8, mats.yellow.clone(), "block"),
    makeObstacle(130, 10.4, 1.22, "轮胎堆", 30, 1.4, mats.tire, "tire"),
    makeObstacle(165, -10.8, 1.08, "油桶", 24, 1.1, mats.red.clone(), "barrel"),
  ];
}

function clearObstacles() {
  for (const mesh of meshes.obstacles.values()) scene.remove(mesh);
  meshes.obstacles.clear();
}

function resetGame() {
  ensureAudioActive();
  playUiTone(560, 0.1, 0.045);
  buildCar();
  state.mode = "playing";
  state.viewMode = state.viewMode || "chase";
  state.timeLeft = 75;
  state.score = 0;
  state.bestImpact = 0;
  state.combo = 1;
  state.comboTimer = 0;
  state.cameraShake = 0;
  state.slowMo = 0;
  state.message = "城市道路已开放";
  state.messageTimer = 2.2;
  state.player = makePlayer();
  state.cameraYaw = state.player.angle;
  state.particles = [];
  state.skidMarks = [];
  state.damageMarks = [];
  state.damageHits = 0;
  state.looseParts = [];
  state.wreckLevel = 0;
  state.smokeTimer = 0;
  state.obstacles = createObstacles();
  clearDynamicMeshes();
  resetCarVisuals();
  updateCarDamageVisuals();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function clearDynamicMeshes() {
  for (const mesh of meshes.particles) scene.remove(mesh);
  for (const mesh of meshes.skidMarks) scene.remove(mesh);
  for (const mesh of meshes.looseParts) scene.remove(mesh);
  meshes.particles.clear();
  meshes.skidMarks.clear();
  meshes.looseParts.clear();
  meshes.carDamageGroup.clear();
}

function resetCarVisuals() {
  [
    meshes.carBody,
    meshes.carFront,
    meshes.carHood,
    meshes.carCabin,
    meshes.carRoof,
    meshes.carBumper,
    meshes.carRearBumper,
    ...meshes.carDoors,
    ...meshes.carLights,
    ...meshes.carDirectionMarkers,
    ...meshes.carWheels,
    ...meshes.carShellExtras,
  ].forEach(resetCarPart);
  if (meshes.carExternalModel) setProceduralShellVisible(false);
}

function finishGame(reason) {
  if (state.mode === "gameover") return;
  state.mode = "gameover";
  playUiTone(reason === "totaled" ? 220 : 420, reason === "totaled" ? 0.22 : 0.16, 0.05, "sawtooth");
  resultTitle.textContent = reason === "totaled" ? "车辆报废" : "测试结束";
  resultCopy.textContent = `评分 ${Math.round(state.score)}，最大撞击 ${Math.round(
    state.bestImpact,
  )} km/h，车损 ${Math.round(state.player.damage)}%。`;
  gameOverScreen.classList.remove("hidden");
}

function isDown(...names) {
  return names.some((name) => keys.has(name));
}

function forwardVector(angle = state.player?.angle || 0) {
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

function controlPlayer(dt) {
  const p = state.player;
  const vehicle = currentVehicle();
  const throttle =
    Math.max(isDown("arrowup", "w") ? 1 : 0, touchControls.throttle) -
    (isDown("arrowdown", "s") ? 0.58 : 0);
  const steer =
    (isDown("arrowright", "d") ? 1 : 0) -
    (isDown("arrowleft", "a") ? 1 : 0) +
    touchControls.steer;
  const brake = isDown(" ", "space", "spacebar") || touchControls.brake;

  const acceleration = throttle * (brake ? vehicle.acceleration * 0.58 : vehicle.acceleration);
  p.speed += acceleration * dt;
  p.speed *= brake ? 0.91 : 0.986 - (vehicle.mass - 1) * 0.002;
  p.speed = clamp(p.speed, -vehicle.reverseSpeed, vehicle.maxSpeed);

  const steeringGrip = clamp(Math.abs(p.speed) / 12, 0.18, 1);
  p.angle += clamp(steer, -1, 1) * steeringGrip * dt * vehicle.handling * (p.speed >= 0 ? 1 : -1);

  p.vx = Math.cos(p.angle) * p.speed;
  p.vz = Math.sin(p.angle) * p.speed;
  p.x += p.vx * dt;
  p.z += p.vz * dt;

  if ((brake || Math.abs(steer) > 0.5) && Math.abs(p.speed) > 9) {
    p.lastSkid += dt;
    if (p.lastSkid > 0.08) {
      addSkidMark(p);
      p.lastSkid = 0;
    }
  }

  handleWalls(p);
}

function handleWalls(p) {
  const bounce = 0.48;
  const wallImpactX = Math.abs(p.vx) * 8.5;
  const wallImpactZ = Math.abs(p.vz) * 8.5;
  if (p.x < WORLD.minX + 1.3 || p.x > WORLD.maxX - 1.3) {
    p.x = clamp(p.x, WORLD.minX + 1.3, WORLD.maxX - 1.3);
    if (wallImpactX > 18) applyCollisionDamage(wallImpactX, "护栏");
    p.speed *= -bounce;
  }
  if (p.z < WORLD.minZ + 1.3 || p.z > WORLD.maxZ - 1.3) {
    p.z = clamp(p.z, WORLD.minZ + 1.3, WORLD.maxZ - 1.3);
    if (wallImpactZ > 18) applyCollisionDamage(wallImpactZ, "护栏");
    p.speed *= -bounce;
  }
}

function collidePlayerWithObstacles() {
  const p = state.player;
  for (const o of state.obstacles) {
    if (o.hp <= 0) continue;
    const dx = o.x - p.x;
    const dz = o.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const minD = p.radius + o.radius;
    if (d >= minD) continue;

    const nx = dx / d;
    const nz = dz / d;
    const closing = Math.max(0, p.vx * nx + p.vz * nz - (o.vx * nx + o.vz * nz));
    const impact = closing * 8.5;
    const impactDamage = clamp(impact * o.mass * 0.34, 3.5, 44);
    const overlap = minD - d;

    p.x -= nx * overlap * 0.58;
    p.z -= nz * overlap * 0.58;
    o.x += nx * overlap * 0.42;
    o.z += nz * overlap * 0.42;

    p.speed *= -clamp(0.18 + o.mass * 0.08, 0.24, 0.6);
    o.vx += nx * closing * (1.45 / o.mass);
    o.vz += nz * closing * (1.45 / o.mass);
    o.spin += rand(-3.8, 3.8) * (impact / 45);
    o.hp -= impactDamage;
    o.hitTimer = 0.28;

    applyCollisionDamage(impactDamage * 1.15, o.type);
    state.combo = clamp(state.combo + 0.2, 1, 5);
    state.comboTimer = 2.3;
    state.bestImpact = Math.max(state.bestImpact, impact);
    state.score += impactDamage * 28 * state.combo + impact * 5;
    state.slowMo = Math.max(state.slowMo, clamp(impact / 120, 0.06, 0.36));

    addParticles(p.x + nx * p.radius, p.z + nz * p.radius, Math.round(clamp(impact / 4, 8, 32)), o.hp <= 0 ? 0xf2c14e : 0xfff0d0);

    if (o.hp <= 0) {
      state.score += o.maxHp * 11;
      addParticles(o.x, o.z, 24, 0xffd66b);
      o.mesh.visible = false;
    }
  }
}

function applyCollisionDamage(amount, label) {
  const p = state.player;
  const vehicle = currentVehicle();
  const before = p.damage;
  p.damage = clamp(p.damage + (amount * 0.18) / vehicle.durability, 0, 100);
  state.damageHits += 1;
  state.cameraShake = Math.max(state.cameraShake, clamp(amount * 0.33, 0.8, 5.4));
  state.message = p.damage > 82 ? `${label} 重击，车辆严重损毁` : `${label} 撞击，新增破损`;
  state.messageTimer = 1.35;
  playImpact(amount);
  addDamageMark(amount);
  triggerBreakage(before, p.damage, amount);
  updateCarDamageVisuals();
  if (before < 62 && p.damage >= 62) addSmokeBurst(18);
  if (before < 78 && p.damage >= 78) addParticles(p.x - Math.cos(p.angle) * 0.8, p.z - Math.sin(p.angle) * 0.8, 18, 0x30363b);
}

function addDamageMark(amount) {
  const scratch = makeBox(rand(0.22, 0.72), 0.018, 0.026, mats.black.clone());
  scratch.material.transparent = true;
  scratch.material.opacity = clamp(0.38 + amount / 90, 0.42, 0.9);
  scratch.position.set(rand(0.18, 1.78), 1.08 + rand(-0.18, 0.24), rand(-0.76, 0.76));
  scratch.rotation.y = rand(-0.8, 0.8);
  scratch.rotation.z = rand(-0.45, 0.45);
  meshes.carDamageGroup.add(scratch);
  state.damageMarks.push({ localX: scratch.position.x, localZ: scratch.position.z });
}

function updateCarDamageVisuals() {
  const p = state.player || { damage: 0 };
  const profile = meshes.carProfile || {};
  const vehicle = profile.vehicle || currentVehicle();
  const damage = p.damage / 100;
  meshes.carBody.material.color.set(vehicle.secondary).lerp(new THREE.Color(0x817f78), damage * 0.62);
  meshes.carFront.material.color.set(vehicle.color).lerp(new THREE.Color(0x4d3333), damage * 0.88);
  meshes.carFront.scale.x = 1 - damage * 0.48;
  meshes.carFront.scale.y = 1 - damage * 0.22;
  meshes.carFront.position.x = profile.frontBase.x - damage * vehicle.length * 0.12;
  meshes.carFront.rotation.z = -damage * 0.16;
  meshes.carHood.material.color.set(vehicle.color).lerp(new THREE.Color(0x4d3333), damage * 0.8);
  if (!meshes.carHood.userData.detached) {
    meshes.carHood.scale.x = 1 - damage * 0.28;
    meshes.carHood.scale.y = 1 - damage * 0.34;
    meshes.carHood.position.x = profile.hoodBase.x - damage * vehicle.length * 0.055;
    meshes.carHood.position.y = profile.hoodBase.y + Math.max(0, damage - 0.35) * 0.55;
    meshes.carHood.rotation.z = meshes.carHood.userData.baseTransform.rotation.z - damage * 0.55;
  }
  if (!meshes.carBumper.userData.detached) {
    meshes.carBumper.rotation.z = damage * 0.42;
    meshes.carBumper.position.x = profile.bumperBase.x - damage * vehicle.length * 0.1;
    meshes.carBumper.position.y = profile.bumperBase.y - damage * 0.18;
  }
  meshes.carCabin.material.opacity = 0.72 - damage * 0.2;
  meshes.carRoof.rotation.z = damage > 0.7 ? rand(-0.015, 0.015) : 0;
  if (meshes.cockpitHood) {
    meshes.cockpitHood.material.color.set(0xe84855).lerp(new THREE.Color(0x4d3333), damage * 0.9);
    meshes.cockpitHood.scale.x = 1 - damage * 0.2;
    meshes.cockpitHood.scale.y = 1 - damage * 0.42;
    meshes.cockpitHood.position.y = -0.9 + Math.max(0, damage - 0.35) * 0.5;
    meshes.cockpitHood.rotation.x = -0.08 - damage * 0.18;
    meshes.cockpitHood.rotation.z = damage * 0.08;
  }

  meshes.carDoors.forEach((door, index) => {
    if (door.userData.detached) return;
    const side = index === 0 ? -1 : 1;
    door.rotation.y = side * damage * 0.34;
    door.rotation.z = side * damage * 0.12;
    door.position.x = profile.doorBase[index].x - damage * 0.05;
  });

  meshes.carWheels.forEach((wheel, index) => {
    if (wheel.userData.detached) return;
    const front = index >= 2;
    const wobble = damage * (front ? 0.34 : 0.18);
    wheel.rotation.z = (index % 2 === 0 ? -1 : 1) * wobble;
    wheel.position.y = wheel.userData.baseTransform.position.y - damage * (front ? 0.08 : 0.03);
  });

  meshes.carLights.forEach((light, index) => {
    if (light.userData.detached) return;
    const frontLight = index < 2;
    light.visible = !frontLight || damage < 0.34 + index * 0.1;
  });

  updateExternalVehicleDamage(damage);

  meshes.cockpitCracks.forEach((crack, index) => {
    crack.visible = index < Math.ceil(state.damageHits * 0.9);
    crack.material.opacity = clamp(0.35 + damage * 0.65, 0.35, 0.95);
  });
}

function triggerBreakage(previousDamage, nextDamage, amount) {
  if (previousDamage < 18 && nextDamage >= 18) {
    detachCarPart(meshes.carBumper, amount, "front-bumper");
  }
  if (previousDamage < 32 && nextDamage >= 32) {
    detachCarPart(meshes.carLights[0], amount, "headlight-left");
    detachCarPart(meshes.carLights[1], amount, "headlight-right");
  }
  if (previousDamage < 48 && nextDamage >= 48) {
    detachCarPart(meshes.carHood, amount, "hood");
  }
  if (previousDamage < 64 && nextDamage >= 64) {
    detachCarPart(meshes.carDoors[0], amount, "left-door");
  }
  if (previousDamage < 80 && nextDamage >= 80) {
    detachCarPart(meshes.carWheels[2], amount, "front-wheel");
    detachCarPart(meshes.carDoors[1], amount, "right-door");
  }
  state.wreckLevel = Math.max(state.wreckLevel, Math.floor(nextDamage / 20));
}

function detachCarPart(source, amount, name) {
  if (!source || source.userData.detached) return;
  source.userData.detached = true;
  source.visible = false;

  const part = source.clone(true);
  part.visible = true;
  source.getWorldPosition(part.position);
  source.getWorldQuaternion(part.quaternion);
  source.getWorldScale(part.scale);
  part.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  scene.add(part);
  meshes.looseParts.add(part);

  const p = state.player;
  const fwd = forwardVector(p.angle);
  const side = rand(-1, 1);
  state.looseParts.push({
    name,
    mesh: part,
    vx: fwd.x * rand(2.4, 6.8) + side * rand(-2.4, 2.4),
    vy: rand(2.2, 5.8) + amount * 0.015,
    vz: fwd.z * rand(2.4, 6.8) + side * rand(2.4, 4.8),
    spinX: rand(-4, 4),
    spinY: rand(-5, 5),
    spinZ: rand(-4, 4),
    life: 12,
  });
  addParticles(p.x + fwd.x * 0.9, p.z + fwd.z * 0.9, 16, 0xbfc5c8);
}

function addSmokeBurst(count) {
  const p = state.player;
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(rand(0.12, 0.32), 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x24282b, transparent: true, opacity: rand(0.18, 0.42) }),
    );
    const fwd = forwardVector(p.angle);
    mesh.position.set(p.x + fwd.x * rand(0.3, 1.2), rand(0.95, 1.9), p.z + fwd.z * rand(0.3, 1.2));
    scene.add(mesh);
    meshes.particles.add(mesh);
    state.particles.push({
      mesh,
      vx: rand(-0.7, 0.7),
      vy: rand(1.4, 3.4),
      vz: rand(-0.7, 0.7),
      life: rand(0.8, 1.8),
      maxLife: 1.8,
    });
  }
}

function updateObstacles(dt) {
  for (const o of state.obstacles) {
    if (o.hp <= 0) continue;
    o.x += o.vx * dt;
    o.z += o.vz * dt;
    o.vx *= 0.986;
    o.vz *= 0.986;
    o.yaw += o.spin * dt;
    o.spin *= 0.97;
    o.hitTimer = Math.max(0, o.hitTimer - dt);
    o.x = clamp(o.x, WORLD.minX + o.radius, WORLD.maxX - o.radius);
    o.z = clamp(o.z, WORLD.minZ + o.radius, WORLD.maxZ - o.radius);
    o.mesh.position.x = o.x;
    o.mesh.position.z = o.z;
    o.mesh.rotation.y = o.yaw;
    o.mesh.scale.setScalar(o.hitTimer > 0 ? 1.06 : 1);
  }
}

function addParticles(x, z, count, color) {
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(rand(0.035, 0.12), 8, 8), new THREE.MeshBasicMaterial({ color }));
    mesh.position.set(x, rand(0.45, 1.55), z);
    scene.add(mesh);
    meshes.particles.add(mesh);
    const a = rand(0, Math.PI * 2);
    state.particles.push({
      mesh,
      vx: Math.cos(a) * rand(2.2, 8),
      vy: rand(2, 8),
      vz: Math.sin(a) * rand(2.2, 8),
      life: rand(0.25, 0.9),
      maxLife: rand(0.45, 0.95),
    });
  }
}

function addSkidMark(p) {
  const mark = makeBox(1.35, 0.016, 0.055, mats.black.clone());
  mark.material.transparent = true;
  mark.material.opacity = 0.24;
  mark.position.set(p.x - Math.cos(p.angle) * 0.6, 0.035, p.z - Math.sin(p.angle) * 0.6);
  mark.rotation.y = -p.angle;
  scene.add(mark);
  meshes.skidMarks.add(mark);
  state.skidMarks.push({ mesh: mark, life: 5 });
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.mesh.position.x += particle.vx * dt;
    particle.mesh.position.y += particle.vy * dt;
    particle.mesh.position.z += particle.vz * dt;
    particle.vy -= 12 * dt;
    particle.life -= dt;
    particle.mesh.material.opacity = clamp(particle.life / particle.maxLife, 0, 1);
  }
  state.particles = state.particles.filter((particle) => {
    if (particle.life > 0) return true;
    scene.remove(particle.mesh);
    meshes.particles.delete(particle.mesh);
    return false;
  });

  for (const mark of state.skidMarks) {
    mark.life -= dt;
    mark.mesh.material.opacity = clamp(mark.life / 5, 0, 0.24);
  }
  state.skidMarks = state.skidMarks.filter((mark) => {
    if (mark.life > 0) return true;
    scene.remove(mark.mesh);
    meshes.skidMarks.delete(mark.mesh);
    return false;
  });
}

function updateLooseParts(dt) {
  for (const part of state.looseParts) {
    part.mesh.position.x += part.vx * dt;
    part.mesh.position.y += part.vy * dt;
    part.mesh.position.z += part.vz * dt;
    part.vy -= 9.8 * dt;
    part.vx *= 0.992;
    part.vz *= 0.992;
    part.mesh.rotation.x += part.spinX * dt;
    part.mesh.rotation.y += part.spinY * dt;
    part.mesh.rotation.z += part.spinZ * dt;
    if (part.mesh.position.y < 0.16) {
      part.mesh.position.y = 0.16;
      part.vy *= -0.24;
      part.vx *= 0.82;
      part.vz *= 0.82;
      part.spinX *= 0.76;
      part.spinY *= 0.76;
      part.spinZ *= 0.76;
    }
    part.life -= dt;
  }

  state.looseParts = state.looseParts.filter((part) => {
    if (part.life > 0) return true;
    scene.remove(part.mesh);
    meshes.looseParts.delete(part.mesh);
    return false;
  });
}

function updateCarMesh() {
  const p = state.player;
  meshes.car.position.set(p.x, 0, p.z);
  meshes.car.rotation.y = -p.angle;
  meshes.car.visible = state.viewMode !== "cockpit" || state.mode !== "playing";
}

function updateCamera(dt) {
  const p = state.player || makePlayer();
  const fwd = forwardVector(p.angle);
  const shake = state.cameraShake > 0 ? state.cameraShake * 0.05 : 0;
  const sx = rand(-shake, shake);
  const sy = rand(-shake, shake);

  if (state.viewMode === "cockpit" && state.mode === "playing") {
    const vehicle = currentVehicle();
    const cockpitPos = tmp.set(p.x, 1.36 + vehicle.cabinHeight * 0.36, p.z).addScaledVector(fwd, 0.66);
    camera.position.copy(cockpitPos);
    camera.position.x += sx;
    camera.position.y += sy;
    camera.lookAt(p.x + fwd.x * 12, 1.82, p.z + fwd.z * 12);
    meshes.cockpit.visible = true;
  } else {
    if (!Number.isFinite(state.cameraYaw)) state.cameraYaw = p.angle;
    state.cameraYaw = lerpAngle(state.cameraYaw, p.angle, state.mode === "playing" ? dt * 0.75 : 1);
    const chaseFwd = forwardVector(state.cameraYaw);
    const desired = new THREE.Vector3(p.x, 5.9, p.z).addScaledVector(chaseFwd, -10.2);
    desired.x += sx;
    desired.y += sy;
    camera.position.lerp(desired, clamp(dt * 7.5, 0.22, 1));
    camera.lookAt(p.x + chaseFwd.x * 5.2, 1.25, p.z + chaseFwd.z * 5.2);
    meshes.cockpit.visible = false;
  }
}

function update(dt) {
  updateAudio();
  if (state.mode !== "playing") return;
  const simDt = state.slowMo > 0 ? dt * 0.5 : dt;
  state.timeLeft -= dt;
  state.comboTimer -= dt;
  state.cameraShake = Math.max(0, state.cameraShake - dt * 4.8);
  state.slowMo = Math.max(0, state.slowMo - dt);
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  if (state.comboTimer <= 0) state.combo = lerp(state.combo, 1, dt * 1.7);

  controlPlayer(simDt);
  updateObstacles(simDt);
  collidePlayerWithObstacles();
  updateParticles(dt);
  updateLooseParts(dt);
  if (state.player.damage > 58) {
    state.smokeTimer -= dt;
    if (state.smokeTimer <= 0) {
      addSmokeBurst(state.player.damage > 84 ? 4 : 2);
      state.smokeTimer = state.player.damage > 84 ? 0.18 : 0.34;
    }
  }
  updateCarMesh();

  if (state.player.damage >= 100) finishGame("totaled");
  if (state.timeLeft <= 0) finishGame("timer");
}

function drawHud() {
  const p = state.player || makePlayer();
  const vehicle = currentVehicle();
  const damageColor = p.damage > 72 ? "#e84855" : p.damage > 42 ? "#f2c14e" : "#31a9b8";
  const view = state.viewMode === "cockpit" ? "车内" : "追车";

  const hud = document.getElementById("runtime-hud") || createHud();
  hud.innerHTML = `
    <div class="hud-card">
      <strong>评分 ${Math.round(state.score)}</strong>
      <span>速度 ${Math.round(Math.abs(p.speed) * 8.5)} km/h</span>
      <span>车辆 ${vehicle.name}</span>
      <span>剩余 ${Math.max(0, Math.ceil(state.timeLeft))}s</span>
      <span>视角 ${view}</span>
      <i style="--damage:${p.damage}%;--damage-color:${damageColor}"></i>
      <small>车损 ${Math.round(p.damage)}% / 撞痕 ${state.damageHits} / 脱落 ${state.looseParts.length}</small>
    </div>
    <div class="hud-card right">
      <strong>连击 x${state.combo.toFixed(1)}</strong>
      <span>最大撞击 ${Math.round(state.bestImpact)} km/h</span>
      <span>C 视角  R 重开  P 暂停  M 声音  F 全屏</span>
      <span>声音 ${audio.enabled ? "开" : "关"}</span>
    </div>
    <div class="message ${state.messageTimer > 0 ? "" : "hidden"}">${state.message}</div>
  `;
  hud.classList.toggle("hidden", state.mode === "menu");
}

function createHud() {
  const hud = document.createElement("div");
  hud.id = "runtime-hud";
  hud.className = "runtime-hud";
  canvas.parentElement.appendChild(hud);
  return hud;
}

function createTouchControls() {
  const controls = document.createElement("div");
  controls.id = "touch-controls";
  controls.className = "touch-controls hidden";
  controls.innerHTML = `
    <div class="touch-steer" data-touch-pad>
      <div class="touch-knob" data-touch-knob></div>
    </div>
    <div class="touch-actions">
      <button class="touch-mini" type="button" data-action="view">视角</button>
      <button class="touch-mini" type="button" data-action="pause">暂停</button>
      <button class="touch-mini" type="button" data-action="restart">重开</button>
    </div>
    <div class="touch-pedals">
      <button class="touch-pedal brake" type="button" data-pedal="brake">刹车</button>
      <button class="touch-pedal gas" type="button" data-pedal="gas">油门</button>
    </div>
  `;
  canvas.parentElement.appendChild(controls);

  const pad = controls.querySelector("[data-touch-pad]");
  const knob = controls.querySelector("[data-touch-knob]");
  let activeSteerPointer = null;

  function updateSteer(event) {
    const rect = pad.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dx = clamp(event.clientX - center, -rect.width * 0.42, rect.width * 0.42);
    touchControls.steer = clamp(dx / (rect.width * 0.42), -1, 1);
    knob.style.transform = `translate(${touchControls.steer * 38}px, -50%)`;
  }

  pad.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activeSteerPointer = event.pointerId;
    pad.setPointerCapture(event.pointerId);
    updateSteer(event);
  });
  pad.addEventListener("pointermove", (event) => {
    if (event.pointerId === activeSteerPointer) updateSteer(event);
  });
  function releaseSteer(event) {
    if (event.pointerId !== activeSteerPointer) return;
    activeSteerPointer = null;
    touchControls.steer = 0;
    knob.style.transform = "translate(0, -50%)";
  }
  pad.addEventListener("pointerup", releaseSteer);
  pad.addEventListener("pointercancel", releaseSteer);

  controls.querySelectorAll("[data-pedal]").forEach((button) => {
    const isGas = button.dataset.pedal === "gas";
    const setActive = (active) => {
      if (isGas) touchControls.throttle = active ? 1 : 0;
      else touchControls.brake = active;
      button.classList.toggle("active", active);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setActive(true);
    });
    button.addEventListener("pointerup", () => setActive(false));
    button.addEventListener("pointercancel", () => setActive(false));
    button.addEventListener("lostpointercapture", () => setActive(false));
  });

  controls.querySelector('[data-action="view"]').addEventListener("click", toggleView);
  controls.querySelector('[data-action="pause"]').addEventListener("click", togglePause);
  controls.querySelector('[data-action="restart"]').addEventListener("click", resetGame);
  return controls;
}

function updateTouchControlsVisibility() {
  const controls = document.getElementById("touch-controls") || createTouchControls();
  const visible = state.mode === "playing" || state.mode === "paused";
  controls.classList.toggle("hidden", !visible);
  controls.classList.toggle("paused", state.mode === "paused");
}

function render() {
  resizeRendererToDisplaySize();
  updateCamera(1 / 60);
  drawHud();
  updateTouchControlsVisibility();
  renderer.render(scene, camera);
}

function togglePause() {
  if (state.mode === "playing") {
    state.mode = "paused";
    playUiTone(330, 0.08, 0.038);
  } else if (state.mode === "paused") {
    state.mode = "playing";
    playUiTone(520, 0.08, 0.038);
  }
}

function toggleView() {
  state.viewMode = state.viewMode === "cockpit" ? "chase" : "cockpit";
  state.message = state.viewMode === "cockpit" ? "已切换到车内视角" : "已切换到追车视角";
  state.messageTimer = 1.1;
  playUiTone(state.viewMode === "cockpit" ? 700 : 610, 0.07, 0.028, "sine");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

function selectVehicle(id) {
  if (!VEHICLES[id]) return;
  state.selectedVehicleId = id;
  vehicleButtons.forEach((button) => button.classList.toggle("active", button.dataset.vehicle === id));
  if (state.mode === "menu") {
    state.player = makePlayer();
    buildCar();
    updateCarMesh();
    updateCarDamageVisuals();
    render();
  }
}

function keyName(event) {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
}

window.addEventListener("keydown", (event) => {
  ensureAudioActive();
  const name = keyName(event);
  keys.add(name);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(name)) event.preventDefault();
  if ((name === "enter" || name === " ") && state.mode === "menu") resetGame();
  if (name === "r") resetGame();
  if (name === "p") togglePause();
  if (name === "m") toggleAudio();
  if (name === "c" || name === "v") toggleView();
  if (name === "f") toggleFullscreen();
});

window.addEventListener("keyup", (event) => {
  keys.delete(keyName(event));
});

canvas.addEventListener("pointerdown", () => {
  ensureAudioActive();
  if (state.mode === "menu") resetGame();
});

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);
vehicleButtons.forEach((button) => {
  button.addEventListener("click", () => selectVehicle(button.dataset.vehicle));
});

window.addEventListener("resize", resizeRendererToDisplaySize);

function resizeRendererToDisplaySize() {
  const width = Math.max(320, Math.floor(canvas.clientWidth));
  const height = Math.max(240, Math.floor(canvas.clientHeight));
  if (canvas.width === width && canvas.height === height) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function renderGameToText() {
  const p = state.player;
  return JSON.stringify({
    coordinateSystem: "3D city world, x follows the main avenue, y up, z crosses lanes, units are meters",
    mode: state.mode,
    viewMode: state.viewMode,
    timeLeft: Number(state.timeLeft.toFixed(1)),
    score: Math.round(state.score),
    combo: Number(state.combo.toFixed(2)),
    selectedVehicle: currentVehicle().name,
    damageHits: state.damageHits,
    wreckLevel: state.wreckLevel,
    looseParts: state.looseParts.length,
    audioEnabled: audio.enabled,
    player: p
      ? {
          x: Number(p.x.toFixed(2)),
          z: Number(p.z.toFixed(2)),
          yaw: Number(p.angle.toFixed(2)),
          speed: Math.round(Math.abs(p.speed) * 8.5),
          damage: Math.round(p.damage),
        }
      : null,
    obstacles: state.obstacles
      .filter((o) => o.hp > 0)
      .slice(0, 16)
      .map((o) => ({
        type: o.type,
        x: Number(o.x.toFixed(1)),
        z: Number(o.z.toFixed(1)),
        hp: Math.round(o.hp),
      })),
    particles: state.particles.length,
    message: state.messageTimer > 0 ? state.message : "",
  });
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) update(1 / 60);
  updateCarMesh();
  render();
};

buildWorld();
buildCar();
buildCockpit();
state.player = makePlayer();
state.obstacles = createObstacles();
updateCarMesh();
updateCamera(1 / 60);
render();

let last = performance.now();
function loop(now) {
  const dt = clamp((now - last) / 1000, 0, 1 / 30);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
