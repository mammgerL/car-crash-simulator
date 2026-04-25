const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resultTitle = document.getElementById("result-title");
const resultCopy = document.getElementById("result-copy");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const pointer = { active: false, x: 0, y: 0 };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const state = {
  mode: "menu",
  timeLeft: 75,
  score: 0,
  bestImpact: 0,
  combo: 1,
  comboTimer: 0,
  cameraShake: 0,
  slowMo: 0,
  particles: [],
  skidMarks: [],
  obstacles: [],
  message: "",
  messageTimer: 0,
  player: null,
};

function makePlayer() {
  return {
    x: 176,
    y: H * 0.5,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0,
    width: 74,
    height: 36,
    radius: 32,
    damage: 0,
    engineHeat: 0,
    lastSkid: 0,
  };
}

function makeObstacle(x, y, radius, type, hp, mass, color) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    radius,
    type,
    hp,
    maxHp: hp,
    mass,
    color,
    angle: rand(-0.7, 0.7),
    spin: 0,
    hitTimer: 0,
  };
}

function resetGame() {
  state.mode = "playing";
  state.timeLeft = 75;
  state.score = 0;
  state.bestImpact = 0;
  state.combo = 1;
  state.comboTimer = 0;
  state.cameraShake = 0;
  state.slowMo = 0;
  state.particles = [];
  state.skidMarks = [];
  state.message = "冲刺，转向，撞碎测试场";
  state.messageTimer = 2.2;
  state.player = makePlayer();
  state.obstacles = [
    makeObstacle(520, 360, 32, "沙桶", 36, 1.7, "#f2c14e"),
    makeObstacle(510, 170, 22, "油桶", 26, 1.2, "#d94f3d"),
    makeObstacle(610, 215, 22, "油桶", 26, 1.2, "#d94f3d"),
    makeObstacle(720, 160, 22, "油桶", 26, 1.2, "#d94f3d"),
    makeObstacle(530, 530, 24, "轮胎堆", 32, 1.6, "#30343a"),
    makeObstacle(660, 505, 24, "轮胎堆", 32, 1.6, "#30343a"),
    makeObstacle(790, 540, 24, "轮胎堆", 32, 1.6, "#30343a"),
    makeObstacle(875, 290, 34, "测试车", 58, 2.7, "#31a9b8"),
    makeObstacle(1015, 400, 42, "混凝土块", 84, 3.8, "#8d979e"),
    makeObstacle(1020, 190, 30, "路障", 44, 2.1, "#f2c14e"),
    makeObstacle(1115, 520, 30, "路障", 44, 2.1, "#f2c14e"),
  ];
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function finishGame(reason) {
  if (state.mode === "gameover") return;
  state.mode = "gameover";
  const score = Math.round(state.score);
  const impact = Math.round(state.bestImpact);
  resultTitle.textContent = reason === "totaled" ? "车辆报废" : "测试结束";
  resultCopy.textContent = `评分 ${score}，最大撞击 ${impact} km/h，车损 ${Math.round(
    state.player.damage,
  )}%。`;
  gameOverScreen.classList.remove("hidden");
}

function isDown(...names) {
  return names.some((name) => keys.has(name));
}

function addParticles(x, y, count, color, power = 1) {
  for (let i = 0; i < count; i += 1) {
    const a = rand(0, Math.PI * 2);
    const s = rand(80, 320) * power;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.25, 0.8),
      maxLife: rand(0.5, 0.9),
      size: rand(2, 6) * power,
      color,
    });
  }
}

function addSkidMark(player) {
  state.skidMarks.push({
    x: player.x - Math.cos(player.angle) * 14,
    y: player.y - Math.sin(player.angle) * 14,
    angle: player.angle,
    life: 5,
  });
  if (state.skidMarks.length > 90) state.skidMarks.shift();
}

