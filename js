
import * as THREE from "https://esm.sh/three@0.180.0";

// GALAXY BLOCKVERSE — SINGLE-PLAYER ENGINE

const $ = id => document.getElementById(id);
const SAVE = "galaxy-blockverse-three-files-v1";
const SIZE = 12;
const VIEW = 1;
const MIN_Y = -48;
const MAX_Y = 60;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8dc8ee);
scene.fog = new THREE.Fog(0x8dc8ee, 22, 65);

const camera = new THREE.PerspectiveCamera(
  75, innerWidth / innerHeight, .05, 110
);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "high-performance"
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(
  0xe5f2ff, 0x526b46, 1.9
));

const sun = new THREE.DirectionalLight(0xffeacc, 1.4);
sun.position.set(24, 50, 16);
scene.add(sun);

// BLOCK REGISTRY

const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WOOD: 5,
  LEAVES: 6,
  BEDROCK: 7,
  ICE: 8,
  WATER: 9,
  CACTUS: 10,
  PLANKS: 11,
  GLASS: 12,
  CHEST: 13,
  FURNACE: 14,
  FARMLAND: 15,
  CROPS: 16,
  COAL: 17,
  IRON: 18,
  GOLD: 19,
  DIAMOND: 20,
  LAVA: 21
};

const ITEMS = [
  ["Air", "▫️"],
  ["Grass", "🟩"],
  ["Dirt", "🟫"],
  ["Stone", "🪨"],
  ["Sand", "🏖️"],
  ["Oak Wood", "🪵"],
  ["Oak Leaves", "🍃"],
  ["Bedrock", "⬛"],
  ["Ice", "🧊"],
  ["Water", "💧"],
  ["Cactus", "🌵"],
  ["Oak Planks", "🪵"],
  ["Glass", "🪟"],
  ["Chest", "📦"],
  ["Furnace", "🔥"],
  ["Farmland", "🟤"],
  ["Crops", "🌾"],
  ["Coal", "⚫"],
  ["Iron", "🔩"],
  ["Gold", "🟨"],
  ["Diamond", "💎"],
  ["Lava", "🌋"]
];

const OTHER = {
  bucket: ["Empty Bucket", "🪣"],
  water_bucket: ["Water Bucket", "🪣"],
  seeds: ["Seeds", "🌱"],
  wheat: ["Wheat", "🌾"],
  meat: ["Raw Meat", "🥩"],
  cooked: ["Cooked Meat", "🍖"],
  emerald: ["Emerald", "💚"]
};

const RECIPES = [
  [11, 4, {5: 1}],
  [13, 1, {11: 8}],
  [14, 1, {3: 8}],
  [15, 4, {2: 4}],
  [12, 4, {4: 4,17: 1}],
  ["bucket", 1, {18: 3}],
  [16, 4, {seeds: 4}],
  ["cooked", 1, {meat: 1,17: 1}]
];

const isSolid = id =>
  id !== B.AIR &&
  id !== B.WATER &&
  id !== B.LAVA &&
  id !== B.LEAVES &&
  id !== B.CROPS;

const itemName = id =>
  typeof id === "number"
    ? ITEMS[id]?.[0] || "Unknown"
    : OTHER[id]?.[0] || id;

const itemIcon = id =>
  typeof id === "number"
    ? ITEMS[id]?.[1] || "▫️"
    : OTHER[id]?.[1] || "▫️";

// SAVE DATA

let stored = {};
try {
  stored = JSON.parse(localStorage.getItem(SAVE) || "{}");
} catch {
  stored = {};
}

const edits = new Map(stored.edits || []);
const chestData = stored.chests || {};

const inventory = {
  1: 24,
  2: 16,
  3: 20,
  4: 16,
  5: 12,
  6: 8,
  8: 6,
  11: 8,
  13: 2,
  14: 1,
  seeds: 8,
  bucket: 1,
  water_bucket: 0,
  meat: 0,
  cooked: 4,
  ...stored.inventory
};

const slots = Array.isArray(stored.slots) &&
  stored.slots.length === 9
  ? stored.slots
  : [1, 2, 3, 4, 5, 6, 8, 13, "bucket"];

let selected = 0;
let health = stored.health ?? 20;
let food = stored.food ?? 20;
let creative = false;
let flying = false;
let playing = false;
let panel = null;
let chestKey = null;
let noticeTimer = 0;

function add(id, count = 1) {
  inventory[id] = (inventory[id] || 0) + count;
}

function take(id, count = 1) {
  if ((inventory[id] || 0) < count) return false;
  inventory[id] -= count;
  return true;
}

function notify(text) {
  $("notice").textContent = text;
  noticeTimer = 2.5;
}

// NOISE AND TERRAIN

function hash(x, z, s = 0) {
  const n = Math.sin(
    x * 127.1 + z * 311.7 + s * 79.7
  ) * 43758.5453;
  return n - Math.floor(n);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function noise(x, z, seed = 0) {
  const a = Math.floor(x);
  const b = Math.floor(z);
  const u = smooth(x - a);
  const v = smooth(z - b);

  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(
      hash(a, b, seed),
      hash(a + 1, b, seed),
      u
    ),
    THREE.MathUtils.lerp(
      hash(a, b + 1, seed),
      hash(a + 1, b + 1, seed),
      u
    ),
    v
  );
}

