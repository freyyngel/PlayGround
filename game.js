import { STATE_PATHS } from './states.js';

/* --------------------------------------------------------------------------
   Constants & state
   -------------------------------------------------------------------------- */

const WORLD_W = 1000;
const WORLD_H = 620;
const START_ABBR = 'WA';
const MAX_PANTS = 3;
const TAU = Math.PI * 2;

const REGIONS = [
  {
    name: 'Northeast',
    abbrs: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
  },
  {
    name: 'South',
    abbrs: ['AL', 'AR', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV'],
  },
  {
    name: 'Midwest',
    abbrs: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  },
  {
    name: 'West',
    abbrs: ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY'],
  },
];

const REGION_BY_ABBR = new Map();
for (const region of REGIONS) {
  for (const abbr of region.abbrs) REGION_BY_ABBR.set(abbr, region.name);
}

const STATE_LINES = {
  WA: 'Evergreen and relieved.',
  CA: 'You left your heart in California. Also something else.',
  OR: 'The Pacific Northwest approves of your hydration.',
  NV: 'What happens at the rest stop stays at the rest stop.',
  ID: 'A potato watched. It said nothing.',
  MT: 'Big Sky. Small bladder.',
  WY: 'The least-populated state just got a little more crowded.',
  UT: 'You found relief among the arches.',
  AZ: 'It was a dry heat. Not anymore.',
  NM: 'Breaking bad? More like breaking the seal.',
  CO: 'Rocky Mountain high. Bladder pressure low.',
  ND: 'You peed in North Dakota. It was very flat.',
  SD: 'Mount Rushmore has seen enough.',
  NE: 'The corn is not judging you. Probably.',
  KS: 'You are not in Kansas anymore. You are in a restroom in Kansas.',
  OK: 'The wind came sweeping down the plain. So did you.',
  TX: 'Everything is bigger in Texas. The relief, thankfully, is complete.',
  MN: 'A nice Minnesotan said “ope” and handed you a towel.',
  IA: 'You marked Iowa. The corn approves.',
  MO: 'The Show-Me State showed you a restroom.',
  AR: 'The Natural State. Unnatural relief.',
  LA: 'Laissez les bons temps rouler. And flush.',
  WI: 'Cheese curds were a mistake.',
  IL: 'You relieved yourself in Illinois. Chicago is unimpressed.',
  MI: 'Two peninsulas, one bladder.',
  IN: 'You crossed Indiana. The checkered flag is a toilet.',
  OH: 'Ohio: the heart of it all. Also the bladder of it all.',
  KY: 'You peed in Kentucky. The horses remain unbothered.',
  TN: 'Rocky Top, you’ll always be home to me. And a bathroom.',
  MS: 'The Magnolia State. A magnolia-sized relief.',
  AL: 'The Yellowhammer State. Let’s not discuss the color.',
  GA: 'You peed in Georgia. The peaches are fine.',
  FL: 'Florida Man has finally met his match.',
  SC: 'South Carolina: low country, low pressure.',
  NC: 'The Tar Heel State. You left no trace.',
  VA: 'Virginia is for lovers. And rest stops.',
  WV: 'Almost heaven. Definitely relieved.',
  MD: 'The Old Line State. The new bladder state.',
  DE: 'The First State, second rest stop of the day.',
  NJ: 'You peed in New Jersey. The Turnpike forgives you.',
  PA: 'The Keystone State. The key was a restroom.',
  NY: 'A rat gave you a five-star review.',
  CT: 'The Nutmeg State. A nutmeg-sized relief.',
  RI: 'The Ocean State. You made a small splash.',
  MA: 'You peed in Massachusetts. Harvard is taking notes.',
  VT: 'Maple syrup. Cedar. Relief.',
  NH: 'Live free or pee. You chose both.',
  ME: 'The way life should be. Also the way relief should be.',
  AK: 'You flew to Alaska for this. Bold.',
  HI: 'Aloha. You have reached peak relief.',
};

const states = STATE_PATHS.map((raw) => ({
  ...raw,
  path: new Path2D(raw.d),
  region: REGION_BY_ABBR.get(raw.abbr) || 'West',
  visited: false,
  stampAt: 0,
}));

const stateByAbbr = Object.fromEntries(states.map((state) => [state.abbr, state]));

const game = {
  phase: 'menu', // menu | playing | ended
  visited: new Set(),
  target: null,
  currentAbbr: START_ABBR,
  car: { x: stateByAbbr[START_ABBR].x, y: stateByAbbr[START_ABBR].y, angle: -Math.PI / 2 },
  bladder: 0,
  pants: MAX_PANTS,
  score: 0,
  perfect: 0,
  accidents: 0,
  elapsed: 0,
  clench: false,
  hovered: null,
  runId: 0,
  finishing: false,
};

const effects = {
  particles: [],
  puddles: [],
  floaters: [],
};

const view = { scale: 1, ox: 0, oy: 0, cw: 0, ch: 0, dpr: 1 };

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */

const $ = (selector) => document.querySelector(selector);

const canvas = $('#map');
const ctx = canvas.getContext('2d');
const mapFrame = $('#mapFrame');
const mapTip = $('#mapTip');
const mapToast = $('#mapToast');
const mapFlash = $('#mapFlash');
const startOverlay = $('#startOverlay');
const endOverlay = $('#endOverlay');
const statesDialog = $('#statesDialog');
const helpDialog = $('#helpDialog');
const liveRegion = $('#live');

const ui = {
  progress: $('#progressText'),
  time: $('#timeText'),
  score: $('#scoreText'),
  routeKicker: $('#routeKicker'),
  routeTitle: $('#routeTitle'),
  routeMeta: $('#routeMeta'),
  nextName: $('#nextName'),
  nextMeta: $('#nextMeta'),
  nearestCount: $('#nearestCount'),
  nearestList: $('#nearestList'),
  mobileNearestList: $('#mobileNearestList'),
  mobileNearestCount: $('#mobileNearestCount'),
  dialogNearest: $('#dialogNearest'),
  stateGrid: $('#stateGrid'),
  roadLog: $('#roadLog'),
  bladderPct: $('#bladderPct'),
  bladderBar: $('#bladderBar'),
  bladderFill: $('#bladderFill'),
  bladderHint: $('#bladderHint'),
  pantsMeter: $('#pantsMeter'),
  clenchBtn: $('#clenchBtn'),
  soundBtn: $('#soundBtn'),
  bestLine: $('#bestLine'),
  endBest: $('#endBest'),
  endStamp: $('#endStamp'),
  endKicker: $('#endKicker'),
  endTitle: $('#endTitle'),
  endSub: $('#endSub'),
  endTime: $('#endTime'),
  endStates: $('#endStates'),
  endAccidents: $('#endAccidents'),
  endScore: $('#endScore'),
  endRank: $('#endRank'),
  againBtn: $('#againBtn'),
  shareBtn: $('#shareBtn'),
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function milesFor(worldDistance) {
  return Math.round((worldDistance / WORLD_W) * 2800);
}

function formatNumber(value) {
  return Math.round(value).toLocaleString('en-US');
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function pressureFillRate() {
  return 7.2 + game.visited.size * 0.06;
}

function estimatePressure(state) {
  const dist = distance(game.car, state);
  const travelSeconds = dist / 150;
  return clamp(game.bladder + dist * 0.012 + travelSeconds * pressureFillRate(), 0, 999);
}

function announce(message) {
  liveRegion.textContent = '';
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 20);
}

function loadBest() {
  try {
    const parsed = JSON.parse(localStorage.getItem('pee50.best') || 'null');
    if (parsed && Number.isFinite(parsed.score)) return parsed;
  } catch {
    /* localStorage can be unavailable in private mode */
  }
  return null;
}

function saveBest(score, time) {
  const current = loadBest();
  if (!current || score > current.score) {
    const next = { score, time, at: Date.now() };
    try {
      localStorage.setItem('pee50.best', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

/* --------------------------------------------------------------------------
   Audio
   -------------------------------------------------------------------------- */

const sound = (() => {
  let audioCtx = null;
  let muted = false;
  try {
    muted = localStorage.getItem('pee50.muted') === '1';
  } catch {
    /* localStorage can be unavailable in private mode */
  }

  function init() {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) audioCtx = new Ctor();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function tone({ freq = 440, endFreq = freq, dur = 0.12, type = 'sine', volume = 0.055, delay = 0 } = {}) {
    if (muted || !audioCtx) return;
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function noise({ dur = 0.25, volume = 0.045, cutoff = 900, delay = 0 } = {}) {
    if (muted || !audioCtx) return;
    const length = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const start = audioCtx.currentTime + delay;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start(start);
  }

  function click() {
    tone({ freq: 620, endFreq: 840, dur: 0.055, type: 'square', volume: 0.022 });
  }

  function stamp() {
    tone({ freq: 150, endFreq: 70, dur: 0.16, type: 'sine', volume: 0.08 });
    noise({ dur: 0.32, volume: 0.025, cutoff: 1800 });
    tone({ freq: 320, endFreq: 620, dur: 0.12, type: 'triangle', volume: 0.03, delay: 0.035 });
  }

  function flush() {
    noise({ dur: 0.65, volume: 0.04, cutoff: 1250 });
    tone({ freq: 220, endFreq: 95, dur: 0.38, type: 'sine', volume: 0.045 });
  }

  function accident() {
    tone({ freq: 190, endFreq: 52, dur: 0.52, type: 'sawtooth', volume: 0.07 });
    noise({ dur: 0.48, volume: 0.055, cutoff: 700 });
  }

  function start() {
    [392, 523, 659, 784].forEach((freq, index) => {
      tone({ freq, dur: 0.18, type: 'triangle', volume: 0.04, delay: index * 0.065 });
    });
  }

  function win() {
    [523, 659, 784, 1047, 1319].forEach((freq, index) => {
      tone({ freq, dur: 0.36, type: 'triangle', volume: 0.05, delay: index * 0.115 });
    });
  }

  function toggle() {
    muted = !muted;
    try {
      localStorage.setItem('pee50.muted', muted ? '1' : '0');
    } catch {
      /* ignore */
    }
    document.body.classList.toggle('muted', muted);
    ui.soundBtn.setAttribute('aria-pressed', String(muted));
    ui.soundBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    if (!muted) {
      init();
      click();
    }
  }

  function isMuted() {
    return muted;
  }

  document.body.classList.toggle('muted', muted);
  ui.soundBtn.setAttribute('aria-pressed', String(muted));
  ui.soundBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');

  return { init, click, stamp, flush, accident, start, win, toggle, isMuted };
})();

/* --------------------------------------------------------------------------
   Canvas sizing & drawing
   -------------------------------------------------------------------------- */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  view.cw = Math.max(1, rect.width);
  view.ch = Math.max(1, rect.height);
  view.dpr = dpr;
  canvas.width = Math.round(view.cw * dpr);
  canvas.height = Math.round(view.ch * dpr);
  view.scale = Math.min(view.cw / WORLD_W, view.ch / WORLD_H);
  view.ox = (view.cw - WORLD_W * view.scale) / 2;
  view.oy = (view.ch - WORLD_H * view.scale) / 2;
}

function roundRectPath(x, y, w, h, radius) {
  const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSpacedText(text, x, y, spacing, size, alpha = 1, align = 'left', rotate = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (rotate) ctx.rotate(rotate);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#15263c';
  ctx.font = `700 ${size}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const widths = [...text].map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, widths.length - 1);
  let cursor = align === 'center' ? -total / 2 : 0;
  [...text].forEach((char, index) => {
    ctx.fillText(char, cursor, 0);
    cursor += widths[index] + spacing;
  });
  ctx.restore();
}

function drawPaperBackground() {
  ctx.fillStyle = '#efe3ca';
  ctx.fillRect(0, 0, view.cw, view.ch);

  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  ctx.fillStyle = 'rgba(21, 38, 60, 0.075)';
  for (let x = 20; x < WORLD_W; x += 29) {
    for (let y = 20; y < WORLD_H; y += 29) {
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, TAU);
      ctx.fill();
    }
  }

  drawSpacedText('THE UNITED STATES OF RELIEF', WORLD_W / 2, 25, 3.2, 8, 0.3, 'center');
  drawSpacedText('PACIFIC OCEAN', 63, 315, 3.4, 8, 0.32, 'center', -Math.PI / 2);
  drawSpacedText('ATLANTIC OCEAN', 945, 310, 3.4, 8, 0.32, 'center', Math.PI / 2);
  drawSpacedText('GULF OF MEXICO', 610, 470, 3.4, 8, 0.28, 'center');

  // A small compass rose in the empty upper-left water.
  ctx.save();
  ctx.translate(68, 86);
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = '#15263c';
  ctx.fillStyle = '#15263c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(5, -3);
  ctx.lineTo(0, 2);
  ctx.lineTo(-5, -3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(5, 3);
  ctx.lineTo(0, -2);
  ctx.lineTo(-5, 3);
  ctx.closePath();
  ctx.stroke();
  ctx.font = "700 8px 'Space Grotesk', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -36);
  ctx.restore();

  drawInsetFrame(22, 500, 242, 112, 'ALASKA');
  drawInsetFrame(744, 505, 226, 100, 'HAWAII');

  ctx.restore();
}

function drawInsetFrame(x, y, w, h, label) {
  ctx.save();
  ctx.strokeStyle = 'rgba(21, 38, 60, 0.23)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  roundRectPath(x, y, w, h, 7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(21, 38, 60, 0.38)';
  ctx.font = "700 7px 'Space Grotesk', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x + 7, y + 5);
  ctx.restore();
}

function drawStates(now) {
  for (const state of states) {
    const visited = game.visited.has(state.abbr);
    const target = game.target === state.abbr;
    const hovered = game.hovered === state.abbr;

    let fill = '#fbf4e6';
    if (visited) fill = '#3d887d';
    if (target && !visited) fill = '#f4c95d';
    else if (hovered && !visited) fill = '#f6dda1';

    ctx.fillStyle = fill;
    ctx.fill(state.path);

    ctx.strokeStyle = visited ? 'rgba(21, 38, 60, 0.8)' : 'rgba(21, 38, 60, 0.58)';
    ctx.lineWidth = visited ? 1.35 : 1.05;
    ctx.stroke(state.path);

    if (target) {
      ctx.save();
      ctx.strokeStyle = '#d94b3d';
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = 0.7 + Math.sin(now / 180) * 0.2;
      ctx.stroke(state.path);
      ctx.restore();
    }

    if (state.stampAt) {
      const age = now - state.stampAt;
      if (age >= 0 && age < 720) {
        ctx.save();
        ctx.globalAlpha = (1 - age / 720) * 0.78;
        ctx.fillStyle = '#fffaf0';
        ctx.fill(state.path);
        ctx.restore();
      }
    }
  }
}

function drawRoute(now) {
  if (!game.target) return;
  const target = stateByAbbr[game.target];
  if (!target) return;

  const car = game.car;
  const u = 1 / view.scale;
  ctx.save();
  ctx.strokeStyle = 'rgba(21, 38, 60, 0.28)';
  ctx.lineWidth = 5 * u;
  ctx.setLineDash([1 * u, 11 * u]);
  ctx.lineDashOffset = 0;
  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(21, 38, 60, 0.62)';
  ctx.lineWidth = 2.1 * u;
  ctx.setLineDash([8 * u, 8 * u]);
  ctx.lineDashOffset = -(now / 46) % (16 * u);
  ctx.beginPath();
  ctx.moveTo(car.x, car.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.restore();

  const travel = (now % 1700) / 1700;
  const dotX = car.x + (target.x - car.x) * travel;
  const dotY = car.y + (target.y - car.y) * travel;
  ctx.save();
  ctx.fillStyle = '#d94b3d';
  ctx.beginPath();
  ctx.arc(dotX, dotY, 3.1 * u, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Destination flag.
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.strokeStyle = '#15263c';
  ctx.lineWidth = 1.6 * u;
  ctx.beginPath();
  ctx.moveTo(9 * u, -7 * u);
  ctx.lineTo(9 * u, -31 * u);
  ctx.stroke();
  ctx.fillStyle = '#d94b3d';
  ctx.beginPath();
  ctx.moveTo(9 * u, -31 * u);
  ctx.lineTo(25 * u, -26 * u);
  ctx.lineTo(9 * u, -21 * u);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#15263c';
  ctx.lineWidth = 1.1 * u;
  ctx.stroke();
  ctx.restore();
}

function drawPins(now) {
  const u = 1 / view.scale;
  const radius = 8.4 * u;
  const fontSize = 7.6 * u;

  const ordered = [...states].sort((a, b) => a.y - b.y);

  for (const state of ordered) {
    const visited = game.visited.has(state.abbr);
    const target = game.target === state.abbr;
    const hovered = game.hovered === state.abbr;
    const current = game.currentAbbr === state.abbr;

    if (target) {
      const pulse = 1 + Math.sin(now / 170) * 0.12;
      ctx.save();
      ctx.globalAlpha = 0.28 + Math.sin(now / 170) * 0.08;
      ctx.fillStyle = '#d94b3d';
      ctx.beginPath();
      ctx.arc(state.x, state.y, radius * 1.75 * pulse, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (current) {
      ctx.save();
      ctx.strokeStyle = '#f0b43c';
      ctx.lineWidth = 2.2 * u;
      ctx.beginPath();
      ctx.arc(state.x, state.y, radius + 3.4 * u, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (hovered && !target) {
      ctx.save();
      ctx.strokeStyle = '#d94b3d';
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.arc(state.x, state.y, radius + 3.5 * u, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'rgba(21, 38, 60, 0.2)';
    ctx.beginPath();
    ctx.ellipse(state.x, state.y + radius * 0.82, radius * 0.9, radius * 0.33, 0, 0, TAU);
    ctx.fill();

    let fill = '#fffaf0';
    let text = '#15263c';
    if (target) {
      fill = '#f0b43c';
      text = '#15263c';
    } else if (visited) {
      fill = '#fffaf0';
      text = '#277a70';
    } else if (hovered) {
      fill = '#ffe9b1';
    }

    ctx.fillStyle = fill;
    ctx.strokeStyle = '#15263c';
    ctx.lineWidth = 1.35 * u;
    ctx.beginPath();
    ctx.arc(state.x, state.y, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = text;
    ctx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.abbr, state.x, state.y + 0.2 * u);
    ctx.restore();
  }
}

function drawCar(now) {
  const u = 1 / view.scale;
  const car = game.car;
  const moving = Boolean(game.target);
  const bob = moving ? Math.sin(now / 92) * 1.2 * u : 0;
  const jitter = game.clench && moving ? Math.sin(now / 28) * 0.7 * u : 0;

  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.translate(jitter, bob);

  // shadow
  ctx.fillStyle = 'rgba(21, 38, 60, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-1 * u, 10 * u, 18 * u, 5.6 * u, 0, 0, TAU);
  ctx.fill();

  // wheels
  ctx.fillStyle = '#15263c';
  roundRectPath(-13 * u, 5 * u, 8 * u, 7 * u, 2.4 * u);
  ctx.fill();
  roundRectPath(6 * u, 5 * u, 8 * u, 7 * u, 2.4 * u);
  ctx.fill();

  // body
  ctx.fillStyle = '#d94b3d';
  roundRectPath(-18 * u, -9 * u, 36 * u, 18 * u, 5.5 * u);
  ctx.fill();

  // cream roof
  ctx.fillStyle = '#fffaf0';
  roundRectPath(-14 * u, -7.3 * u, 28 * u, 7.4 * u, 2.8 * u);
  ctx.fill();

  // windows
  ctx.fillStyle = '#2d6f9d';
  roundRectPath(-7 * u, -6 * u, 9.7 * u, 4.9 * u, 1.4 * u);
  ctx.fill();
  roundRectPath(4.6 * u, -6 * u, 5.5 * u, 4.9 * u, 1.4 * u);
  ctx.fill();

  // stripe
  ctx.fillStyle = '#277a70';
  ctx.fillRect(-16 * u, 1.3 * u, 32 * u, 2.2 * u);

  // headlight and bumper
  ctx.fillStyle = '#f0b43c';
  ctx.beginPath();
  ctx.arc(15.4 * u, -3.6 * u, 1.7 * u, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#15263c';
  roundRectPath(15.5 * u, 2 * u, 3.3 * u, 5 * u, 1 * u);
  ctx.fill();

  // windshield reflection
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 0.9 * u;
  ctx.beginPath();
  ctx.moveTo(-5.5 * u, -5.3 * u);
  ctx.lineTo(-1.5 * u, -1.8 * u);
  ctx.stroke();

  ctx.restore();

  if (game.clench && moving) {
    const rearX = car.x - Math.cos(car.angle) * 21 * u;
    const rearY = car.y - Math.sin(car.angle) * 21 * u;
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(now / 60) * 0.15;
    ctx.strokeStyle = '#d94b3d';
    ctx.lineWidth = 1.5 * u;
    for (let i = 0; i < 3; i += 1) {
      const offset = (i - 1) * 5 * u;
      ctx.beginPath();
      ctx.moveTo(rearX + Math.cos(car.angle + Math.PI / 2) * offset, rearY + Math.sin(car.angle + Math.PI / 2) * offset);
      ctx.lineTo(rearX + Math.cos(car.angle + Math.PI / 2) * offset - Math.cos(car.angle) * 8 * u, rearY + Math.sin(car.angle + Math.PI / 2) * offset - Math.sin(car.angle) * 8 * u);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEffects() {
  const u = 1 / view.scale;

  for (const particle of effects.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    if (particle.shape === 'rect') {
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation || 0);
      ctx.fillRect(-particle.r, -particle.r * 0.45, particle.r * 2, particle.r * 0.9);
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const floater of effects.floaters) {
    const progress = 1 - floater.life / floater.maxLife;
    ctx.save();
    ctx.globalAlpha = clamp(floater.life / floater.maxLife, 0, 1);
    ctx.font = `800 ${12.5 * u}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5 * u;
    ctx.strokeStyle = '#fffaf0';
    ctx.strokeText(floater.text, floater.x, floater.y - progress * 24 * u);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y - progress * 24 * u);
    ctx.restore();
  }
}

function draw(now) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  drawPaperBackground();

  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  drawStates(now);
  drawRoute(now);
  drawPuddlesAndParticlesBackground();
  drawPins(now);
  drawCar(now);
  drawEffects();

  ctx.restore();
}

function drawPuddlesAndParticlesBackground() {
  // Puddles live under pins and the van; particles and floaters sit on top.
  const u = 1 / view.scale;
  for (const puddle of effects.puddles) {
    const lifeRatio = clamp(puddle.life / puddle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.2 * lifeRatio;
    ctx.fillStyle = '#63bce2';
    ctx.beginPath();
    ctx.ellipse(puddle.x, puddle.y, puddle.r, puddle.r * 0.38, puddle.rotation, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2e8fbe';
    ctx.lineWidth = 1.2 * u;
    ctx.globalAlpha = 0.28 * lifeRatio;
    ctx.stroke();
    ctx.restore();
  }
}

/* --------------------------------------------------------------------------
   Effects
   -------------------------------------------------------------------------- */

function spawnArrivalBurst(state, color = '#63bce2') {
  const u = 1 / view.scale;
  for (let i = 0; i < 22; i += 1) {
    const angle = Math.random() * TAU;
    const speed = (35 + Math.random() * 105) * u;
    const life = 0.55 + Math.random() * 0.55;
    effects.particles.push({
      x: state.x,
      y: state.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 45 * u,
      gravity: 120 * u,
      r: (1.6 + Math.random() * 3.1) * u,
      color: Math.random() < 0.72 ? color : '#fffaf0',
      shape: 'circle',
      life,
      maxLife: life,
    });
  }
}

function spawnDust() {
  const u = 1 / view.scale;
  const car = game.car;
  const angle = car.angle + Math.PI + (Math.random() - 0.5) * 0.75;
  const speed = (10 + Math.random() * 24) * u;
  const life = 0.4 + Math.random() * 0.35;
  effects.particles.push({
    x: car.x + Math.cos(angle) * 12 * u,
    y: car.y + Math.sin(angle) * 12 * u,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 8 * u,
    gravity: 6 * u,
    r: (2.2 + Math.random() * 4.2) * u,
    color: '#cbb994',
    shape: 'circle',
    life,
    maxLife: life,
  });
}

function spawnAccidentPuddle() {
  const u = 1 / view.scale;
  effects.puddles.push({
    x: game.car.x,
    y: game.car.y + 9 * u,
    r: 12 * u,
    rotation: (Math.random() - 0.5) * 0.7,
    life: 9,
    maxLife: 9,
    grow: 34 * u,
  });
  for (let i = 0; i < 18; i += 1) {
    const angle = Math.random() * TAU;
    const speed = (18 + Math.random() * 70) * u;
    const life = 0.5 + Math.random() * 0.55;
    effects.particles.push({
      x: game.car.x,
      y: game.car.y + 7 * u,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 18 * u,
      gravity: 130 * u,
      r: (1.4 + Math.random() * 2.8) * u,
      color: Math.random() < 0.65 ? '#63bce2' : '#f0b43c',
      shape: 'circle',
      life,
      maxLife: life,
    });
  }
}

function spawnWinConfetti() {
  const colors = ['#d94b3d', '#f0b43c', '#277a70', '#2d6f9d', '#fffaf0'];
  for (let i = 0; i < 160; i += 1) {
    effects.particles.push({
      x: Math.random() * WORLD_W,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 150,
      vy: 38 + Math.random() * 120,
      gravity: 30,
      r: 2.4 + Math.random() * 3.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: 'rect',
      rotation: Math.random() * TAU,
      vr: (Math.random() - 0.5) * 8,
      life: 3.2 + Math.random() * 1.4,
      maxLife: 4.6,
    });
  }
}

function updateEffects(dt) {
  for (const particle of effects.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += particle.gravity * dt;
    if (particle.vr) particle.rotation = (particle.rotation || 0) + particle.vr * dt;
  }
  effects.particles = effects.particles.filter((particle) => particle.life > 0);

  for (const puddle of effects.puddles) {
    puddle.life -= dt;
    puddle.r = Math.min(puddle.r + (puddle.grow || 20) * dt, 58 / view.scale);
  }
  effects.puddles = effects.puddles.filter((puddle) => puddle.life > 0);

  for (const floater of effects.floaters) {
    floater.life -= dt;
    floater.y -= 4.5 * dt;
  }
  effects.floaters = effects.floaters.filter((floater) => floater.life > 0);

}

/* --------------------------------------------------------------------------
   Gameplay
   -------------------------------------------------------------------------- */

let lastHudSecond = -1;
let lastDust = 0;

function resetBoard() {
  game.runId += 1;
  game.phase = 'menu';
  game.finishing = false;
  game.visited.clear();
  game.target = null;
  game.currentAbbr = START_ABBR;
  const start = stateByAbbr[START_ABBR];
  game.car = { x: start.x, y: start.y, angle: -Math.PI / 2 };
  game.bladder = 0;
  game.pants = MAX_PANTS;
  game.score = 0;
  game.perfect = 0;
  game.accidents = 0;
  game.elapsed = 0;
  game.clench = false;
  game.hovered = null;
  lastHudSecond = -1;
  lastDust = 0;
  for (const state of states) {
    state.visited = false;
    state.stampAt = 0;
  }
  effects.particles.length = 0;
  effects.puddles.length = 0;
  effects.floaters.length = 0;
  setClench(false, true);
  endOverlay.hidden = true;
  endOverlay.classList.remove('lost');
  renderStaticUI();
  updateAllUI();
}

function startGame() {
  game.runId += 1;
  const runId = game.runId;
  game.phase = 'playing';
  game.finishing = false;
  game.visited.clear();
  game.target = null;
  game.currentAbbr = START_ABBR;
  const start = stateByAbbr[START_ABBR];
  game.car = { x: start.x, y: start.y, angle: -Math.PI / 2 };
  game.bladder = 0;
  game.pants = MAX_PANTS;
  game.score = 100;
  game.perfect = 0;
  game.accidents = 0;
  game.elapsed = 0;
  game.clench = false;
  game.hovered = null;
  for (const state of states) {
    state.visited = false;
    state.stampAt = 0;
  }
  effects.particles.length = 0;
  effects.puddles.length = 0;
  effects.floaters.length = 0;
  start.visited = true;
  start.stampAt = performance.now();
  game.visited.add(START_ABBR);
  startOverlay.hidden = true;
  endOverlay.hidden = true;
  endOverlay.classList.remove('lost');
  setClench(false, true);
  ui.roadLog.innerHTML = '';
  addLog('Tip: tiny New England states are easier to tap in the state list.');
  addLog(`Starting in ${start.name}. First relief down, 49 to go.`, 'big');
  renderStaticUI();
  updateAllUI();
  announce(`Run started in ${start.name}. ${50 - game.visited.size} states left.`);
  sound.start();
  window.setTimeout(() => {
    if (runId === game.runId) document.activeElement?.blur?.();
  }, 50);
}

function setTarget(abbr) {
  if (game.phase !== 'playing' || game.finishing) return;
  const state = stateByAbbr[abbr];
  if (!state) return;
  if (game.visited.has(abbr)) {
    showToast(state.name, 'Already stamped. Save some for the other states.', 'info');
    announce(`${state.name} is already stamped.`);
    sound.click();
    return;
  }
  if (game.target === abbr) {
    sound.click();
    return;
  }
  game.target = abbr;
  sound.click();
  const dist = distance(game.car, state);
  const estimate = Math.round(estimatePressure(state));
  const miles = milesFor(dist);
  addLog(`Next stop: ${state.name}. ${formatNumber(miles)} mi, est. ${estimate}% pressure.`);
  announce(`Driving to ${state.name}. Estimated arrival pressure ${estimate} percent.`);
  renderStaticUI();
  updateLiveUI(performance.now(), true);
}

function arrive(state, now) {
  if (!state || game.visited.has(state.abbr)) return;

  const pressure = Math.round(game.bladder);
  let tier = 'quick';
  let bonus = 20;
  let label = 'QUICK STOP';
  let color = '#2d6f9d';

  if (pressure >= 55) {
    tier = 'perfect';
    bonus = 150;
    label = 'PERFECT RELIEF';
    color = '#c8871c';
    game.perfect += 1;
  } else if (pressure >= 30) {
    tier = 'good';
    bonus = 60;
    label = 'GOOD RELIEF';
    color = '#277a70';
  }

  const gain = 100 + bonus;
  game.score += gain;
  game.target = null;
  game.currentAbbr = state.abbr;
  game.car.x = state.x;
  game.car.y = state.y;
  game.car.angle = (state.y < 320 ? -Math.PI / 2 : Math.PI / 2);
  game.bladder = 0;
  state.visited = true;
  state.stampAt = now;
  game.visited.add(state.abbr);

  spawnArrivalBurst(state, color);
  effects.floaters.push({
    x: state.x,
    y: state.y - 20 / view.scale,
    text: `+${gain}`,
    color: '#15263c',
    life: 1.5,
    maxLife: 1.5,
  });
  showToast(state.name, `${label} · +${gain} · ${game.visited.size}/50`, 'stamp');
  sound.flush();
  sound.stamp();
  if (tier === 'perfect') {
    window.setTimeout(() => sound.click(), 120);
  }

  const line = STATE_LINES[state.abbr] || 'Relieved. Next.';
  addLog(`${state.name}: ${line} ${tier === 'perfect' ? 'Perfect relief!' : ''}`.trim(), tier === 'perfect' ? 'big' : '');
  announce(`${state.name} stamped. ${game.visited.size} of 50 states. ${pressure >= 55 ? 'Perfect relief.' : ''}`);
  renderStaticUI();
  updateLiveUI(now, true);

  if (game.visited.size === 50) {
    game.finishing = true;
    const runId = game.runId;
    window.setTimeout(() => {
      if (runId === game.runId) endGame(true);
    }, 850);
  }
}

function accident(now) {
  if (game.phase !== 'playing' || game.finishing) return;
  game.pants -= 1;
  game.accidents += 1;
  game.bladder = 26;
  game.target = null;
  game.clench = false;
  setClench(false, true);
  spawnAccidentPuddle();
  sound.accident();
  vibrate([70, 45, 110]);
  mapFrame.classList.remove('shake');
  void mapFrame.offsetWidth;
  mapFrame.classList.add('shake');
  mapFlash.classList.remove('flash');
  void mapFlash.offsetWidth;
  mapFlash.classList.add('flash');
  showToast('PANTS ALERT', `${game.pants} spare ${game.pants === 1 ? 'pair' : 'pairs'} left. Find porcelain.`, 'accident');
  addLog(`Accident${game.pants ? `! ${game.pants} spare ${game.pants === 1 ? 'pair' : 'pairs'} left.` : '. That was the last pair.'}`, 'accident');
  announce(`Accident. ${game.pants} spare pants remaining.`);
  renderStaticUI();
  updateAllUI();

  if (game.pants <= 0) {
    game.finishing = true;
    const runId = game.runId;
    window.setTimeout(() => {
      if (runId === game.runId) endGame(false);
    }, 780);
  }
}

function finishScore() {
  const speedBonus = Math.max(0, Math.round(2600 - game.elapsed * 8));
  const pantsBonus = game.pants * 300;
  return Math.round(game.score + 1000 + speedBonus + pantsBonus);
}

function endGame(won) {
  if (game.phase === 'ended') return;
  game.phase = 'ended';
  game.finishing = false;
  game.target = null;
  game.clench = false;
  setClench(false, true);

  const finalScore = won ? finishScore() : Math.max(0, Math.round(game.score));
  game.score = finalScore;
  const bestBefore = loadBest();
  const isBest = won ? saveBest(finalScore, game.elapsed) : false;
  const best = loadBest() || bestBefore;

  endOverlay.classList.toggle('lost', !won);
  ui.endStamp.textContent = `${game.visited.size}/50`;
  ui.endKicker.textContent = won ? 'Run complete' : 'Run over';
  ui.endTitle.textContent = won ? 'Coast to coast.' : 'Out of pants.';
  ui.endSub.textContent = won
    ? 'You have relieved yourself in all fifty states. The eagle has landed.'
    : `The bladder won after ${game.visited.size} ${game.visited.size === 1 ? 'state' : 'states'}. The upholstery lost.`;
  ui.endTime.textContent = formatTime(game.elapsed);
  ui.endStates.textContent = `${game.visited.size}/50`;
  ui.endAccidents.textContent = String(game.accidents);
  ui.endScore.textContent = formatNumber(finalScore);
  ui.endRank.textContent = rankFor(won);
  ui.againBtn.innerHTML = won ? 'Run it back <span>↻</span>' : 'Try again <span>↻</span>';
  ui.endBest.textContent = isBest
    ? 'New personal best.'
    : best
      ? `Personal best: ${formatNumber(best.score)} · ${formatTime(best.time)}`
      : '';
  endOverlay.hidden = false;

  if (won) {
    spawnWinConfetti();
    sound.win();
    vibrate([40, 40, 40, 40, 100]);
    announce(`Run complete. All fifty states. Final score ${finalScore}. ${rankFor(true)}`);
  } else {
    announce(`Run over after ${game.visited.size} states.`);
  }
  updateAllUI();
  updateBestLine();
}

function rankFor(won) {
  if (!won) return 'A tragic shortage of trousers.';
  if (game.accidents === 0 && game.elapsed < 150) return 'National treasure. A bald eagle salutes you.';
  if (game.accidents === 0) return 'Road-trip royalty.';
  if (game.accidents === 1) return 'Mostly house-trained.';
  return 'A little damp, but you made it.';
}

function setClench(on, force = false) {
  if (!force && game.phase !== 'playing') return;
  if (!force && game.finishing) return;
  game.clench = on;
  ui.clenchBtn.classList.toggle('active', on);
  ui.clenchBtn.setAttribute('aria-pressed', String(on));
  if (on) sound.click();
}

function vibrate(pattern) {
  if (navigator.vibrate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    navigator.vibrate(pattern);
  }
}

/* --------------------------------------------------------------------------
   UI
   -------------------------------------------------------------------------- */

let toastTimer = null;

function showToast(title, sub, type = 'stamp') {
  mapToast.classList.remove('show', 'accident');
  mapToast.classList.toggle('accident', type === 'accident');
  mapToast.innerHTML = '';

  const kicker = document.createElement('span');
  kicker.className = 'toast-kicker';
  kicker.textContent = type === 'accident' ? 'Emergency roadside event' : type === 'info' ? 'Road note' : 'Relief achieved';
  const titleEl = document.createElement('span');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;
  const subEl = document.createElement('span');
  subEl.className = 'toast-sub';
  subEl.textContent = sub;
  mapToast.append(kicker, titleEl, subEl);

  void mapToast.offsetWidth;
  mapToast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    mapToast.classList.remove('show');
  }, 1260);
}

function addLog(message, type = '') {
  const li = document.createElement('li');
  if (type) li.className = type;
  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = formatTime(game.elapsed);
  const text = document.createElement('span');
  text.textContent = message;
  li.append(time, text);
  ui.roadLog.prepend(li);
  while (ui.roadLog.children.length > 6) ui.roadLog.lastElementChild.remove();
}

function buildPants() {
  ui.pantsMeter.innerHTML = '';
  for (let i = 0; i < MAX_PANTS; i += 1) {
    const icon = document.createElement('span');
    icon.className = `pants-icon${i >= game.pants ? ' used' : ''}`;
    icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4.5h15v6.1l-2.3 7h-4.1L12 12.4l-1.1 5.2H6.8l-2.3-7V4.5Z" fill="currentColor"/></svg>';
    ui.pantsMeter.append(icon);
  }
  ui.pantsMeter.setAttribute('aria-label', `${game.pants} spare ${game.pants === 1 ? 'pair' : 'pairs'} of pants remaining`);
}

function currentRouteInfo() {
  if (!game.target) return null;
  const state = stateByAbbr[game.target];
  if (!state) return null;
  const dist = distance(game.car, state);
  const estimate = Math.round(estimatePressure(state));
  return { state, dist, miles: milesFor(dist), estimate };
}

function buildStopRow(state, compact = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'stop-row';
  btn.dataset.abbr = state.abbr;
  if (game.target === state.abbr) btn.classList.add('target');
  const dist = distance(game.car, state);
  const estimate = Math.round(estimatePressure(state));
  if (estimate >= 90) btn.classList.add('danger');
  btn.disabled = game.phase !== 'playing' || game.visited.has(state.abbr);

  const abbr = document.createElement('span');
  abbr.className = 'stop-abbr';
  abbr.textContent = state.abbr;
  const name = document.createElement('span');
  name.className = 'stop-name';
  name.textContent = state.name;
  const miles = document.createElement('span');
  miles.className = 'stop-dist';
  miles.textContent = `${formatNumber(milesFor(dist))} mi`;
  const pressure = document.createElement('span');
  pressure.className = 'stop-press';
  pressure.textContent = game.target === state.abbr ? 'GO' : `${Math.min(999, estimate)}%`;

  btn.append(abbr, name, miles, pressure);
  btn.addEventListener('click', () => {
    if (statesDialog.open) statesDialog.close();
    setTarget(state.abbr);
  });
  return btn;
}

function renderNearest(container, limit = 5) {
  if (!container) return;
  container.innerHTML = '';
  const candidates = states
    .filter((state) => !game.visited.has(state.abbr))
    .map((state) => ({ state, dist: distance(game.car, state) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);

  if (!candidates.length) {
    const done = document.createElement('p');
    done.className = 'empty-note';
    done.textContent = 'Every state stamped. Look at you.';
    container.append(done);
    return;
  }

  for (const { state } of candidates) {
    container.append(buildStopRow(state));
  }
}

function renderStateGrid() {
  if (!ui.stateGrid) return;
  ui.stateGrid.innerHTML = '';
  for (const region of REGIONS) {
    const section = document.createElement('section');
    section.className = 'state-region';
    const heading = document.createElement('h3');
    heading.textContent = region.name;
    const grid = document.createElement('div');
    grid.className = 'state-region-grid';

    for (const abbr of region.abbrs) {
      const state = stateByAbbr[abbr];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'state-btn';
      btn.disabled = game.phase !== 'playing' || game.visited.has(abbr);
      if (game.target === abbr) btn.classList.add('target');

      const abbrEl = document.createElement('span');
      abbrEl.className = 'state-abbr';
      abbrEl.textContent = abbr;
      const nameEl = document.createElement('span');
      nameEl.className = 'state-name';
      nameEl.textContent = state.name;
      const statusEl = document.createElement('span');
      statusEl.className = 'state-status';
      statusEl.textContent = game.visited.has(abbr) ? 'Stamped' : game.target === abbr ? 'En route' : 'Open';
      btn.append(abbrEl, nameEl, statusEl);
      btn.addEventListener('click', () => {
        statesDialog.close();
        setTarget(abbr);
      });
      grid.append(btn);
    }
    section.append(heading, grid);
    ui.stateGrid.append(section);
  }
}

function refreshDialog() {
  if (!statesDialog.open) return;
  renderNearest(ui.dialogNearest, 5);
  renderStateGrid();
}

function renderStaticUI() {
  ui.progress.textContent = `${game.visited.size}/50`;
  ui.score.textContent = formatNumber(game.score);
  ui.nearestCount.textContent = `${50 - game.visited.size} left`;
  if (ui.mobileNearestCount) ui.mobileNearestCount.textContent = `${50 - game.visited.size} left`;
  buildPants();
  renderNearest(ui.nearestList, 5);
  if (ui.mobileNearestList) renderNearest(ui.mobileNearestList, 4);
  refreshDialog();

  const route = currentRouteInfo();
  if (route) {
    ui.routeKicker.textContent = 'Next stop';
    ui.routeTitle.textContent = route.state.name;
    ui.routeMeta.textContent = `${formatNumber(route.miles)} mi · est. ${route.estimate}% · ${50 - game.visited.size} left`;
    ui.routeMeta.classList.toggle('warn', route.estimate >= 90);
    ui.nextName.textContent = route.state.name;
    ui.nextMeta.textContent = `${formatNumber(route.miles)} miles away · estimated arrival ${route.estimate}%. ${route.estimate >= 90 ? 'Clench, or pick something closer.' : 'Keep it together.'}`;
  } else {
    ui.routeKicker.textContent = game.phase === 'menu' ? 'Ready when you are' : 'Next stop';
    ui.routeTitle.textContent = 'Pick a rest stop';
    ui.routeMeta.textContent =
      game.phase === 'menu'
        ? 'One van. Fifty state restrooms. A nation holds its breath.'
        : `${50 - game.visited.size} states left · tap the map or open the state list`;
    ui.routeMeta.classList.remove('warn');
    ui.nextName.textContent = game.phase === 'menu' ? 'Choose a rest stop' : 'Choose a rest stop';
    ui.nextMeta.textContent =
      game.phase === 'menu'
        ? 'Start the run to pick your first stop.'
        : 'Tap any state pin on the map, or browse the full list.';
  }
}

function updateBestLine() {
  const best = loadBest();
  if (!best) {
    ui.bestLine.hidden = true;
    return;
  }
  ui.bestLine.hidden = false;
  ui.bestLine.textContent = `Personal best: ${formatNumber(best.score)} · ${formatTime(best.time)}`;
}

function updateLiveUI(now, force = false) {
  const second = Math.floor(game.elapsed);
  if (force || second !== lastHudSecond) {
    lastHudSecond = second;
    ui.time.textContent = formatTime(game.elapsed);
    ui.score.textContent = formatNumber(game.score);
  }

  const pct = clamp(game.bladder, 0, 100);
  const rounded = Math.round(pct);
  ui.bladderPct.textContent = `${rounded}%`;
  ui.bladderFill.style.width = `${pct}%`;
  ui.bladderFill.classList.toggle('warning', pct >= 65 && pct < 88);
  ui.bladderFill.classList.toggle('danger', pct >= 88);
  ui.bladderBar.setAttribute('aria-valuenow', String(rounded));

  let hint = 'All clear. For now.';
  if (game.clench) hint = 'Clenching. Slower, but the pressure can wait.';
  else if (pct >= 90) hint = 'Code yellow. Find porcelain immediately.';
  else if (pct >= 70) hint = 'Serious pressure. Clench or pick a closer state.';
  else if (pct >= 40) hint = 'A dull ache. Entirely manageable.';
  else if (pct >= 12) hint = 'A faint suggestion of trouble.';
  ui.bladderHint.textContent = hint;

  const route = currentRouteInfo();
  if (route) {
    ui.routeMeta.textContent = `${formatNumber(route.miles)} mi · est. ${route.estimate}% · ${50 - game.visited.size} left`;
    ui.routeMeta.classList.toggle('warn', route.estimate >= 90);
    if (!game.finishing) {
      ui.nextMeta.textContent = `${formatNumber(route.miles)} miles away · estimated arrival ${route.estimate}%. ${route.estimate >= 90 ? 'Clench, or pick something closer.' : 'Keep it together.'}`;
    }
  }
}

function updateAllUI() {
  ui.progress.textContent = `${game.visited.size}/50`;
  ui.score.textContent = formatNumber(game.score);
  ui.time.textContent = formatTime(game.elapsed);
  buildPants();
  updateLiveUI(performance.now(), true);
}

/* --------------------------------------------------------------------------
   Update loop
   -------------------------------------------------------------------------- */

function update(dt, now) {
  if (game.phase !== 'playing' || game.finishing) {
    updateEffects(dt);
    return;
  }

  if (statesDialog.open || helpDialog.open) {
    updateEffects(dt);
    return;
  }

  game.elapsed += dt;
  const clenchFactor = game.clench ? 0.45 : 1;
  const urgency = pressureFillRate();

  if (game.target) {
    const target = stateByAbbr[game.target];
    const dx = target.x - game.car.x;
    const dy = target.y - game.car.y;
    const dist = Math.hypot(dx, dy);
    const speed = game.clench ? 85 : 150;
    const step = speed * dt;

    if (dist <= Math.max(step, 2.5)) {
      game.car.x = target.x;
      game.car.y = target.y;
      arrive(target, now);
    } else {
      const nx = dx / dist;
      const ny = dy / dist;
      game.car.x += nx * step;
      game.car.y += ny * step;
      game.car.angle = Math.atan2(dy, dx);
      game.bladder += step * 0.012 + dt * urgency * clenchFactor;
      if (now - lastDust > 58) {
        spawnDust();
        lastDust = now;
      }
    }
  } else {
    game.bladder += dt * urgency * 0.4 * clenchFactor;
  }

  if (game.bladder >= 100) {
    game.bladder = 100;
    accident(now);
  }

  updateEffects(dt);
}

let lastFrame = performance.now();
let menuDrawnRun = -1;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;

  // The map is static behind the start screen. Draw it once instead of
  // repainting the whole scene under the overlay every frame.
  if (game.phase === 'menu') {
    if (menuDrawnRun !== game.runId) {
      draw(now);
      menuDrawnRun = game.runId;
    }
    requestAnimationFrame(frame);
    return;
  }

  update(dt, now);
  draw(now);
  updateLiveUI(now);
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Input
   -------------------------------------------------------------------------- */

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function findStateAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  let best = null;
  let bestDistance = 23;
  for (const state of states) {
    const px = view.ox + state.x * view.scale;
    const py = view.oy + state.y * view.scale;
    const d = Math.hypot(px - sx, py - sy);
    if (d < bestDistance) {
      bestDistance = d;
      best = state;
    }
  }
  return best;
}

function updateTip(event) {
  if (event.pointerType === 'touch') {
    game.hovered = null;
    mapTip.hidden = true;
    return;
  }
  const state = findStateAt(event.clientX, event.clientY);
  game.hovered = state ? state.abbr : null;
  canvas.style.cursor = state ? 'pointer' : 'default';
  if (!state) {
    mapTip.hidden = true;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const visited = game.visited.has(state.abbr);
  mapTip.innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = state.name;
  const span = document.createElement('span');
  span.textContent = visited
    ? `${state.abbr} · stamped`
    : `${state.abbr} · ${formatNumber(milesFor(distance(game.car, state)))} mi · est. ${Math.round(estimatePressure(state))}%`;
  mapTip.append(strong, span);
  mapTip.style.left = `${clamp(event.clientX - rect.left + 14, 6, rect.width - 192)}px`;
  mapTip.style.top = `${clamp(event.clientY - rect.top + 14, 6, rect.height - 60)}px`;
  mapTip.hidden = false;
}

canvas.addEventListener('pointermove', updateTip);

canvas.addEventListener('pointerleave', () => {
  game.hovered = null;
  canvas.style.cursor = 'default';
  mapTip.hidden = true;
});

canvas.addEventListener('pointerdown', (event) => {
  sound.init();
  if (game.phase !== 'playing') return;
  const state = findStateAt(event.clientX, event.clientY);
  if (!state) return;
  event.preventDefault();
  mapTip.hidden = true;
  setTarget(state.abbr);
});

ui.clenchBtn.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  sound.init();
  if (game.phase !== 'playing') return;
  ui.clenchBtn.setPointerCapture?.(event.pointerId);
  setClench(true);
});

function releaseClench() {
  if (game.clench) setClench(false);
}

ui.clenchBtn.addEventListener('pointerup', releaseClench);
ui.clenchBtn.addEventListener('pointercancel', releaseClench);
ui.clenchBtn.addEventListener('lostpointercapture', releaseClench);

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || game.phase !== 'playing' || statesDialog.open || helpDialog.open) return;
  const active = document.activeElement;
  const interactive = active && /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
  if (interactive && active !== ui.clenchBtn) return;
  event.preventDefault();
  if (!game.clench) setClench(true);
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') releaseClench();
});

window.addEventListener('blur', releaseClench);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseClench();
});