function controlPlayer(dt) {
  const p = state.player;
  const throttle =
    (isDown("arrowup", "w") ? 1 : 0) - (isDown("arrowdown", "s") ? 0.62 : 0);
  const steer = (isDown("arrowright", "d") ? 1 : 0) - (isDown("arrowleft", "a") ? 1 : 0);
  const brake = isDown(" ", "spacebar", "space");

  p.engineHeat = clamp(p.engineHeat + Math.max(0, throttle) * dt * 18 - dt * 12, 0, 100);
  const acceleration = throttle * (brake ? 260 : 470);
  p.speed += acceleration * dt;
  p.speed *= brake ? 0.91 : 0.988;
  p.speed = clamp(p.speed, -190, 650);

  const steeringGrip = clamp(Math.abs(p.speed) / 260, 0.15, 1);
  p.angle += steer * steeringGrip * dt * 2.8 * (p.speed >= 0 ? 1 : -1);

  p.vx = Math.cos(p.angle) * p.speed;
  p.vy = Math.sin(p.angle) * p.speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if ((brake || Math.abs(steer) > 0.5) && Math.abs(p.speed) > 180) {
    p.lastSkid += dt;
    if (p.lastSkid > 0.06) {
      addSkidMark(p);
      p.lastSkid = 0;
    }
  }

  const bounce = 0.46;
  const wallImpactX = Math.abs(p.vx) * 0.24;
  const wallImpactY = Math.abs(p.vy) * 0.24;
  if (p.x < 64 || p.x > W - 64) {
    p.x = clamp(p.x, 64, W - 64);
    if (wallImpactX > 18) {
      p.speed *= -bounce;
      p.damage = clamp(p.damage + wallImpactX * 0.12, 0, 100);
      state.cameraShake = Math.max(state.cameraShake, clamp(wallImpactX * 0.4, 6, 18));
      addParticles(p.x, p.y, 7, "#f7f0df", 0.7);
    } else {
      p.speed *= 0.82;
    }
  }
  if (p.y < 74 || p.y > H - 62) {
    p.y = clamp(p.y, 74, H - 62);
    if (wallImpactY > 18) {
      p.speed *= -bounce;
      p.damage = clamp(p.damage + wallImpactY * 0.12, 0, 100);
      state.cameraShake = Math.max(state.cameraShake, clamp(wallImpactY * 0.4, 6, 18));
      addParticles(p.x, p.y, 7, "#f7f0df", 0.7);
    } else {
      p.speed *= 0.82;
    }
  }
}

function collidePlayerWithObstacles() {
  const p = state.player;
  for (const o of state.obstacles) {
    if (o.hp <= 0) continue;
    const dx = o.x - p.x;
    const dy = o.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const minD = p.radius + o.radius;
    if (d >= minD) continue;

    const nx = dx / d;
    const ny = dy / d;
    const closing = Math.max(0, p.vx * nx + p.vy * ny - (o.vx * nx + o.vy * ny));
    const impact = closing / 7.6;
    const impactDamage = clamp(impact * o.mass * 0.42, 4, 46);

    const overlap = minD - d;
    p.x -= nx * overlap * 0.55;
    p.y -= ny * overlap * 0.55;
    o.x += nx * overlap * 0.45;
    o.y += ny * overlap * 0.45;

    p.speed *= -clamp(0.18 + o.mass * 0.08, 0.22, 0.55);
    o.vx += nx * closing * (1.2 / o.mass);
    o.vy += ny * closing * (1.2 / o.mass);
    o.spin += rand(-3.6, 3.6) * (impact / 18);
    o.hp -= impactDamage;
    o.hitTimer = 0.25;

    p.damage = clamp(p.damage + impactDamage * 0.38, 0, 100);
    state.combo = clamp(state.combo + 0.18, 1, 5);
    state.comboTimer = 2.2;
    state.bestImpact = Math.max(state.bestImpact, impact);
    state.score += impactDamage * 19 * state.combo + impact * 4;
    state.cameraShake = Math.max(state.cameraShake, clamp(impact * 0.62, 8, 28));
    state.slowMo = Math.max(state.slowMo, clamp(impact / 55, 0.08, 0.42));
    state.message = `${o.type} 撞击 ${Math.round(impact)} km/h`;
    state.messageTimer = 1.25;

    addParticles(
      p.x + nx * p.radius,
      p.y + ny * p.radius,
      Math.round(clamp(impact / 2, 8, 26)),
      o.hp <= 0 ? "#f2c14e" : "#f7f0df",
      clamp(impact / 42, 0.75, 1.45),
    );
    if (o.hp <= 0) {
      state.score += o.maxHp * 8;
      addParticles(o.x, o.y, 22, o.color, 1.1);
    }
  }
}

function updateObstacles(dt) {
  for (const o of state.obstacles) {
    if (o.hp <= 0) continue;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vx *= 0.985;
    o.vy *= 0.985;
    o.angle += o.spin * dt;
    o.spin *= 0.98;
    o.hitTimer = Math.max(0, o.hitTimer - dt);
    o.x = clamp(o.x, 55, W - 55);
    o.y = clamp(o.y, 78, H - 55);
  }
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.95;
    particle.vy *= 0.95;
    particle.life -= dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const mark of state.skidMarks) mark.life -= dt;
  state.skidMarks = state.skidMarks.filter((mark) => mark.life > 0);
}