function fractal(x, z, seed = 0) {
  let value = 0;
  let amplitude = 1;
  let frequency = .018;
  let total = 0;

  for (let i = 0; i < 4; i++) {
    value += noise(
      x * frequency,
      z * frequency,
      seed + i * 11
    ) * amplitude;

    total += amplitude;
    amplitude *= .5;
    frequency *= 2;
  }

  return value / total;
}

function biome(x, z) {
  const n = fractal(x + 600, z - 400, 20);

  if (n < .35) return "Desert";
  if (n > .67) return "Mountains";
  return "Plains";
}

function height(x, z) {
  let h = Math.floor(
    (fractal(x, z, 5) - .44) * 24 +
    (fractal(x, z, 33) - .5) * 5 + 6
  );

  if (biome(x, z) === "Mountains") {
    h += Math.floor(
      15 * fractal(x + 40, z - 40, 96)
    );
  }

  if (biome(x, z) === "Desert") {
    h = Math.floor(
      (fractal(x, z, 5) - .45) * 10 + 4
    );
  }

  // Spawn and village are kept on dry, level ground.
  if (Math.hypot(x, z) < 12) {
    h = Math.max(4, h);
  }

  if (x >= 30 && x <= 55 &&
      z >= 16 && z <= 42) {
    h = 5;
  }

  return Math.max(-40, Math.min(49, h));
}

function treeAt(x, z) {
  return x % 9 === 0 &&
    z % 9 === 0 &&
    hash(x / 9, z / 9) > .57 &&
    biome(x, z) === "Plains" &&
    height(x, z) > 3 &&
    !(x >= 26 && x <= 59 &&
      z >= 12 && z <= 46);
}

const houses = [
  [35, 22],
  [49, 22],
  [35, 36],
  [49, 36]
];

function village(x, y, z) {
  for (const [cx, cz] of houses) {
    if (
      x < cx - 3 || x > cx + 3 ||
      z < cz - 3 || z > cz + 3
    ) continue;

    const wall =
      Math.abs(x - cx) === 3 ||
      Math.abs(z - cz) === 3;

    if (
      x === cx && z === cz - 3 &&
      (y === 6 || y === 7)
    ) return B.AIR;

    if (y >= 6 && y <= 8 && wall) {
      if (
        y === 7 &&
        ((x === cx && z === cz + 3) ||
         (x === cx + 3 && z === cz))
      ) return B.GLASS;

      return B.PLANKS;
    }

    if (y === 9) return B.WOOD;

    if (
      y === 6 &&
      x === cx + 1 &&
      z === cz + 1
    ) return B.CHEST;
  }

  if (
    x >= 38 && x <= 45 &&
    z >= 29 && z <= 33
  ) {
    if (y === 6) return B.FARMLAND;
    if (y === 7) return B.CROPS;
  }

  return null;
}

function natural(x, y, z) {
  if (y <= MIN_Y) return B.BEDROCK;
  if (y > MAX_Y) return B.AIR;

  const building = village(x, y, z);
  if (building !== null) return building;

  const h = height(x, z);
  const type = biome(x, z);

  if (y > h) {
    for (
      let tx = Math.floor((x - 2) / 9) * 9;
      tx <= x + 2;
      tx += 9
    ) {
      for (
        let tz = Math.floor((z - 2) / 9) * 9;
        tz <= z + 2;
        tz += 9
      ) {
        if (!treeAt(tx, tz)) continue;

        const th = height(tx, tz);
        const dx = Math.abs(x - tx);
        const dz = Math.abs(z - tz);

        if (
          dx === 0 && dz === 0 &&
          y <= th + 4
        ) return B.WOOD;

        if (
          dx <= 2 && dz <= 2 &&
          dx + dz < 4 &&
          y >= th + 3 &&
          y <= th + 6
        ) return B.LEAVES;
      }
    }

    if (
      type === "Desert" &&
      x % 11 === 0 &&
      z % 11 === 0 &&
      hash(x / 11, z / 11) > .67 &&
      y <= h + 3
    ) return B.CACTUS;

    return y <= 1 ? B.WATER : B.AIR;
  }

  if (y === h) {
    if (type === "Desert") return B.SAND;
    if (type === "Mountains" && h > 18) {
      return B.STONE;
    }
    return B.GRASS;
  }

  if (y >= h - 3) {
    return type === "Desert" ? B.SAND : B.DIRT;
  }

  const cavern =
    Math.sin(x * .13 + y * .15) +
    Math.cos(z * .14 - y * .1) +
    Math.sin((x + z + y) * .09);

  if (y < -5 && cavern > 2.46) {
    return y < -30 &&
      hash(x + y, z, 8) > .85
      ? B.LAVA
      : B.AIR;
  }

  const ore = hash(
    x * 7 + y * 13,
    z * 9 + y * 17,
    4
  );

  if (y < -25 && ore > .993) return B.DIAMOND;
  if (y < -14 && ore > .987) return B.GOLD;
  if (y < 8 && ore > .978) return B.IRON;
  if (y < 18 && ore > .962) return B.COAL;

  return B.STONE;
}

const key = (x, y, z) => `${x},${y},${z}`;

function block(x, y, z) {
  const k = key(x, y, z);

  return edits.has(k)
    ? edits.get(k)
    : natural(x, y, z);
}

// PIXEL TEXTURE GENERATOR

const textures = [
  "grassTop", "grassSide", "dirt", "stone",
  "sand", "wood", "woodTop", "leaves",
  "bedrock", "ice", "water", "cactus",
  "planks", "glass", "chest", "furnace",
  "farmland", "crops", "coal", "iron",
  "gold", "diamond", "lava"
];