/* --------------------------------------------------------------------------
   Buttons & dialogs
   -------------------------------------------------------------------------- */

$('#startBtn').addEventListener('click', () => {
  sound.init();
  startGame();
});

$('#soundBtn').addEventListener('click', () => {
  sound.init();
  sound.toggle();
});

$('#helpBtn').addEventListener('click', () => {
  helpDialog.showModal();
});

$('#helpStartBtn').addEventListener('click', () => {
  helpDialog.close();
});

$('#closeHelpBtn').addEventListener('click', () => {
  helpDialog.close();
});

function openStatesDialog() {
  if (game.phase !== 'playing') return;
  renderNearest(ui.dialogNearest, 5);
  renderStateGrid();
  statesDialog.showModal();
}

$('#statesBtn').addEventListener('click', openStatesDialog);
$('#allStatesBtn').addEventListener('click', openStatesDialog);
$('#nearestBtn').addEventListener('click', openStatesDialog);
$('#mobileAllBtn').addEventListener('click', openStatesDialog);

$('#closeStatesBtn').addEventListener('click', () => {
  statesDialog.close();
});

statesDialog.addEventListener('click', (event) => {
  if (event.target === statesDialog) statesDialog.close();
});

helpDialog.addEventListener('click', (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

ui.againBtn.addEventListener('click', () => {
  endOverlay.hidden = true;
  sound.init();
  startGame();
});

ui.shareBtn.addEventListener('click', async () => {
  const won = game.visited.size === 50;
  const text = won
    ? `I relieved myself in all 50 states in ${formatTime(game.elapsed)} with ${game.accidents} accident${game.accidents === 1 ? '' : 's'} in PEE 50. Final score: ${formatNumber(game.score)}. ${ui.endRank.textContent}`
    : `I made it through ${game.visited.size}/50 states before running out of pants in PEE 50. Score: ${formatNumber(game.score)}.`;
  try {
    await navigator.clipboard.writeText(text);
    ui.shareBtn.textContent = 'Copied!';
    window.setTimeout(() => {
      ui.shareBtn.textContent = 'Copy brag';
    }, 1600);
  } catch {
    ui.shareBtn.textContent = 'Copy failed';
    window.setTimeout(() => {
      ui.shareBtn.textContent = 'Copy brag';
    }, 1600);
  }
});

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

const resizeObserver = new ResizeObserver(() => {
  resizeCanvas();
});
resizeObserver.observe(mapFrame);
window.addEventListener('resize', resizeCanvas);

updateBestLine();
resizeCanvas();
resetBoard();
requestAnimationFrame(frame);