function update(dt) {
  if (state.mode !== "playing") return;
  const simDt = state.slowMo > 0 ? dt * 0.45 : dt;
  state.timeLeft -= dt;
  state.comboTimer -= dt;
  state.cameraShake = Math.max(0, state.cameraShake - dt * 22);
  state.slowMo = Math.max(0, state.slowMo - dt);
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  if (state.comboTimer <= 0) state.combo = lerp(state.combo, 1, dt * 1.7);

  controlPlayer(simDt);
  updateObstacles(simDt);
  collidePlayerWithObstacles();
  updateParticles(dt);

  if (state.player.damage >= 100) finishGame("totaled");
  if (state.timeLeft <= 0) finishGame("timer");
}

function drawTrack() {
  const asphalt = ctx.createLinearGradient(0, 0, W, H);
  asphalt.addColorStop(0, "#35383a");
  asphalt.addColorStop(1, "#202325");
  ctx.fillStyle = asphalt;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#2f6b4f";
  ctx.fillRect(0, 0, W, 48);
  ctx.fillRect(0, H - 44, W, 44);
  ctx.fillStyle = "#30343a";
  ctx.fillRect(0, 48, W, 20);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  for (let x = -80; x < W + 120; x += 86) {
    ctx.beginPath();
    ctx.moveTo(x, 342);
    ctx.lineTo(x + 42, 342);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(242, 193, 78, 0.42)";
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 20]);
  ctx.beginPath();
  ctx.moveTo(70, 120);
  ctx.bezierCurveTo(380, 82, 600, 108, 795, 292);
  ctx.bezierCurveTo(955, 445, 1110, 425, 1210, 600);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let i = 0; i < 20; i += 1) {
    const x = (i * 173) % W;
    const y = 90 + ((i * 97) % 540);
    ctx.fillRect(x, y, 34, 2);
  }
}