const baseColors = [
  0x65b844, 0x896040, 0x895c3a, 0x868a8e,
  0xe3d091, 0x86603a, 0xc29a65, 0x348c4a,
  0x34353b, 0xa7dcec, 0x287fbd, 0x34864b,
  0xbc8b55, 0x97dced, 0xa57b43, 0x55585d,
  0x765137, 0x8ebc3b, 0x85888d, 0x85888d,
  0x88888a, 0x878d91, 0xed681b
];

const atlas = document.createElement("canvas");
atlas.width = 128;
atlas.height = Math.ceil(textures.length / 8) * 16;

const ctx = atlas.getContext("2d");

for (let t = 0; t < textures.length; t++) {
  const name = textures[t];
  const image = ctx.createImageData(16, 16);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = baseColors[t];
      let shade = (hash(x, y, t) - .5) * 48;

      if (name === "grassSide" && y < 3) {
        color = 0x5fb640;
      }

      if (name === "wood" && x % 4 === 0) {
        shade -= 38;
      }

      if (
        name === "woodTop" &&
        Math.floor(Math.max(
          Math.abs(x - 7.5),
          Math.abs(y - 7.5)
        )) % 3 === 0
      ) shade -= 35;

      if (name === "planks" && y % 5 === 0) {
        shade -= 40;
      }

      if (
        name === "glass" &&
        (x === 0 || x === 15 ||
         y === 0 || y === 15)
      ) shade += 75;

      if (
        name === "chest" &&
        (y === 3 || y === 12 ||
         x === 1 || x === 14)
      ) shade -= 55;

      if (name === "cactus" && x % 5 === 0) {
        shade += 35;
      }

      if (name === "farmland" && x % 4 === 0) {
        shade -= 35;
      }

      const ores = {
        coal: 0x22252a,
        iron: 0xcba083,
        gold: 0xf6d043,
        diamond: 0x3be5e4
      };

      if (
        ores[name] &&
        hash(
          Math.floor(x / 3),
          Math.floor(y / 3),
          t
        ) > .68
      ) color = ores[name];

      if (name === "lava") {
        shade += hash(
          Math.floor(x / 3),
          Math.floor(y / 3), t
        ) > .5 ? 60 : -35;
      }

      const i = (y * 16 + x) * 4;

      image.data[i] = Math.max(
        0, Math.min(255, ((color >> 16) & 255) + shade)
      );
      image.data[i + 1] = Math.max(
        0, Math.min(255, ((color >> 8) & 255) + shade)
      );
      image.data[i + 2] = Math.max(
        0, Math.min(255, (color & 255) + shade)
      );
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(
    image,
    (t % 8) * 16,
    Math.floor(t / 8) * 16
  );
}

const atlasTexture = new THREE.CanvasTexture(atlas);
atlasTexture.magFilter = THREE.NearestFilter;
atlasTexture.minFilter = THREE.NearestFilter;
atlasTexture.generateMipmaps = false;
atlasTexture.colorSpace = THREE.SRGBColorSpace;

const terrainMaterial = new THREE.MeshLambertMaterial({
  map: atlasTexture,
  vertexColors: true,
  side: THREE.DoubleSide
});

const waterMaterial = new THREE.MeshBasicMaterial({
  color: 0x258aca,
  transparent: true,
  opacity: .62,
  depthWrite: false,
  side: THREE.DoubleSide
});

const textureByBlock = {
  1: "grassSide",
  2: "dirt",
  3: "stone",
  4: "sand",
  5: "wood",
  6: "leaves",
  7: "bedrock",
  8: "ice",
  9: "water",
  10: "cactus",
  11: "planks",
  12: "glass",
  13: "chest",
  14: "furnace",
  15: "farmland",
  16: "crops",
  17: "coal",
  18: "iron",
  19: "gold",
  20: "diamond",
  21: "lava"
};

function tileIndex(id, face) {
  let name = textureByBlock[id] || "stone";

  if (id === B.GRASS) {
    name = face === 2
      ? "grassTop"
      : face === 3 ? "dirt" : "grassSide";
  }

  if (
    id === B.WOOD &&
    (face === 2 || face === 3)
  ) name = "woodTop";

  return Math.max(0, textures.indexOf(name));
}

function uvFor(id, face) {
  const t = tileIndex(id, face);
  const x = (t % 8) * 16;
  const y = Math.floor(t / 8) * 16;

  const l = (x + .3) / atlas.width;
  const r = (x + 15.7) / atlas.width;
  const top = 1 - (y + .3) / atlas.height;
  const bottom = 1 - (y + 15.7) / atlas.height;

  return [
    [l, bottom],
    [l, top],
    [r, top],
    [r, bottom]
  ];
}

const faces = [
  [[1,0,0],[
    [.5,-.5,-.5],[.5,.5,-.5],
    [.5,.5,.5],[.5,-.5,.5]
  ], .82],
  [[-1,0,0],[
    [-.5,-.5,.5],[-.5,.5,.5],
    [-.5,.5,-.5],[-.5,-.5,-.5]
  ], .8],
  [[0,1,0],[
    [-.5,.5,-.5],[-.5,.5,.5],
    [.5,.5,.5],[.5,.5,-.5]
  ], 1],
  [[0,-1,0],[
    [-.5,-.5,.5],[-.5,-.5,-.5],
    [.5,-.5,-.5],[.5,-.5,.5]
  ], .62],
  [[0,0,1],[
    [.5,-.5,.5],[.5,.5,.5],
    [-.5,.5,.5],[-.5,-.5,.5]
  ], .93],
  [[0,0,-1],[
    [-.5,-.5,-.5],[-.5,.5,-.5],
    [.5,.5,-.5],[.5,-.5,-.5]
  ], .75]
];

// CHUNK RENDERING

const chunks = new Map();
const queued = new Set();
const buildQueue = [];

function makeMesh(data, material) {
  const [positions, normals, uvs, colors, indices] = data;
  if (!indices.length) return null;

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(normals, 3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs, 2)
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

function buildChunk(cx, cz) {
  const solids = [[], [], [], [], []];
  const liquids = [[], [], [], [], []];

  for (let x = cx * SIZE; x < (cx + 1) * SIZE; x++) {
    for (let z = cz * SIZE; z < (cz + 1) * SIZE; z++) {
      for (
        let y = MIN_Y;
        y <= height(x, z) + 9;
        y++
      ) {
        const id = block(x, y, z);
        if (id === B.AIR) continue;

        const isLiquid =
          id === B.WATER || id === B.LAVA;

        const data = isLiquid ? liquids : solids;

        for (let f = 0; f < 6; f++) {
          const [direction, points, shade] = faces[f];
          const [dx, dy, dz] = direction;
          const adjacent = block(
            x + dx, y + dy, z + dz
          );

          if (isLiquid) {
            if (
              adjacent === id ||
              (adjacent !== B.AIR &&
               adjacent !== B.WATER &&
               adjacent !== B.LAVA)
            ) continue;
          } else if (
            adjacent !== B.AIR &&
            adjacent !== B.WATER &&
            adjacent !== B.LAVA
          ) continue;

          const [p, n, uv, colors, indices] = data;
          const start = p.length / 3;
          const coords = uvFor(id, f);

          for (let j = 0; j < 4; j++) {
            const q = points[j];

            p.push(
              x + q[0],
              y + q[1],
              z + q[2]
            );
            n.push(...direction);
            uv.push(...coords[j]);
            colors.push(shade, shade, shade);
          }

          indices.push(
            start, start + 1, start + 2,
            start, start + 2, start + 3
          );
        }
      }
    }
  }

  return [
    makeMesh(solids, terrainMaterial),
    makeMesh(liquids, waterMaterial)
  ];
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function discardChunk(k) {
  const meshes = chunks.get(k);
  if (!meshes) return;

  for (const mesh of meshes) {
    if (!mesh) continue;
    scene.remove(mesh);
    mesh.geometry.dispose();
  }

  chunks.delete(k);
}

function enqueue(cx, cz) {
  const k = chunkKey(cx, cz);
  if (queued.has(k)) return;

  queued.add(k);
  buildQueue.push([cx, cz]);
}

function rebuildAt(x, z) {
  const cx = Math.floor(x / SIZE);
  const cz = Math.floor(z / SIZE);

  enqueue(cx, cz);

  const mx = ((x % SIZE) + SIZE) % SIZE;
  const mz = ((z % SIZE) + SIZE) % SIZE;

  if (mx === 0) enqueue(cx - 1, cz);
  if (mx === SIZE - 1) enqueue(cx + 1, cz);
  if (mz === 0) enqueue(cx, cz - 1);
  if (mz === SIZE - 1) enqueue(cx, cz + 1);
}

let lastCenter = "";

function stream() {
  const cx = Math.floor(player.x / SIZE);
  const cz = Math.floor(player.z / SIZE);
  const center = chunkKey(cx, cz);

  if (center === lastCenter) return;
  lastCenter = center;

  const needed = new Set();

  for (let x = cx - VIEW; x <= cx + VIEW; x++) {
    for (let z = cz - VIEW; z <= cz + VIEW; z++) {
      const k = chunkKey(x, z);
      needed.add(k);
      if (!chunks.has(k)) enqueue(x, z);
    }
  }

  for (const k of [...chunks.keys()]) {
    if (!needed.has(k)) discardChunk(k);
  }
}

function processChunks() {
  let budget = 2;

  while (budget-- > 0 && buildQueue.length) {
    const [cx, cz] = buildQueue.shift();
    const k = chunkKey(cx, cz);
    queued.delete(k);

    if (
      Math.abs(cx - Math.floor(player.x / SIZE)) > VIEW ||
      Math.abs(cz - Math.floor(player.z / SIZE)) > VIEW
    ) continue;

    discardChunk(k);
    chunks.set(k, buildChunk(cx, cz));
  }
}

// WATER FLOW AND FALLING SAND

const waterQueue = [];
const waterLevels = new Map();

function queueWater(x, y, z, level = 0) {
  waterQueue.push({x, y, z, level});
}

function editBlock(x, y, z, id, fluid = false) {
  if (y <= MIN_Y || y > MAX_Y) return false;
  if (block(x, y, z) === id) return false;

  edits.set(key(x, y, z), id);
  rebuildAt(x, z);

  if (!fluid) {
    if (id === B.WATER) queueWater(x, y, z);

    if (id === B.AIR) {
      checkSand(x, y + 1, z);
    }
  }
  return true;
}

function updateWater() {
  let count = 0;

  while (waterQueue.length && count++ < 24) {
    const {x, y, z, level} = waterQueue.shift();

    if (block(x, y, z) !== B.WATER) continue;

    if (
      y > MIN_Y + 1 &&
      block(x, y - 1, z) === B.AIR
    ) {
      if (editBlock(x, y - 1, z, B.WATER, true)) {
        queueWater(x, y - 1, z, 0);
      }
      continue;
    }

    if (level >= 4) continue;

    for (const [dx, dz] of [
      [1,0],[-1,0],[0,1],[0,-1]
    ]) {
      const nx = x + dx;
      const nz = z + dz;
      const k = key(nx, y, nz);

      if (block(nx, y, nz) !== B.AIR) continue;
      if ((waterLevels.get(k) ?? Infinity) <= level + 1) {
        continue;
      }

      waterLevels.set(k, level + 1);

      if (editBlock(nx, y, nz, B.WATER, true)) {
        queueWater(nx, y, nz, level + 1);
      }
    }
  }
}

const fallingSand = [];
const sandGeometry = new THREE.BoxGeometry(1, 1, 1);
const sandMaterial = new THREE.MeshLambertMaterial({
  color: 0xe4d094
});

function checkSand(x, y, z) {
  if (block(x, y, z) !== B.SAND) return;
  if (block(x, y - 1, z) !== B.AIR) return;

  edits.set(key(x, y, z), B.AIR);
  rebuildAt(x, z);

  const mesh = new THREE.Mesh(
    sandGeometry, sandMaterial
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);

  fallingSand.push({
    x, y, z, vy: 0, mesh
  });
}

function updateSand(dt) {
  for (let i = fallingSand.length - 1; i >= 0; i--) {
    const s = fallingSand[i];

    s.vy = Math.max(-22, s.vy - 24 * dt);
    const nextY = s.y + s.vy * dt;

    if (
      nextY <= MIN_Y + 1 ||
      block(s.x, Math.round(nextY - .55), s.z) !== B.AIR
    ) {
      let landing = Math.round(s.y);

      while (
        landing <= MAX_Y &&
        block(s.x, landing, s.z) !== B.AIR
      ) landing++;

      if (landing <= MAX_Y) {
        editBlock(s.x, landing, s.z, B.SAND);
      }

      scene.remove(s.mesh);
      fallingSand.splice(i, 1);
    } else {
      s.y = nextY;
      s.mesh.position.y = nextY;
    }
  }
}

// PLAYER PHYSICS

const player = {
  x: 0,
  y: height(0, 0) + .51,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: 0,
  pitch: 0,
  grounded: false
};

if (
  Array.isArray(stored.position) &&
  stored.position.length === 3 &&
  stored.position.every(Number.isFinite)
) {
  [player.x, player.y, player.z] = stored.position;
}

const keys = {};

function collision(px, py, pz) {
  const epsilon = .001;

  const minX = Math.floor(px - .3 + epsilon + .5);
  const maxX = Math.floor(px + .3 - epsilon + .5);
  const minY = Math.floor(py + epsilon + .5);
  const maxY = Math.floor(py + 1.8 - epsilon + .5);
  const minZ = Math.floor(pz - .3 + epsilon + .5);
  const maxZ = Math.floor(pz + .3 - epsilon + .5);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (isSolid(block(x, y, z))) return true;
      }
    }
  }
  return false;
}