function drawHud() {
  const p = state.player || makePlayer();
  const speed = Math.abs(p.speed) * 0.24;
  const damageColor = p.damage > 72 ? "#e84855" : p.damage > 42 ? "#f2c14e" : "#31a9b8";

  ctx.save();
  ctx.fillStyle = "rgba(12, 14, 15, 0.72)";
  ctx.fillRect(18, 18, 360, 94);
  ctx.fillStyle = "#f3f0e8";
  ctx.font = "800 22px system-ui, sans-serif";
  ctx.fillText(`评分 ${Math.round(state.score)}`, 34, 50);
  ctx.fillStyle = "#b5b1a7";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText(`速度 ${Math.round(speed)} km/h`, 34, 78);
  ctx.fillText(`剩余 ${Math.max(0, Math.ceil(state.timeLeft))}s`, 190, 78);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(34, 92, 252, 8);
  ctx.fillStyle = damageColor;
  ctx.fillRect(34, 92, 252 * (p.damage / 100), 8);
  ctx.fillStyle = "#b5b1a7";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillText(`车损 ${Math.round(p.damage)}%`, 296, 101);

  ctx.fillStyle = "rgba(12, 14, 15, 0.66)";
  ctx.fillRect(W - 272, 18, 254, 94);
  ctx.fillStyle = "#f3f0e8";
  ctx.font = "800 20px system-ui, sans-serif";
  ctx.fillText(`连击 x${state.combo.toFixed(1)}`, W - 254, 50);
  ctx.fillStyle = "#b5b1a7";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText(`最大撞击 ${Math.round(state.bestImpact)} km/h`, W - 254, 78);
  ctx.fillText("R 重开   P 暂停   F 全屏", W - 254, 100);

  if (state.messageTimer > 0) {
    ctx.globalAlpha = clamp(state.messageTimer, 0, 1);
    ctx.fillStyle = "rgba(12, 14, 15, 0.78)";
    ctx.fillRect(W * 0.5 - 210, H - 92, 420, 46);
    ctx.fillStyle = "#f2c14e";
    ctx.font = "800 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.message, W * 0.5, H - 62);
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function drawCar(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  const damage = p.damage / 100;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(-38, -18, 78, 39);
  ctx.fillStyle = "#f5f0e5";
  roundRect(-37, -18, 74, 36, 8);
  ctx.fill();
  ctx.fillStyle = "#e84855";
  roundRect(2, -15, 32, 30, 6);
  ctx.fill();
  ctx.fillStyle = "#2f343a";
  roundRect(-24, -13, 20, 26, 5);
  ctx.fill();
  ctx.fillStyle = `rgba(52, 55, 58, ${0.18 + damage * 0.62})`;
  ctx.fillRect(-32, -12, 16 + damage * 28, 24);
  ctx.fillStyle = "#202124";
  ctx.fillRect(-30, -24, 18, 7);
  ctx.fillRect(-30, 17, 18, 7);
  ctx.fillRect(16, -24, 18, 7);
  ctx.fillRect(16, 17, 18, 7);
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.moveTo(39, 0);
  ctx.lineTo(26, -9);
  ctx.lineTo(26, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawObstacle(o) {
  if (o.hp <= 0) return;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle);
  ctx.globalAlpha = o.hitTimer > 0 ? 0.82 : 1;
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(3, 6, o.radius * 1.05, o.radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = o.color;

  if (o.type === "测试车") {
    roundRect(-42, -20, 84, 40, 7);
    ctx.fill();
    ctx.fillStyle = "#173940";
    roundRect(-10, -15, 22, 30, 5);
    ctx.fill();
  } else if (o.type === "混凝土块") {
    roundRect(-42, -30, 84, 60, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 3;
    ctx.strokeRect(-34, -22, 68, 44);
  } else if (o.type === "路障") {
    roundRect(-36, -23, 72, 46, 4);
    ctx.fill();
    ctx.fillStyle = "#25272a";
    ctx.fillRect(-28, -6, 56, 12);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(-o.radius * 0.55, -o.radius, o.radius * 0.22, o.radius * 2);
    ctx.fillRect(o.radius * 0.25, -o.radius, o.radius * 0.22, o.radius * 2);
  }

  const hpRatio = clamp(o.hp / o.maxHp, 0, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(-24, -o.radius - 13, 48, 5);
  ctx.fillStyle = hpRatio > 0.5 ? "#31a9b8" : "#e84855";
  ctx.fillRect(-24, -o.radius - 13, 48 * hpRatio, 5);
  ctx.restore();
}

function drawParticles() {
  for (const mark of state.skidMarks) {
    ctx.save();
    ctx.translate(mark.x, mark.y);
    ctx.rotate(mark.angle);
    ctx.globalAlpha = clamp(mark.life / 5, 0, 0.38);
    ctx.fillStyle = "#090a0b";
    ctx.fillRect(-24, -20, 36, 4);
    ctx.fillRect(-24, 16, 36, 4);
    ctx.restore();
  }

  for (const particle of state.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPaused() {
  ctx.save();
  ctx.fillStyle = "rgba(10, 12, 14, 0.62)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f3f0e8";
  ctx.textAlign = "center";
  ctx.font = "900 54px system-ui, sans-serif";
  ctx.fillText("暂停", W / 2, H / 2 - 8);
  ctx.fillStyle = "#b5b1a7";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillText("按 P 继续", W / 2, H / 2 + 34);
  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function render() {
  ctx.save();
  if (state.cameraShake > 0) {
    ctx.translate(rand(-state.cameraShake, state.cameraShake), rand(-state.cameraShake, state.cameraShake));
  }
  drawTrack();
  drawParticles();
  for (const obstacle of state.obstacles) drawObstacle(obstacle);
  if (state.player) drawCar(state.player);
  ctx.restore();

  if (state.player) drawHud();
  if (state.mode === "paused") drawPaused();
}

function togglePause() {
  if (state.mode === "playing") state.mode = "paused";
  else if (state.mode === "paused") state.mode = "playing";
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function keyName(event) {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
}

window.addEventListener("keydown", (event) => {
  const name = keyName(event);
  keys.add(name);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(name)) {
    event.preventDefault();
  }
  if ((name === "enter" || name === " ") && state.mode === "menu") resetGame();
  if (name === "r") resetGame();
  if (name === "p") togglePause();
  if (name === "f") toggleFullscreen();
});

window.addEventListener("keyup", (event) => {
  keys.delete(keyName(event));
});

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.active = true;
  pointer.x = ((event.clientX - rect.left) / rect.width) * W;
  pointer.y = ((event.clientY - rect.top) / rect.height) * H;
  if (state.mode === "menu") resetGame();
});

window.addEventListener("pointerup", () => {
  pointer.active = false;
});

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);

function renderGameToText() {
  const p = state.player;
  return JSON.stringify({
    coordinateSystem: "origin top-left, x right, y down, canvas 1280x720",
    mode: state.mode,
    timeLeft: Number(state.timeLeft.toFixed(1)),
    score: Math.round(state.score),
    combo: Number(state.combo.toFixed(2)),
    player: p
      ? {
          x: Math.round(p.x),
          y: Math.round(p.y),
          angle: Number(p.angle.toFixed(2)),
          speed: Math.round(Math.abs(p.speed) * 0.24),
          damage: Math.round(p.damage),
        }
      : null,
    obstacles: state.obstacles
      .filter((o) => o.hp > 0)
      .slice(0, 10)
      .map((o) => ({
        type: o.type,
        x: Math.round(o.x),
        y: Math.round(o.y),
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
  render();
};

let last = performance.now();
function loop(now) {
  const dt = clamp((now - last) / 1000, 0, 1 / 30);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
render();
requestAnimationFrame(loop);