function moveAxis(axis, distance) {
  const steps = Math.ceil(Math.abs(distance) / .1);
  if (!steps) return true;

  const amount = distance / steps;

  for (let i = 0; i < steps; i++) {
    const x = player.x + (axis === "x" ? amount : 0);
    const y = player.y + (axis === "y" ? amount : 0);
    const z = player.z + (axis === "z" ? amount : 0);

    if (collision(x, y, z)) return false;

    player[axis] += amount;
  }
  return true;
}

let hazardTimer = 0;

function updatePlayer(dt) {
  const fx = -Math.sin(player.yaw);
  const fz = -Math.cos(player.yaw);
  const rx = Math.cos(player.yaw);
  const rz = -Math.sin(player.yaw);

  let x = 0, z = 0;

  if (keys.KeyW) {x += fx; z += fz;}
  if (keys.KeyS) {x -= fx; z -= fz;}
  if (keys.KeyA) {x -= rx; z -= rz;}
  if (keys.KeyD) {x += rx; z += rz;}

  const length = Math.hypot(x, z);
  if (length) {x /= length; z /= length;}

  const underfoot = block(
    Math.round(player.x),
    Math.round(player.y - .52),
    Math.round(player.z)
  );

  const ice = underfoot === B.ICE;
  const sneaking = keys.ShiftLeft;
  const sprinting = keys.ControlLeft;

  const speed = sneaking ? 2.2 : sprinting ? 9 : 6;
  const acceleration = ice ? 5 : 40;
  const friction = ice ? 1.2 : length ? 9 : 14;

  player.vx += x * acceleration * dt;
  player.vz += z * acceleration * dt;

  player.vx *= Math.exp(-friction * dt);
  player.vz *= Math.exp(-friction * dt);

  const currentSpeed = Math.hypot(
    player.vx, player.vz
  );

  if (currentSpeed > speed) {
    player.vx *= speed / currentSpeed;
    player.vz *= speed / currentSpeed;
  }

  if (flying || creative) {
    player.vy =
      (keys.Space ? speed : 0) -
      (keys.KeyX ? speed : 0);
  } else {
    player.vy = Math.max(-22, player.vy - 24 * dt);

    if (keys.Space && player.grounded) {
      player.vy = 8.5;
      player.grounded = false;
    }
  }

  if (!moveAxis("x", player.vx * dt)) {
    player.vx = 0;
  }

  if (!moveAxis("z", player.vz * dt)) {
    player.vz = 0;
  }

  if (!moveAxis("y", player.vy * dt)) {
    player.grounded = player.vy < 0;
    player.vy = 0;
  } else {
    player.grounded = false;
  }

  if (player.y < MIN_Y - 5 || health <= 0) {
    player.x = 0;
    player.z = 0;
    player.y = height(0, 0) + .51;
    player.vx = player.vy = player.vz = 0;
    health = 20;
    food = Math.max(food, 10);
    notify("Respawned");
  }

  const atFeet = block(
    Math.round(player.x),
    Math.round(player.y + .5),
    Math.round(player.z)
  );

  if (atFeet === B.LAVA && !creative) {
    hazardTimer += dt;

    if (hazardTimer >= 1) {
      health = Math.max(0, health - 3);
      hazardTimer = 0;
      notify("Lava burns!");
    }
  } else {
    hazardTimer = 0;
  }

  camera.position.set(
    player.x,
    player.y + 1.62,
    player.z
  );
  camera.rotation.set(
    player.pitch,
    player.yaw,
    0,
    "YXZ"
  );
}

// VILLAGERS

const villagers = [];
let villageSpawned = false;

function spawnVillagers() {
  if (villageSpawned) return;
  villageSpawned = true;

  for (const [x, z] of [
    [37, 26], [47, 26], [37, 39], [47, 39]
  ]) {
    const group = new THREE.Group();

    function part(w, h, d, color, px, py, pz) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshLambertMaterial({color})
      );
      mesh.position.set(px, py, pz);
      group.add(mesh);
    }

    part(.65, .85, .4, 0x79523d, 0, .9, 0);
    part(.5, .52, .5, 0xc69b7d, 0, 1.6, 0);
    part(.13, .2, .19, 0xae8064, 0, 1.5, -.32);

    for (const xx of [-.14, .14]) {
      part(.08, .08, .05, 0x214b38,
        xx, 1.7, -.27);
    }

    for (const xx of [-.18, .18]) {
      part(.19, .5, .19, 0x4c332e,
        xx, .25, 0);
    }

    group.position.set(x, 5.5, z);
    group.userData.villager = true;
    group.userData.direction = Math.random() * 6.28;
    group.userData.timer = 0;

    scene.add(group);
    villagers.push(group);
  }
}

function updateVillagers(dt) {
  for (const v of villagers) {
    v.userData.timer -= dt;

    if (v.userData.timer <= 0) {
      v.userData.timer = 2 + Math.random() * 3;
      v.userData.direction +=
        (Math.random() - .5) * 2;
    }

    const a = v.userData.direction;
    const x = v.position.x + Math.sin(a) * dt * .5;
    const z = v.position.z + Math.cos(a) * dt * .5;

    if (
      x < 30 || x > 55 ||
      z < 16 || z > 42
    ) {
      v.userData.direction += Math.PI;
      continue;
    }

    if (!isSolid(block(
      Math.round(x), 6, Math.round(z)
    ))) {
      v.position.x = x;
      v.position.z = z;
    }

    v.rotation.y = a;
  }
}

// INVENTORY, CRAFTING AND CHESTS

function entry(title, subtitle, actions) {
  const root = $("entries");
  const div = document.createElement("div");
  div.className = "entry";

  const info = document.createElement("div");
  info.className = "info";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const small = document.createElement("small");
  small.textContent = subtitle;

  info.append(strong, small);
  div.append(info);

  for (const [name, fn, disabled] of actions) {
    const button = document.createElement("button");
    button.textContent = name;
    button.disabled = !!disabled;
    button.onclick = fn;
    div.append(button);
  }

  root.append(div);
}

function openPanel(type, chest = null) {
  panel = type;
  chestKey = chest;

  $("panel").hidden = false;
  $("menu").hidden = true;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  drawPanel();
}

function closePanel() {
  panel = null;
  chestKey = null;
  $("panel").hidden = true;
  $("menu").hidden = true;

  renderer.domElement.requestPointerLock().catch(() => {
    $("menu").hidden = false;
  });
}

$("close").onclick = closePanel;

function drawPanel() {
  if (!panel) return;

  $("entries").replaceChildren();

  $("panelTitle").textContent = {
    inventory: "🎒 INVENTORY",
    crafting: "🔨 CRAFTING",
    chest: "📦 CHEST",
    trading: "💚 VILLAGER TRADING",
    furnace: "🔥 FURNACE"
  }[panel];

  $("help").textContent =
    "Select an item or perform an available action.";

  if (panel === "inventory") {
    for (const [id, count] of Object.entries(inventory)) {
      if (count <= 0) continue;

      const item = /^\d+$/.test(id) ? Number(id) : id;

      entry(
        `${itemIcon(item)} ${itemName(item)}`,
        `Quantity: ${count}`,
        [[
          "SELECT",
          () => {
            slots[selected] = item;
            closePanel();
          }
        ]]
      );
    }
  }

  if (panel === "crafting") {
    for (const [id, count, materials] of RECIPES) {
      const possible = Object.entries(materials)
        .every(([item, amount]) =>
          (inventory[item] || 0) >= amount
        );

      const requirements = Object.entries(materials)
        .map(([item, amount]) =>
          `${amount} ${itemName(
            /^\d+$/.test(item) ? Number(item) : item
          )}`
        ).join(" + ");

      entry(
        `${itemIcon(id)} ${itemName(id)} ×${count}`,
        requirements,
        [[
          "CRAFT",
          () => {
            if (!Object.entries(materials).every(
              ([item, n]) => (inventory[item] || 0) >= n
            )) return;

            for (const [item, n] of Object.entries(materials)) {
              inventory[item] -= n;
            }

            add(id, count);
            drawPanel();
            notify(`Crafted ${itemName(id)}`);
          },
          !possible
        ]]
      );
    }
  }

  if (panel === "chest") {
    chestData[chestKey] ||= {};
    const contents = chestData[chestKey];

    for (const [id, count] of Object.entries(inventory)) {
      if (count <= 0) continue;

      entry(
        `${itemName(/^\d+$/.test(id) ? Number(id) : id)} (bag)`,
        `${count} available`,
        [[
          "STORE 1",
          () => {
            if (!take(id)) return;
            contents[id] = (contents[id] || 0) + 1;
            drawPanel();
          }
        ]]
      );
    }

    for (const [id, count] of Object.entries(contents)) {
      if (count <= 0) continue;

      entry(
        `${itemName(/^\d+$/.test(id) ? Number(id) : id)} (chest)`,
        `${count} stored`,
        [[
          "TAKE 1",
          () => {
            contents[id]--;
            add(id);
            drawPanel();
          }
        ]]
      );
    }
  }

  if (panel === "trading") {
    entry("💚 Emerald", "Cost: 5 wheat", [[
      "TRADE",
      () => {
        if (!take("wheat", 5)) return;
        add("emerald");
        drawPanel();
      },
      (inventory.wheat || 0) < 5
    ]]);

    entry("🪵 8 Planks", "Cost: 1 emerald", [[
      "TRADE",
      () => {
        if (!take("emerald")) return;
        add(B.PLANKS, 8);
        drawPanel();
      },
      (inventory.emerald || 0) < 1
    ]]);
  }

  if (panel === "furnace") {
    entry(
      "🍖 Cook Meat",
      "Requires raw meat and coal",
      [[
        "COOK",
        () => {
          if (
            (inventory.meat || 0) < 1 ||
            (inventory[B.COAL] || 0) < 1
          ) return;

          take("meat");
          take(B.COAL);
          add("cooked");
          drawPanel();
        },
        !(
          (inventory.meat || 0) > 0 &&
          (inventory[B.COAL] || 0) > 0
        )
      ]]
    );
  }
}

// SAVING

function saveGame(silent = false) {
  try {
    localStorage.setItem(SAVE, JSON.stringify({
      edits: [...edits],
      chests: chestData,
      inventory,
      slots,
      position: [player.x, player.y, player.z],
      health,
      food
    }));

    if (!silent) notify("World saved");
  } catch {
    notify("Unable to save: browser storage limit");
  }
}

let resetting = false;

$("reset").onclick = () => {
  if (confirm("Delete the saved BLOCKVERSE world?")) {
    resetting = true;
    localStorage.removeItem(SAVE);
    location.reload();
  }
};

window.addEventListener("beforeunload", () => {
  if (!resetting) saveGame(true);
});

// KEYBOARD AND MOUSE

$("play").onclick = () => {
  renderer.domElement.requestPointerLock();
};

renderer.domElement.addEventListener("click", () => {
  if (!playing && !panel) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  playing =
    document.pointerLockElement === renderer.domElement;

  $("menu").hidden = playing || !!panel;
  $("hud").hidden = !playing;

  if (!playing) {
    for (const code of Object.keys(keys)) {
      keys[code] = false;
    }
  }
});

document.addEventListener("mousemove", e => {
  if (!playing) return;

  player.yaw -= e.movementX * .0022;
  player.pitch = THREE.MathUtils.clamp(
    player.pitch - e.movementY * .0022,
    -1.48, 1.48
  );
});

document.addEventListener("keydown", e => {
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) {
    e.preventDefault();
  }

  if (panel && e.code === "Escape") {
    closePanel();
    return;
  }

  keys[e.code] = true;
  if (!playing || e.repeat) return;

  if (/^Digit[1-9]$/.test(e.code)) {
    selected = Number(e.code.slice(-1)) - 1;
  }

  if (e.code === "KeyE") openPanel("inventory");
  if (e.code === "KeyC") openPanel("crafting");
  if (e.code === "KeyP") saveGame();

  if (e.code === "KeyF") {
    flying = !flying;
    player.vy = 0;
    notify(flying ? "Flying ON" : "Flying OFF");
  }

  if (e.code === "KeyG") {
    creative = !creative;
    notify(creative ? "CREATIVE" : "SURVIVAL");
  }

  if (e.code === "KeyV") {
    player.x = 40;
    player.y = 5.51;
    player.z = 28;
    player.vx = player.vy = player.vz = 0;
    lastCenter = "";
    notify("Travelled to village");
  }

  if (e.code === "KeyR") {
    if (take("cooked")) {
      food = Math.min(20, food + 6);
      notify("Ate cooked meat");
    } else if (take("meat")) {
      food = Math.min(20, food + 2);
      notify("Ate raw meat");
    } else {
      notify("No food available");
    }
  }
});

document.addEventListener("keyup", e => {
  keys[e.code] = false;
});

document.addEventListener("contextmenu", e => {
  e.preventDefault();
});

// MINING AND PLACING

const cameraDirection = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

function trace(distance = 6) {
  camera.getWorldDirection(cameraDirection);
  let previous = null;

  for (let d = .06; d <= distance; d += .055) {
    const x = Math.floor(
      camera.position.x + cameraDirection.x * d + .5
    );
    const y = Math.floor(
      camera.position.y + cameraDirection.y * d + .5
    );
    const z = Math.floor(
      camera.position.z + cameraDirection.z * d + .5
    );

    const id = block(x, y, z);

    if (id !== B.AIR) {
      return {x, y, z, id, place: previous};
    }

    previous = {x, y, z};
  }
  return null;
}

function villagerTarget() {
  raycaster.setFromCamera(
    new THREE.Vector2(0, 0), camera
  );
  raycaster.far = 5;

  const hit = raycaster.intersectObjects(
    villagers, true
  )[0];

  if (!hit) return null;

  let obj = hit.object;
  while (obj.parent && !obj.userData.villager) {
    obj = obj.parent;
  }
  return obj.userData.villager ? obj : null;
}

function mine(t) {
  if (!t || t.id === B.BEDROCK) return;

  if (editBlock(t.x, t.y, t.z, B.AIR)) {
    if (t.id === B.CROPS) {
      add("wheat", 2);
      add("seeds", 2);
    } else if (
      t.id !== B.WATER &&
      t.id !== B.LAVA
    ) {
      add(t.id);
    }
    notify(`Mined ${itemName(t.id)}`);
  }
}

function interact(t) {
  if (!t) return;

  const held = slots[selected];

  if (
    t.id === B.WATER &&
    held === "bucket" &&
    take("bucket")
  ) {
    add("water_bucket");
    editBlock(t.x, t.y, t.z, B.AIR);
    notify("Water bucket filled");
    return;
  }

  if (t.id === B.CHEST) {
    openPanel("chest", key(t.x, t.y, t.z));
    return;
  }

  if (t.id === B.FURNACE) {
    openPanel("furnace");
    return;
  }

  if (t.id === B.CROPS) {
    mine(t);
    return;
  }

  if (t.id === B.FARMLAND && take("seeds")) {
    editBlock(t.x, t.y + 1, t.z, B.CROPS);
    notify("Crops planted");
    return;
  }

  if (!t.place) return;

  const {x, y, z} = t.place;

  if (block(x, y, z) !== B.AIR) return;

  if (held === "water_bucket") {
    if (take("water_bucket")) {
      add("bucket");
      editBlock(x, y, z, B.WATER);
      notify("Water placed");
    }
    return;
  }

  if (
    typeof held !== "number" ||
    held === B.AIR ||
    held === B.BEDROCK ||
    held === B.WATER ||
    held === B.LAVA
  ) return;

  const overlaps =
    x + .5 > player.x - .3 &&
    x - .5 < player.x + .3 &&
    y + .5 > player.y &&
    y - .5 < player.y + 1.8 &&
    z + .5 > player.z - .3 &&
    z - .5 < player.z + .3;

  if (overlaps) return;

  if (!creative && !take(held)) {
    notify(`No ${itemName(held)} available`);
    return;
  }

  editBlock(x, y, z, held);
  notify(`Placed ${itemName(held)}`);
}

let actionCooldown = 0;

document.addEventListener("mousedown", e => {
  if (!playing || actionCooldown > 0) return;

  if (e.button === 2 && villagerTarget()) {
    openPanel("trading");
    return;
  }

  if (e.button === 0) mine(trace());
  if (e.button === 2) interact(trace());

  actionCooldown = .13;
});

// HOTBAR

const bar = $("hotbar");

for (let i = 0; i < 9; i++) {
  const element = document.createElement("div");
  element.className = "slot";

  const icon = document.createElement("span");
  const number = document.createElement("small");
  number.textContent = i + 1;

  element.append(icon, number);
  bar.append(element);
}

// GAME LOOP

const clock = new THREE.Clock();
let foodTimer = 0;
let saveTimer = 0;
let waterTimer = 0;

stream();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(.04, clock.getDelta());

  if (playing) {
    updatePlayer(dt);
    stream();
    updateSand(dt);

    // Generate villagers once when near the village.
    if (
      Math.abs(player.x - 42) < 40 &&
      Math.abs(player.z - 29) < 40
    ) {
      spawnVillagers();
      updateVillagers(dt);
    }

    actionCooldown = Math.max(
      0, actionCooldown - dt
    );

    foodTimer += dt;

    if (foodTimer >= 6) {
      foodTimer = 0;
      if (!creative) {
        food = Math.max(0, food - 1);
        if (food === 0) {
          health = Math.max(0, health - 1);
        }
      }
    }

    saveTimer += dt;
    if (saveTimer >= 45) {
      saveTimer = 0;
      saveGame(true);
    }

    $("coords").textContent =
      `XYZ ${Math.floor(player.x)} ` +
      `${Math.floor(player.y)} ` +
      `${Math.floor(player.z)}`;

    $("biome").textContent = biome(
      Math.floor(player.x),
      Math.floor(player.z)
    );

    $("health").textContent = Math.ceil(health);
    $("food").textContent = Math.ceil(food);
    $("mode").textContent =
      creative ? "CREATIVE" : "SURVIVAL";

    const held = slots[selected];

    $("selection").textContent =
      `${itemName(held)} (${inventory[held] || 0})`;

    [...bar.children].forEach((element, i) => {
      element.classList.toggle(
        "active", i === selected
      );
      element.querySelector("span").textContent =
        itemIcon(slots[i]);
    });
  }

  waterTimer += dt;
  if (waterTimer >= .08) {
    waterTimer = 0;
    updateWater();
  }

  processChunks();

  if (noticeTimer > 0) {
    noticeTimer -= dt;
    if (noticeTimer <= 0) {
      $("notice").textContent = "";
    }
  }

  renderer.render(scene, camera);
}

camera.position.set(
  player.x,
  player.y + 1.62,
  player.z
);

animate();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
