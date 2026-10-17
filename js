import * as THREE from "https://esm.sh/three@0.180.0";

/* GALAXY BLOCKVERSE — FLY & DISMOUNT EDITION */

const $ = id => document.getElementById(id);
const SAVE = "galaxy-blockverse-three-files-v1";

const SIZE = 12;
const VIEW = 1;
const MIN_Y = -32;
const MAX_Y = 65;
const REACH = 6;

const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3,
  SAND: 4, WOOD: 5, LEAVES: 6,
  BEDROCK: 7, ICE: 8, WATER: 9,
  CACTUS: 10, PLANKS: 11, GLASS: 12,
  CHEST: 13, FURNACE: 14, FARMLAND: 15,
  CROPS: 16, COAL: 17, IRON: 18,
  GOLD: 19, DIAMOND: 20, LAVA: 21,
  GRAVEL: 22, COBBLE: 23, OBSIDIAN: 24,
  TNT: 25, FIRE: 26, BRICKS: 27,
  SNOW: 28, CLAY: 29, COPPER: 30,
  LAB: 31, FENCE: 32, BIRCH: 33,
  BIRCH_LEAF: 34, CHERRY: 35,
  CHERRY_LEAF: 36, RED_LEAF: 37,
  ORANGE_LEAF: 38, YELLOW_LEAF: 39,
  GIANT_LOG: 40, GIANT_LEAF: 41,
  TALL_GRASS: 42
};

const names = [
  "Air", "Grass", "Dirt", "Stone", "Sand",
  "Oak Wood", "Leaves", "Bedrock", "Ice",
  "Water", "Cactus", "Planks", "Glass",
  "Chest", "Furnace", "Farmland",
  "Wheat Crops", "Coal Ore", "Iron Ore",
  "Gold Ore", "Diamond Ore", "Lava",
  "Gravel", "Cobblestone", "Obsidian",
  "TNT", "Fire", "Bricks", "Snow", "Clay",
  "Copper Ore", "Chemistry Lab", "Fence",
  "Birch Log", "Birch Leaves",
  "Cherry Log", "Cherry Leaves",
  "Red Leaves", "Orange Leaves",
  "Yellow Leaves", "Ancient Log",
  "Ancient Leaves", "Tall Grass"
];

const icons = [
  "▫️","🟩","🟫","🪨","🏖️","🪵","🍃","⬛",
  "🧊","💧","🌵","🪵","🪟","📦","🔥","🟤",
  "🌾","⚫","🔩","🟨","💎","🌋","🪨","🪨",
  "⬛","🧨","🔥","🧱","❄️","🟫","🟠",
  "⚗️","🪵","🌳","🍃","🌸","🌸","🍁",
  "🍂","🍁","🌳","🌿","🌱"
];

const extra = {
  seeds: ["Wheat Seeds", "🌱"],
  wheat: ["Wheat", "🌾"],
  bread: ["Bread", "🍞"],
  apple: ["Apple", "🍎"],
  meat: ["Raw Meat", "🥩"],
  cooked: ["Cooked Meat", "🍖"],
  bucket: ["Bucket", "🪣"],
  water_bucket: ["Water Bucket", "💧"],
  lava_bucket: ["Lava Bucket", "🌋"],
  emerald: ["Emerald", "💚"],
  iron_ingot: ["Iron Ingot", "🔩"],
  hydrogen: ["Hydrogen", "H"],
  oxygen: ["Oxygen", "O"],
  sodium: ["Sodium", "Na"],
  chlorine: ["Chlorine", "Cl"],
  salt: ["Salt", "🧂"],
  water_compound: ["Water Compound", "💧"]
};

const nameOf = id =>
  typeof id === "number"
    ? names[id] || "Unknown"
    : extra[id]?.[0] || String(id);

const iconOf = id =>
  typeof id === "number"
    ? icons[id] || "▫️"
    : extra[id]?.[1] || "▫️";

const asId = id =>
  /^\d+$/.test(String(id)) ? Number(id) : id;

const nonSolid = new Set([
  B.AIR, B.WATER, B.LAVA, B.FIRE,
  B.LEAVES, B.BIRCH_LEAF, B.CHERRY_LEAF,
  B.RED_LEAF, B.ORANGE_LEAF,
  B.YELLOW_LEAF, B.GIANT_LEAF,
  B.CROPS, B.TALL_GRASS
]);

const solid = id => !nonSolid.has(id);

const recipes = [
  [B.PLANKS, 4, {[B.WOOD]: 1}],
  [B.PLANKS, 4, {[B.BIRCH]: 1}],
  [B.PLANKS, 4, {[B.CHERRY]: 1}],
  [B.FENCE, 4, {[B.PLANKS]: 6}],
  [B.CHEST, 1, {[B.PLANKS]: 8}],
  [B.FURNACE, 1, {[B.COBBLE]: 8}],
  [B.FARMLAND, 4, {[B.DIRT]: 4}],
  ["bread", 1, {wheat: 3}],
  [B.TNT, 1, {[B.SAND]: 4, [B.COAL]: 3}]
];

const chemistry = [
  ["water_compound", 1, {hydrogen: 2, oxygen: 1}],
  ["salt", 1, {sodium: 1, chlorine: 1}]
];

const smelting = [
  [B.GLASS, 1, {[B.SAND]: 1, [B.COAL]: 1}],
  ["iron_ingot", 1, {[B.IRON]: 1, [B.COAL]: 1}],
  ["cooked", 1, {meat: 1, [B.COAL]: 1}]
];

/* SCENE */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c6ed);
scene.fog = new THREE.Fog(0x91c6ed, 24, 67);

const camera = new THREE.PerspectiveCamera(
  74,
  innerWidth / innerHeight,
  .05,
  130
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(
  0xe8f5ff, 0x4b6347, 1.8
);
scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xffe8ba, 1.4
);
sun.position.set(30, 65, 20);
scene.add(sun);

/* SAVE */

let old = {};

try {
  old = JSON.parse(localStorage.getItem(SAVE) || "{}");
} catch {
  old = {};
}

const edits = new Map(
  Array.isArray(old.edits) ? old.edits : []
);

const cropAges = new Map(
  Array.isArray(old.cropAges) ? old.cropAges : []
);

const chests = old.chests || {};

const inventory = {
  1: 24,
  2: 20,
  3: 20,
  5: 16,
  11: 16,
  15: 10,
  25: 3,
  31: 1,
  32: 20,
  seeds: 12,
  bread: 4,
  bucket: 1,
  hydrogen: 5,
  oxygen: 4,
  sodium: 3,
  chlorine: 3,
  ...old.inventory
};

const slots =
  Array.isArray(old.slots) && old.slots.length === 9
    ? old.slots
    : [
        B.GRASS, B.DIRT, B.STONE,
        B.WOOD, B.PLANKS, B.FENCE,
        B.FARMLAND, B.TNT, "seeds"
      ];

let selected = 0;
let health = old.health ?? 20;
let hunger = old.food ?? 20;

let creative = false;
let flying = false;
let playing = false;
let mounted = null;
let cameraMode = 0;
let panel = "";
let chestKey = "";

let gameTime = 0;
let noticeTime = 0;

function add(id, amount = 1) {
  inventory[id] = (inventory[id] || 0) + amount;
}

function take(id, amount = 1) {
  if ((inventory[id] || 0) < amount) return false;
  inventory[id] -= amount;
  return true;
}

function notify(message) {
  $("notice").textContent = message;
  noticeTime = 2.7;
}

/* TERRAIN */

function hash(x, z, seed = 0) {
  const n = Math.sin(
    x * 127.1 + z * 311.7 + seed * 79.7
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
  const lerp = THREE.MathUtils.lerp;

  return lerp(
    lerp(hash(a, b, seed), hash(a + 1, b, seed), u),
    lerp(hash(a, b + 1, seed), hash(a + 1, b + 1, seed), u),
    v
  );
}

function fractal(x, z, seed = 0) {
  let total = 0;
  let weight = 0;
  let a = 1;
  let f = .018;

  for (let i = 0; i < 4; i++) {
    total += noise(x * f, z * f, seed + i * 11) * a;
    weight += a;
    a *= .5;
    f *= 2;
  }

  return total / weight;
}

const columns = new Map();

function column(x, z) {
  const k = `${x},${z}`;
  if (columns.has(k)) return columns.get(k);

  const climate = fractal(x + 650, z - 420, 21);

  const type =
    climate < .25 ? "Desert" :
    climate < .42 ? "Autumn Forest" :
    climate < .59 ? "Plains" :
    climate < .72 ? "Cherry Grove" :
    climate < .85 ? "Ancient Forest" :
    "Mountains";

  let y = Math.floor(
    (fractal(x, z, 5) - .44) * 23 +
    (fractal(x, z, 33) - .5) * 6 + 7
  );

  if (type === "Mountains") {
    y += Math.floor(16 * fractal(x + 40, z - 40, 96));
  }

  if (type === "Desert") {
    y = Math.floor((fractal(x, z, 5) - .45) * 11 + 5);
  }

  if (Math.hypot(x, z) < 12) y = Math.max(4, y);

  if (x >= 30 && x <= 55 && z >= 16 && z <= 42) {
    y = 5;
  }

  y = THREE.MathUtils.clamp(y, -25, 48);

  const result = {y, type};

  if (columns.size > 16000) columns.clear();
  columns.set(k, result);
  return result;
}

const height = (x, z) => column(x, z).y;
const biome = (x, z) => column(x, z).type;

function treeAt(x, z) {
  if (x % 10 !== 0 || z % 10 !== 0) return null;
  if (x >= 25 && x <= 60 && z >= 12 && z <= 52) return null;

  const area = biome(x, z);
  if (area === "Desert" || area === "Mountains") return null;
  if (height(x, z) < 3 || hash(x / 10, z / 10, 15) < .45) {
    return null;
  }

  const type =
    area === "Cherry Grove" ? "cherry" :
    area === "Autumn Forest" ? "autumn" :
    area === "Ancient Forest" ? "ancient" :
    hash(x, z, 6) > .7 ? "birch" : "oak";

  const log =
    type === "cherry" ? B.CHERRY :
    type === "birch" ? B.BIRCH :
    type === "ancient" ? B.GIANT_LOG : B.WOOD;

  const leaf =
    type === "cherry" ? B.CHERRY_LEAF :
    type === "birch" ? B.BIRCH_LEAF :
    type === "ancient" ? B.GIANT_LEAF :
    type === "autumn" ?
      [B.RED_LEAF, B.ORANGE_LEAF, B.YELLOW_LEAF][
        Math.floor(hash(x, z, 7) * 3)
      ] :
    B.LEAVES;

  return {
    x, z, type, log, leaf,
    ground: height(x, z),
    trunk: type === "ancient" ? 13 : 5 + Math.floor(hash(x, z, 9) * 3)
  };
}

function treeBlock(x, y, z) {
  for (
    let tx = Math.ceil((x - 8) / 10) * 10;
    tx <= x + 8;
    tx += 10
  ) {
    for (
      let tz = Math.ceil((z - 8) / 10) * 10;
      tz <= z + 8;
      tz += 10
    ) {
      const tree = treeAt(tx, tz);
      if (!tree) continue;

      const dx = Math.abs(x - tx);
      const dz = Math.abs(z - tz);
      const top = tree.ground + tree.trunk;
      const dy = y - top;

      if (
        dx <= (tree.type === "ancient" ? 1 : 0) &&
        dz <= (tree.type === "ancient" ? 1 : 0) &&
        y > tree.ground && y <= top
      ) return tree.log;

      const radius = tree.type === "ancient" ? 7 :
        tree.type === "cherry" ? 4 : 3;

      if (
        dy >= -2 && dy <= 3 &&
        dx <= radius && dz <= radius &&
        dx * dx + dz * dz + dy * dy < radius * radius + 3 &&
        hash(x + y, z, 11) > .14
      ) return tree.leaf;

      if (
        tree.type === "ancient" &&
        dy < -2 && dy >= -9 &&
        dx >= 4 && dz >= 4 &&
        dx <= 7 && dz <= 7 &&
        hash(x, z, 31) > .84
      ) return tree.leaf;
    }
  }

  return B.AIR;
}

const houses = [[35,22],[49,22],[35,36],[49,36]];

function structure(x, y, z) {
  for (const [cx, cz] of houses) {
    if (Math.abs(x - cx) > 3 || Math.abs(z - cz) > 3) {
      continue;
    }

    const wall =
      Math.abs(x - cx) === 3 ||
      Math.abs(z - cz) === 3;

    if (x === cx && z === cz - 3 && (y === 6 || y === 7)) {
      return B.AIR;
    }

    if (wall && y >= 6 && y <= 8) return B.PLANKS;
    if (y === 9) return B.WOOD;

    if (x === cx + 1 && z === cz + 1 && y === 6) {
      return B.CHEST;
    }
  }

  if (x >= 38 && x <= 45 && z >= 29 && z <= 33) {
    if (y === 6) return B.FARMLAND;
    if (y === 7) return B.CROPS;
  }

  return null;
}

function natural(x, y, z) {
  if (y <= MIN_Y) return B.BEDROCK;
  if (y > MAX_Y) return B.AIR;

  const building = structure(x, y, z);
  if (building !== null) return building;

  const h = height(x, z);
  const type = biome(x, z);

  if (y > h) {
    const tree = treeBlock(x, y, z);
    if (tree !== B.AIR) return tree;

    if (
      y === h + 1 &&
      type !== "Desert" &&
      h > 2 &&
      hash(x, z, 63) > .74
    ) return B.TALL_GRASS;

    return y <= 1 ? B.WATER : B.AIR;
  }

  if (y === h) {
    if (type === "Desert") return B.SAND;
    if (type === "Mountains" && h > 18) return B.STONE;
    return B.GRASS;
  }

  if (y >= h - 3) {
    return type === "Desert" ? B.SAND : B.DIRT;
  }

  const cave =
    Math.sin(x * .13 + y * .15) +
    Math.cos(z * .14 - y * .1) +
    Math.sin((x + z + y) * .09);

  if (y < -5 && cave > 2.46) return B.AIR;

  const ore = hash(x * 7 + y * 13, z * 9 + y * 17, 4);

  if (y < -23 && ore > .994) return B.DIAMOND;
  if (y < -13 && ore > .988) return B.GOLD;
  if (y < 8 && ore > .979) return B.IRON;
  if (y < 18 && ore > .964) return B.COAL;

  return B.STONE;
}

const key = (x, y, z) => `${x},${y},${z}`;

function block(x, y, z) {
  if (y <= MIN_Y) return B.BEDROCK;
  if (y > MAX_Y) return B.AIR;

  const k = key(x, y, z);

  return edits.has(k) ? edits.get(k) : natural(x, y, z);
}

/* TEXTURES */

const colors = [
  0x000000,0x65b744,0x8c6040,0x8b8d90,
  0xe5ce90,0x885d37,0x41964f,0x303038,
  0xa9dbea,0x287fc0,0x36864b,0xb88950,
  0xa8dbec,0xa47941,0x55585b,0x765038,
  0x88b942,0x8c8e92,0x9f8275,0xdfbe59,
  0x46e1de,0xf27426,0xa09b91,0x77797d,
  0x22202c,0xe9442c,0xff9540,0xa55f4f,
  0xe7f5fa,0x9a7e71,0xb97845,0xb9c7bd,
  0x9a7046,0xe0d7c6,0x71b96a,0x956b60,
  0xeaa4ce,0xb44735,0xdf8436,0xe9bd4b,
  0x534036,0x4e765d,0x4c963e
];

const atlas = document.createElement("canvas");
atlas.width = 128;
atlas.height = Math.ceil(colors.length / 8) * 16;

const ctx = atlas.getContext("2d");

for (let id = 0; id < colors.length; id++) {
  const image = ctx.createImageData(16, 16);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let color = colors[id];
      let shade = (hash(x, y, id) - .5) * 48;

      if (id === B.GRASS && y < 3) color = 0x59bb43;
      if (id === B.WOOD && x % 4 === 0) shade -= 35;
      if (id === B.PLANKS && y % 5 === 0) shade -= 30;
      if (id === B.TNT && y > 5 && y < 10) color = 0xf6eee2;

      const i = (y * 16 + x) * 4;

      image.data[i] =
        THREE.MathUtils.clamp(((color >> 16) & 255) + shade, 0, 255);

      image.data[i + 1] =
        THREE.MathUtils.clamp(((color >> 8) & 255) + shade, 0, 255);

      image.data[i + 2] =
        THREE.MathUtils.clamp((color & 255) + shade, 0, 255);

      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(
    image,
    (id % 8) * 16,
    Math.floor(id / 8) * 16
  );
}

const texture = new THREE.CanvasTexture(atlas);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
texture.colorSpace = THREE.SRGBColorSpace;

const terrainMaterial = new THREE.MeshLambertMaterial({
  map: texture,
  vertexColors: true,
  side: THREE.DoubleSide
});

const fluidMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  vertexColors: true,
  transparent: true,
  opacity: .7,
  depthWrite: false,
  side: THREE.DoubleSide
});

function uvFor(id) {
  const x = (id % 8) * 16;
  const y = Math.floor(id / 8) * 16;

  const l = (x + .3) / atlas.width;
  const r = (x + 15.7) / atlas.width;
  const t = 1 - (y + .3) / atlas.height;
  const b = 1 - (y + 15.7) / atlas.height;

  return [[l,b],[l,t],[r,t],[r,b]];
}

const faces = [
  [[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]],.83],
  [[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]],.81],
  [[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]],1],
  [[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]],.65],
  [[0,0,1],[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]],.93],
  [[0,0,-1],[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]],.75]
];

/* CHUNKS */

const chunks = new Map();
const chunkQueue = [];
const queued = new Set();
const editedTop = new Map();

for (const [k] of edits) {
  const [x, y, z] = k.split(",").map(Number);

  if ([x,y,z].every(Number.isFinite)) {
    const column = `${x},${z}`;
    editedTop.set(column, Math.max(editedTop.get(column) ?? MIN_Y, y));
  }
}

const meshData = () => [[],[],[],[],[]];

function quad(out, id, points, normal, shade) {
  const [p,n,u,c,indices] = out;
  const start = p.length / 3;
  const uv = uvFor(id);

  for (let i = 0; i < 4; i++) {
    p.push(...points[i]);
    n.push(...normal);
    u.push(...uv[i]);
    c.push(shade,shade,shade);
  }

  indices.push(
    start,start+1,start+2,
    start,start+2,start+3
  );
}

function box(out, id, x, y, z, w=1, h=1, d=1) {
  for (const [normal, vertices, shade] of faces) {
    quad(
      out,id,
      vertices.map(v => [
        x+v[0]*w,
        y+v[1]*h,
        z+v[2]*d
      ]),
      normal,shade
    );
  }
}

function cropAge(x,y,z) {
  return cropAges.get(key(x,y,z)) ??
    (edits.has(key(x,y,z)) ? 0 : 3);
}

function special(out,id,x,y,z) {
  if (id === B.FENCE) {
    box(out,B.FENCE,x,y,z,.25,1.2,.25);

    for (const [dx,dz] of [
      [1,0],[-1,0],[0,1],[0,-1]
    ]) {
      if (![B.FENCE,B.PLANKS,B.STONE].includes(
        block(x+dx,y,z+dz)
      )) continue;

      for (const offset of [-.22,.21]) {
        box(
          out,B.FENCE,
          x+dx*.25,y+offset,z+dz*.25,
          dx ? .5 : .13,
          .13,
          dz ? .5 : .13
        );
      }
    }
    return true;
  }

  if (id === B.CROPS) {
    const h = [.22,.43,.69,.95][cropAge(x,y,z)] || .22;

    for (const dx of [-.18,.18]) {
      for (const dz of [-.18,.18]) {
        box(out,id,x+dx,y-.5+h/2,z+dz,.1,h,.1);
      }
    }

    return true;
  }

  if (id === B.TALL_GRASS) {
    box(out,id,x-.15,y-.10,z,.10,.75,.10);
    box(out,id,x+.15,y-.10,z,.10,.75,.10);
    return true;
  }

  return false;
}

function createMesh(out,material) {
  const [p,n,u,c,indices] = out;
  if (!indices.length) return null;

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(p,3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(n,3)
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(u,2)
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(c,3)
  );

  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry,material);
  scene.add(mesh);
  return mesh;
}

function buildChunk(cx,cz) {
  const opaque = meshData();
  const fluids = meshData();
  const cache = new Map();

  function get(x,y,z) {
    const k = key(x,y,z);
    if (!cache.has(k)) cache.set(k,block(x,y,z));
    return cache.get(k);
  }

  for (let x=cx*SIZE; x<(cx+1)*SIZE; x++) {
    for (let z=cz*SIZE; z<(cz+1)*SIZE; z++) {
      const top = Math.min(
        MAX_Y,
        Math.max(
          height(x,z)+20,
          editedTop.get(`${x},${z}`) ?? MIN_Y,
          2
        )
      );

      for (let y=MIN_Y+1; y<=top; y++) {
        const id = get(x,y,z);
        if (id === B.AIR) continue;

        if (special(opaque,id,x,y,z)) continue;

        const liquid = [B.WATER,B.LAVA,B.FIRE].includes(id);
        const out = liquid ? fluids : opaque;

        for (const [normal,vertices,shade] of faces) {
          const [dx,dy,dz] = normal;
          const neighbor = get(x+dx,y+dy,z+dz);

          if (liquid) {
            if (neighbor === id) continue;
            if (![B.AIR,B.WATER,B.LAVA,B.FIRE].includes(neighbor)) {
              continue;
            }
          } else if (![B.AIR,B.WATER,B.LAVA,B.FIRE,B.CROPS,B.TALL_GRASS]
                     .includes(neighbor)) {
            continue;
          }

          quad(
            out,id,
            vertices.map(v=>[x+v[0],y+v[1],z+v[2]]),
            normal,shade
          );
        }
      }
    }
  }

  return [
    createMesh(opaque,terrainMaterial),
    createMesh(fluids,fluidMaterial)
  ];
}

const chunkKey = (x,z) => `${x},${z}`;

function enqueue(cx,cz) {
  const k = chunkKey(cx,cz);
  if (queued.has(k)) return;
  queued.add(k);
  chunkQueue.push([cx,cz]);
}

function removeChunk(k) {
  const meshes = chunks.get(k);
  if (!meshes) return;

  for (const mesh of meshes) {
    if (!mesh) continue;
    scene.remove(mesh);
    mesh.geometry.dispose();
  }

  chunks.delete(k);
}

function rebuild(x,z) {
  const cx = Math.floor(x/SIZE);
  const cz = Math.floor(z/SIZE);

  enqueue(cx,cz);

  const mx = ((x%SIZE)+SIZE)%SIZE;
  const mz = ((z%SIZE)+SIZE)%SIZE;

  if (mx === 0) enqueue(cx-1,cz);
  if (mx === SIZE-1) enqueue(cx+1,cz);
  if (mz === 0) enqueue(cx,cz-1);
  if (mz === SIZE-1) enqueue(cx,cz+1);
}

let centerKey = "";

function stream() {
  const cx = Math.floor(player.x/SIZE);
  const cz = Math.floor(player.z/SIZE);
  const center = chunkKey(cx,cz);

  if (center === centerKey) return;
  centerKey = center;

  const wanted = new Set();

  for (let x=cx-VIEW; x<=cx+VIEW; x++) {
    for (let z=cz-VIEW; z<=cz+VIEW; z++) {
      const k = chunkKey(x,z);
      wanted.add(k);
      if (!chunks.has(k)) enqueue(x,z);
    }
  }

  for (const k of [...chunks.keys()]) {
    if (!wanted.has(k)) removeChunk(k);
  }
}

function processChunk() {
  if (!chunkQueue.length) return;

  const [cx,cz] = chunkQueue.shift();
  const k = chunkKey(cx,cz);
  queued.delete(k);

  if (
    Math.abs(cx-Math.floor(player.x/SIZE))>VIEW ||
    Math.abs(cz-Math.floor(player.z/SIZE))>VIEW
  ) return;

  removeChunk(k);
  chunks.set(k,buildChunk(cx,cz));
}

/* BLOCK PHYSICS */

const jobs = [];
const jobKeys = new Set();

function schedule(x,y,z,delay=.15) {
  if (y<=MIN_Y || y>MAX_Y || jobs.length>1400) return;
  const k = key(x,y,z);
  if (jobKeys.has(k)) return;

  jobKeys.add(k);
  jobs.push({x,y,z,k,at:gameTime+delay});
}

function changeBlock(x,y,z,id,physics=true) {
  if (y<=MIN_Y || y>MAX_Y) return false;
  if (block(x,y,z)===id) return false;

  edits.set(key(x,y,z),id);

  const k = `${x},${z}`;
  editedTop.set(k,Math.max(editedTop.get(k)??MIN_Y,y));

  if (id!==B.CROPS) cropAges.delete(key(x,y,z));
  rebuild(x,z);

  if (physics) {
    schedule(x,y,z);
    schedule(x,y+1,z);

    for (const [dx,dz] of [
      [1,0],[-1,0],[0,1],[0,-1]
    ]) {
      schedule(x+dx,y,z+dz);
    }
  }

  return true;
}

function adjacent(x,y,z,id) {
  return [
    [x+1,y,z],[x-1,y,z],
    [x,y+1,z],[x,y-1,z],
    [x,y,z+1],[x,y,z-1]
  ].some(([a,b,c])=>block(a,b,c)===id);
}

function explode(x,y,z,radius=3) {
  for (let dx=-radius; dx<=radius; dx++) {
    for (let dy=-radius; dy<=radius; dy++) {
      for (let dz=-radius; dz<=radius; dz++) {
        if (dx*dx+dy*dy+dz*dz>radius*radius) continue;

        const a=x+dx,b=y+dy,c=z+dz;
        const id=block(a,b,c);

        if (![B.AIR,B.BEDROCK,B.OBSIDIAN].includes(id)) {
          changeBlock(a,b,c,B.AIR,false);
        }
      }
    }
  }

  if (
    !creative &&
    Math.hypot(player.x-x,player.y-y,player.z-z)<radius+1
  ) {
    health=Math.max(0,health-8);
  }

  notify("TNT exploded!");
}

function react(x,y,z) {
  const id=block(x,y,z);

  if ([B.SAND,B.GRAVEL].includes(id)) {
    if (
      y>MIN_Y+1 &&
      [B.AIR,B.WATER].includes(block(x,y-1,z))
    ) {
      const previous=block(x,y-1,z);
      changeBlock(x,y,z,previous,false);
      changeBlock(x,y-1,z,id,false);
      schedule(x,y-1,z,.12);
      schedule(x,y+1,z,.12);
    }
    return;
  }

  if (id===B.LAVA && adjacent(x,y,z,B.WATER)) {
    changeBlock(x,y,z,B.OBSIDIAN);
    return;
  }

  if (id===B.ICE && adjacent(x,y,z,B.LAVA)) {
    changeBlock(x,y,z,B.WATER);
    return;
  }

  if ([B.WATER,B.LAVA].includes(id)) {
    if (block(x,y-1,z)===B.AIR) {
      changeBlock(x,y-1,z,id);
    } else if (Math.random()<(id===B.WATER?.45:.12)) {
      const directions=[[1,0],[-1,0],[0,1],[0,-1]];
      const [dx,dz]=directions[Math.floor(Math.random()*4)];

      if (
        Math.abs(x-player.x)<15 &&
        Math.abs(z-player.z)<15 &&
        block(x+dx,y,z+dz)===B.AIR
      ) {
        changeBlock(x+dx,y,z+dz,id);
      }
    }
    return;
  }

  if (id===B.TNT && (
    adjacent(x,y,z,B.FIRE) ||
    adjacent(x,y,z,B.LAVA)
  )) {
    explode(x,y,z);
  }
}

function updatePhysics() {
  const count=jobs.length;
  let budget=24;

  for (let i=0;i<count && budget>0;i++) {
    const j=jobs.shift();
    if (!j) break;

    if (j.at>gameTime) {
      jobs.push(j);
      continue;
    }

    jobKeys.delete(j.k);
    react(j.x,j.y,j.z);
    budget--;
  }
}

/* CROPS */

function plant(x,y,z) {
  if (
    block(x,y,z)!==B.FARMLAND ||
    block(x,y+1,z)!==B.AIR
  ) return;

  if (!creative && !take("seeds")) {
    notify("Wheat seeds required");
    return;
  }

  changeBlock(x,y+1,z,B.CROPS);
  cropAges.set(key(x,y+1,z),0);
  rebuild(x,z);
  notify("Seeds planted!");
}

function harvest(x,y,z) {
  if (cropAge(x,y,z)>=3) {
    add("wheat",2);
    add("seeds",2);
    notify("Harvested wheat!");
  } else {
    add("seeds");
    notify("Crop harvested early");
  }

  changeBlock(x,y,z,B.AIR);
}

let growTimer=0;

function updateCrops(dt) {
  growTimer+=dt;
  if (growTimer<5) return;
  growTimer=0;

  let count=0;

  for (const [k,age] of cropAges) {
    if (age>=3) continue;

    const [x,y,z]=k.split(",").map(Number);

    if (block(x,y,z)!==B.CROPS) {
      cropAges.delete(k);
      continue;
    }

    if (
      block(x,y-1,z)===B.FARMLAND &&
      Math.random()<.65
    ) {
      cropAges.set(k,age+1);
      rebuild(x,z);
      if (++count>=10) break;
    }
  }
}

/* CHARACTER MATERIALS */

const materials=new Map();

function mat(color) {
  if (!materials.has(color)) {
    materials.set(
      color,
      new THREE.MeshLambertMaterial({color})
    );
  }
  return materials.get(color);
}

function cube(group,w,h,d,material,x,y,z) {
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    material
  );

  mesh.position.set(x,y,z);
  group.add(mesh);
  return mesh;
}

function pixelFace(type) {
  const canvas=document.createElement("canvas");
  canvas.width=32;
  canvas.height=32;

  const c=canvas.getContext("2d");
  const r=(color,x,y,w,h)=>{
    c.fillStyle=color;
    c.fillRect(x,y,w,h);
  };

  const skinColor=
    type==="pig"?"#e9a6af":
    type==="cow"?"#b69a86":
    type==="horse"?"#a87b57":
    type==="sheep"?"#e3ddd2":
    type==="zombie"?"#689b62":
    "#d3a37e";

  r(skinColor,0,0,32,32);
  r("#614634",0,0,32,7);
  r("#f4eadd",5,13,8,6);
  r("#f4eadd",19,13,8,6);
  r("#397351",9,14,3,4);
  r("#397351",23,14,3,4);
  r("#1b2620",10,15,2,3);
  r("#1b2620",24,15,2,3);
  r("#a7785b",12,22,9,5);
  r("#614634",12,29,9,2);

  if (type==="pig" || type==="cow") {
    r("#edabb4",7,21,18,10);
    r("#805d60",10,25,4,3);
    r("#805d60",19,25,4,3);
  }

  const t=new THREE.CanvasTexture(canvas);
  t.magFilter=THREE.NearestFilter;
  t.minFilter=THREE.NearestFilter;
  t.colorSpace=THREE.SRGBColorSpace;

  return new THREE.MeshLambertMaterial({map:t});
}

/* VISIBLE PLAYER */

const playerModel=new THREE.Group();

const skinMat=mat(0xd3a37e);
const shirt=mat(0x269dbf);
const trousers=mat(0x344f9f);

cube(playerModel,.82,.86,.43,shirt,0,1.12,0);

const playerHead=new THREE.Mesh(
  new THREE.BoxGeometry(.67,.67,.67),
  [
    skinMat,skinMat,skinMat,
    skinMat,skinMat,pixelFace("player")
  ]
);

playerHead.position.set(0,1.87,0);
playerModel.add(playerHead);

function limb(x,y,material) {
  const group=new THREE.Group();
  group.position.set(x,y,0);

  cube(group,.27,.73,.33,material,0,-.365,0);
  playerModel.add(group);

  return group;
}

const arms=[
  limb(-.55,1.48,shirt),
  limb(.55,1.48,shirt)
];

const legs=[
  limb(-.2,.7,trousers),
  limb(.2,.7,trousers)
];

scene.add(playerModel);

/* VILLAGERS */

const villagers=[];
let villagersSpawned=false;

function villager(x,z,job,color) {
  const group=new THREE.Group();
  const robe=mat(color);

  cube(group,.7,.9,.45,robe,0,1,0);

  const head=new THREE.Mesh(
    new THREE.BoxGeometry(.62,.62,.62),
    [
      skinMat,skinMat,skinMat,
      skinMat,skinMat,pixelFace("villager")
    ]
  );

  head.position.set(0,1.7,0);
  group.add(head);

  cube(group,.15,.22,.18,skinMat,0,1.55,-.41);
  cube(group,.8,.24,.28,robe,0,1.1,-.33);

  for (const dx of [-.17,.17]) {
    cube(group,.2,.5,.2,mat(0x40352f),dx,.25,0);
  }

  group.position.set(x,5.5,z);
  group.userData.kind="villager";
  scene.add(group);

  villagers.push({
    group,job,
    angle:Math.random()*Math.PI*2,
    timer:0
  });
}

function spawnVillagers() {
  if (villagersSpawned) return;
  villagersSpawned=true;

  villager(37,26,"Farmer",0x9a7645);
  villager(47,26,"Librarian",0xc5bca8);
  villager(37,39,"Blacksmith",0x657481);
  villager(47,39,"Villager",0x81543e);
}

function updateVillagers(dt) {
  for (const v of villagers) {
    v.timer-=dt;

    if (v.timer<=0) {
      v.timer=2+Math.random()*3;
      v.angle+=(Math.random()-.5)*2;
    }

    const x=v.group.position.x+Math.sin(v.angle)*dt*.35;
    const z=v.group.position.z+Math.cos(v.angle)*dt*.35;

    if (
      x<30 || x>55 || z<16 || z>42 ||
      solid(block(Math.round(x),6,Math.round(z)))
    ) {
      v.angle+=Math.PI;
    } else {
      v.group.position.x=x;
      v.group.position.z=z;
    }

    v.group.rotation.y=v.angle;
  }
}

/* ANIMALS */

const config={
  horse: {
    color:0x916440, w:.9,h:.9,d:1.6,
    legs:.85,speed:9,jump:9,seat:1.6
  },
  cow: {
    color:0x725544,w:1,h:.88,d:1.45,
    legs:.6,speed:5,jump:6,seat:1.4
  },
  sheep: {
    color:0xe6e1d7,w:.95,h:.83,d:1.3,
    legs:.5,speed:5.5,jump:6.5,seat:1.3
  },
  pig: {
    color:0xe69fa7,w:.85,h:.68,d:1.2,
    legs:.4,speed:4.5,jump:5.5,seat:1.1
  }
};

const animals=[];
let animalsSpawned=false;

function animal(x,z,type) {
  const cfg=config[type];
  const group=new THREE.Group();
  const body=mat(cfg.color);

  const bodyY=cfg.legs+cfg.h/2;

  cube(group,cfg.w,cfg.h,cfg.d,body,0,bodyY,0);

  const head=new THREE.Mesh(
    new THREE.BoxGeometry(.62,.65,.6),
    [body,body,body,body,body,pixelFace(type)]
  );

  head.position.set(
    0,
    cfg.legs+cfg.h+.16,
    -cfg.d*.45
  );

  group.add(head);

  for (const side of [-1,1]) {
    cube(
      group,.18,.25,.16,body,
      side*.24,cfg.legs+cfg.h+.54,-cfg.d*.45
    );
  }

  if (type==="horse") {
    cube(
      group,.7,.12,.7,mat(0x62402a),
      0,bodyY+cfg.h/2+.03,0
    );
  }

  const limbs=[];

  for (const sx of [-1,1]) {
    for (const sz of [-1,1]) {
      const pivot=new THREE.Group();

      pivot.position.set(
        sx*cfg.w*.31,
        cfg.legs,
        sz*cfg.d*.31
      );

      cube(
        pivot,.2,cfg.legs,.2,body,
        0,-cfg.legs/2,0
      );

      group.add(pivot);
      limbs.push({pivot,sx,sz});
    }
  }

  group.position.set(
    x,
    height(Math.round(x),Math.round(z))+.5,
    z
  );

  group.userData.kind="animal";
  scene.add(group);

  const a={
    group,type,cfg,limbs,
    hp:5,walk:0,moving:false,
    angle:Math.random()*6.28,
    timer:0,
    x0:x,z0:z,
    vy:0,grounded:true
  };

  animals.push(a);
  return a;
}

function spawnAnimals() {
  if (animalsSpawned) return;
  animalsSpawned=true;

  animal(7,8,"horse");
  animal(-8,8,"cow");
  animal(8,-9,"pig");
  animal(-9,-8,"sheep");
  animal(13,5,"horse");
}

function animateAnimal(a,dt) {
  if (a.moving) a.walk+=dt*9;

  for (const leg of a.limbs) {
    const phase=leg.sx===leg.sz ? 0 : Math.PI;

    const target=a.moving
      ? Math.sin(a.walk+phase)*.43
      : 0;

    leg.pivot.rotation.x+=
      (target-leg.pivot.rotation.x)*Math.min(1,dt*12);
  }

  a.group.rotation.y=a.angle;
}

function updateAnimals(dt) {
  for (const a of animals) {
    if (a===mounted) {
      animateAnimal(a,dt);
      continue;
    }

    a.timer-=dt;

    if (a.timer<=0) {
      a.timer=2+Math.random()*3;
      a.angle+=(Math.random()-.5)*2;
    }

    const x=a.group.position.x+Math.sin(a.angle)*dt*.35;
    const z=a.group.position.z+Math.cos(a.angle)*dt*.35;
    const ground=height(Math.round(x),Math.round(z))+.5;

    a.moving=false;

    if (
      Math.abs(x-a.x0)<9 &&
      Math.abs(z-a.z0)<9 &&
      Math.abs(ground-a.group.position.y)<1 &&
      !solid(block(Math.round(x),Math.round(ground+.8),Math.round(z)))
    ) {
      a.group.position.set(x,ground,z);
      a.moving=true;
    } else {
      a.angle+=Math.PI;
    }

    animateAnimal(a,dt);
  }
}

/* PLAYER PHYSICS */

const player={
  x:0,
  y:height(0,0)+.51,
  z:0,
  vx:0,vy:0,vz:0,
  yaw:0,pitch:0,
  grounded:false
};

if (
  Array.isArray(old.position) &&
  old.position.length===3 &&
  old.position.every(Number.isFinite)
) {
  [player.x,player.y,player.z]=old.position;
}

const keys={};

/* =========================================
   FIX 1 — FLYING SYSTEM
   ========================================= */

function setFlying(enabled) {
  if (enabled && mounted) {
    dismount();
  }

  flying=enabled;
  player.vy=0;
  player.grounded=false;

  flyButton.textContent=flying ? "✈ FLY OFF" : "✈ FLY ON";
  flyButton.classList.toggle("enabled",flying);

  flightInstructions.hidden=!flying;

  notify(
    flying
      ? "Flying enabled — Space UP, X DOWN, WASD MOVE"
      : "Flying disabled — gravity restored"
  );
}

function toggleFlying() {
  setFlying(!flying);
}

function direction() {
  const fx=-Math.sin(player.yaw);
  const fz=-Math.cos(player.yaw);

  const rx=Math.cos(player.yaw);
  const rz=-Math.sin(player.yaw);

  let x=0,z=0;

  if (keys.KeyW) {x+=fx;z+=fz;}
  if (keys.KeyS) {x-=fx;z-=fz;}
  if (keys.KeyA) {x-=rx;z-=rz;}
  if (keys.KeyD) {x+=rx;z+=rz;}

  const length=Math.hypot(x,z);

  return length
    ? {x:x/length,z:z/length,moving:true}
    : {x:0,z:0,moving:false};
}

function collision(x,y,z) {
  const eps=.001;

  for (
    let a=Math.floor(x-.3+.5+eps);
    a<=Math.floor(x+.3+.5-eps);
    a++
  ) {
    for (
      let b=Math.floor(y+.5+eps);
      b<=Math.floor(y+1.8+.5-eps);
      b++
    ) {
      for (
        let c=Math.floor(z-.3+.5+eps);
        c<=Math.floor(z+.3+.5-eps);
        c++
      ) {
        if (solid(block(a,b,c))) return true;
      }
    }
  }

  return false;
}

function moveAxis(axis,distance,ignoreCollision=false) {
  if (ignoreCollision) {
    player[axis]+=distance;
    return true;
  }

  const steps=Math.ceil(Math.abs(distance)/.08);
  if (!steps) return true;

  const step=distance/steps;

  for (let i=0;i<steps;i++) {
    const x=player.x+(axis==="x"?step:0);
    const y=player.y+(axis==="y"?step:0);
    const z=player.z+(axis==="z"?step:0);

    if (collision(x,y,z)) return false;
    player[axis]+=step;
  }

  return true;
}

/* =========================================
   FIX 2 — GET OFF ANY ANIMAL
   ========================================= */

function mount(a) {
  if (mounted) return;

  if (flying) setFlying(false);

  mounted=a;
  a.vy=0;
  a.grounded=true;

  dismountButton.hidden=false;
  $("riding").hidden=false;

  notify(
    `Riding ${a.type} — PRESS SHIFT OR CLICK DISMOUNT`
  );
}

function dismount() {
  if (!mounted) return;

  const a=mounted;

  // Stop riding before selecting the new player position.
  mounted=null;

  const candidates=[
    [1.8,0],[-1.8,0],
    [0,1.8],[0,-1.8],
    [2.5,0],[-2.5,0],
    [0,2.5],[0,-2.5]
  ];

  let placed=false;

  for (const [dx,dz] of candidates) {
    const x=a.group.position.x+dx;
    const z=a.group.position.z+dz;

    const ground=height(
      Math.round(x),
      Math.round(z)
    )+.51;

    if (
      Math.abs(ground-a.group.position.y)>2
    ) continue;

    if (!collision(x,ground,z)) {
      player.x=x;
      player.y=ground;
      player.z=z;
      placed=true;
      break;
    }
  }

  if (!placed) {
    player.x=a.group.position.x;
    player.z=a.group.position.z;
    player.y=a.group.position.y+a.cfg.seat+1;
  }

  player.vx=0;
  player.vy=0;
  player.vz=0;
  player.grounded=false;

  // Release all movement keys to stop unwanted jumping.
  keys.Space=false;
  keys.ShiftLeft=false;
  keys.ShiftRight=false;

  dismountButton.hidden=true;
  $("riding").hidden=true;

  notify(`Dismounted ${a.type}`);
}

function updateRiding(dt) {
  const a=mounted;
  if (!a) return;

  const m=direction();
  a.moving=m.moving;

  if (m.moving) {
    const speed=a.cfg.speed*
      (keys.ControlLeft||keys.ControlRight ? 1.2 : 1);

    const x=a.group.position.x+m.x*speed*dt;
    const z=a.group.position.z+m.z*speed*dt;
    const ground=height(Math.round(x),Math.round(z))+.5;

    if (
      Math.abs(ground-a.group.position.y)<1.1 &&
      !solid(block(Math.round(x),Math.round(ground+.8),Math.round(z)))
    ) {
      a.group.position.x=x;
      a.group.position.z=z;
    }

    a.angle=Math.atan2(-m.x,-m.z);
  }

  if (keys.Space && a.grounded) {
    a.vy=a.cfg.jump;
    a.grounded=false;
  }

  if (!a.grounded) {
    a.vy-=24*dt;
    a.group.position.y+=a.vy*dt;
  }

  const ground=height(
    Math.round(a.group.position.x),
    Math.round(a.group.position.z)
  )+.5;

  if (a.group.position.y<=ground) {
    a.group.position.y=ground;
    a.vy=0;
    a.grounded=true;
  }

  player.x=a.group.position.x;
  player.z=a.group.position.z;
  player.y=a.group.position.y+a.cfg.seat-1.2;

  player.vx=0;
  player.vy=0;
  player.vz=0;
}

let hazardTimer=0;

function updatePlayer(dt) {
  if (mounted) {
    updateRiding(dt);
    return;
  }

  const m=direction();

  /* FLY MODE: NO GRAVITY, DIRECT VERTICAL CONTROL */

  if (flying) {
    const speed=
      keys.ControlLeft||keys.ControlRight ? 16 : 10;

    player.vx=m.x*speed;
    player.vz=m.z*speed;

    let vertical=0;

    if (keys.Space) vertical+=1;
    if (keys.KeyX) vertical-=1;

    player.vy=vertical*speed;

    // Flying moves freely, independent of ground collision.
    moveAxis("x",player.vx*dt,true);
    moveAxis("y",player.vy*dt,true);
    moveAxis("z",player.vz*dt,true);

    player.y=THREE.MathUtils.clamp(
      player.y,
      MIN_Y+2,
      MAX_Y+25
    );

    return;
  }

  /* NORMAL WALKING MODE */

  const sneaking=
    keys.ShiftLeft||keys.ShiftRight;

  const sprinting=
    keys.ControlLeft||keys.ControlRight;

  const speed=sneaking ? 2.3 : sprinting ? 9 : 6;

  player.vx+=m.x*40*dt;
  player.vz+=m.z*40*dt;

  const friction=block(
    Math.round(player.x),
    Math.round(player.y-.52),
    Math.round(player.z)
  )===B.ICE ? 2 : 12;

  player.vx*=Math.exp(-friction*dt);
  player.vz*=Math.exp(-friction*dt);

  const horizontal=Math.hypot(player.vx,player.vz);

  if (horizontal>speed) {
    player.vx*=speed/horizontal;
    player.vz*=speed/horizontal;
  }

  const inWater=block(
    Math.round(player.x),
    Math.round(player.y+.7),
    Math.round(player.z)
  )===B.WATER;

  player.vy=Math.max(
    -25,
    player.vy-(inWater?7:24)*dt
  );

  if (inWater&&keys.Space) {
    player.vy=3.4;
  } else if (keys.Space&&player.grounded) {
    player.vy=8.5;
    player.grounded=false;
  }

  if (!moveAxis("x",player.vx*dt)) player.vx=0;
  if (!moveAxis("z",player.vz*dt)) player.vz=0;

  const falling=player.vy;

  if (!moveAxis("y",player.vy*dt)) {
    if (
      !creative &&
      !inWater &&
      falling<-12
    ) {
      health=Math.max(
        0,
        health-Math.ceil((-falling-10)/3)
      );

      notify("Fall damage!");
    }

    player.grounded=player.vy<0;
    player.vy=0;
  } else {
    player.grounded=false;
  }

  const hazard=block(
    Math.round(player.x),
    Math.round(player.y+.6),
    Math.round(player.z)
  );

  if (
    !creative &&
    (hazard===B.LAVA||hazard===B.FIRE)
  ) {
    hazardTimer+=dt;

    if (hazardTimer>=1) {
      health=Math.max(0,health-3);
      hazardTimer=0;
    }
  } else {
    hazardTimer=0;
  }

  if (health<=0||player.y<MIN_Y-5) {
    player.x=0;
    player.z=0;
    player.y=height(0,0)+.51;
    player.vx=player.vy=player.vz=0;

    health=20;
    hunger=Math.max(10,hunger);
    notify("Respawned");
  }
}

/* CAMERA */

function lookVector() {
  return new THREE.Vector3(
    -Math.sin(player.yaw)*Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw)*Math.cos(player.pitch)
  );
}

function updateCamera() {
  const eye=new THREE.Vector3(
    player.x,
    mounted
      ?mounted.group.position.y+mounted.cfg.seat+1
      :player.y+1.62,
    player.z
  );

  const forward=lookVector();

  if (cameraMode===0) {
    camera.position.copy(eye);
    camera.rotation.set(
      player.pitch,player.yaw,0,"YXZ"
    );
    return;
  }

  const distance=cameraMode===1 ? -4 : 4;
  const desired=eye.clone().addScaledVector(
    forward,distance
  );

  camera.position.copy(desired);
  camera.lookAt(eye);
}

function animatePlayer() {
  playerModel.visible=cameraMode!==0;

  playerModel.position.set(
    player.x,player.y,player.z
  );

  playerModel.rotation.y=player.yaw;

  const moving=Math.hypot(player.vx,player.vz)>.2;
  const swing=moving ? Math.sin(gameTime*10)*.6 : 0;

  arms[0].rotation.x=swing;
  arms[1].rotation.x=-swing;
  legs[0].rotation.x=-swing;
  legs[1].rotation.x=swing;
}

/* CLICKABLE ACTION BUTTONS */

const actions=document.createElement("div");
actions.id="gameActions";

const flyButton=document.createElement("button");
flyButton.id="flyButton";
flyButton.textContent="✈ FLY ON";

const dismountButton=document.createElement("button");
dismountButton.id="dismountButton";
dismountButton.textContent="🐎 DISMOUNT";
dismountButton.hidden=true;

const flightInstructions=document.createElement("div");
flightInstructions.id="flightInstructions";
flightInstructions.textContent=
  "FLYING: Space ↑ | X ↓ | WASD Move";
flightInstructions.hidden=true;

actions.append(flyButton,dismountButton);
$("hud").append(actions,flightInstructions);

/*
  Clicking an in-game button releases pointer lock.
  Return to pointer lock afterward to continue looking.
*/

function restoreMouse() {
  if (!panel) {
    renderer.domElement.requestPointerLock().catch(()=>{});
  }
}

flyButton.addEventListener("click",e=>{
  e.stopPropagation();
  toggleFlying();
  restoreMouse();
});

dismountButton.addEventListener("click",e=>{
  e.stopPropagation();
  dismount();
  restoreMouse();
});

/* INVENTORY / CRAFTING */

function entry(title,detail,actions) {
  const div=document.createElement("div");
  div.className="entry";

  const info=document.createElement("div");
  info.className="info";

  const strong=document.createElement("strong");
  strong.textContent=title;

  const small=document.createElement("small");
  small.textContent=detail;

  info.append(strong,small);
  div.append(info);

  for (const [label,fn,disabled] of actions) {
    const button=document.createElement("button");
    button.textContent=label;
    button.disabled=!!disabled;
    button.onclick=fn;
    div.append(button);
  }

  $("entries").append(div);
}

function openPanel(type,chest="") {
  panel=type;
  chestKey=chest;

  $("panel").hidden=false;
  $("menu").hidden=true;

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  drawPanel();
}

function closePanel() {
  panel="";
  $("panel").hidden=true;
  restoreMouse();
}

$("close").onclick=closePanel;

function craft(output,count,ingredients) {
  const allowed=Object.entries(ingredients).every(
    ([id,n])=>(inventory[id]||0)>=n
  );

  if (!allowed) return;

  for (const [id,n] of Object.entries(ingredients)) {
    take(id,n);
  }

  add(output,count);
  drawPanel();
  notify(`Crafted ${nameOf(output)}`);
}

function recipeRows(list) {
  for (const [output,count,ingredients] of list) {
    const allowed=Object.entries(ingredients).every(
      ([id,n])=>(inventory[id]||0)>=n
    );

    const detail=Object.entries(ingredients)
      .map(([id,n])=>`${n} ${nameOf(asId(id))}`)
      .join(" + ");

    entry(
      `${iconOf(output)} ${nameOf(output)} ×${count}`,
      detail,
      [["CREATE",()=>craft(output,count,ingredients),!allowed]]
    );
  }
}

function drawPanel() {
  if (!panel) return;

  $("entries").replaceChildren();

  $("panelTitle").textContent={
    inventory:"🎒 INVENTORY",
    crafting:"🔨 CRAFTING",
    chemistry:"⚗️ CHEMISTRY",
    furnace:"🔥 FURNACE",
    chest:"📦 CHEST",
    trading:"💚 VILLAGER TRADING"
  }[panel] || "Inventory";

  $("panelHelp").textContent="Choose an item or action.";

  if (panel==="inventory") {
    for (const [raw,count] of Object.entries(inventory)) {
      if (count<=0) continue;

      const id=asId(raw);

      entry(
        `${iconOf(id)} ${nameOf(id)}`,
        `Quantity: ${count}`,
        [[
          "SELECT",
          ()=>{
            slots[selected]=id;
            closePanel();
          }
        ]]
      );
    }
  }

  if (panel==="crafting") recipeRows(recipes);
  if (panel==="chemistry") recipeRows(chemistry);
  if (panel==="furnace") recipeRows(smelting);

  if (panel==="trading") {
    recipeRows([
      ["emerald",1,{wheat:5}],
      [B.PLANKS,8,{emerald:1}]
    ]);
  }

  if (panel==="chest") {
    chests[chestKey] ||= {};
    const contents=chests[chestKey];

    for (const [id,count] of Object.entries(inventory)) {
      if (count<=0) continue;

      entry(
        `${nameOf(asId(id))} — Bag`,
        `${count} available`,
        [[
          "STORE 1",
          ()=>{
            if (take(id)) {
              contents[id]=(contents[id]||0)+1;
              drawPanel();
            }
          }
        ]]
      );
    }

    for (const [id,count] of Object.entries(contents)) {
      if (count<=0) continue;

      entry(
        `${nameOf(asId(id))} — Chest`,
        `${count} stored`,
        [[
          "TAKE 1",
          ()=>{
            contents[id]--;
            add(id);
            drawPanel();
          }
        ]]
      );
    }
  }
}

/* SAVE */

function saveGame(silent=false) {
  try {
    localStorage.setItem(SAVE,JSON.stringify({
      edits:[...edits],
      cropAges:[...cropAges],
      chests,
      inventory,
      slots,
      position:[player.x,player.y,player.z],
      health,
      food:hunger
    }));

    if (!silent) notify("World saved");
  } catch {
    notify("Unable to save world");
  }
}

let resetting=false;

$("reset").onclick=()=>{
  if (!confirm("Delete saved world?")) return;

  resetting=true;
  localStorage.removeItem(SAVE);
  location.reload();
};

window.addEventListener("beforeunload",()=>{
  if (!resetting) saveGame(true);
});

/* INPUT */

$("play").onclick=()=>{
  renderer.domElement.requestPointerLock();
};

document.addEventListener("pointerlockchange",()=>{
  playing=
    document.pointerLockElement===renderer.domElement;

  $("menu").hidden=playing||!!panel;
  $("hud").hidden=!playing;

  if (!playing) {
    for (const k of Object.keys(keys)) {
      keys[k]=false;
    }
  }
});

document.addEventListener("mousemove",e=>{
  if (!playing) return;

  player.yaw-=e.movementX*.0022;

  player.pitch=THREE.MathUtils.clamp(
    player.pitch-e.movementY*.0022,
    -1.48,1.48
  );
});

document.addEventListener("keydown",e=>{
  if (["Space","F5"].includes(e.code)) {
    e.preventDefault();
  }

  if (panel&&e.code==="Escape") {
    closePanel();
    return;
  }

  keys[e.code]=true;

  if (!playing||e.repeat) return;

  /* PRESS SHIFT TO DISMOUNT */

  if (
    mounted &&
    (e.code==="ShiftLeft"||e.code==="ShiftRight")
  ) {
    dismount();
    return;
  }

  /* PRESS F TO FLY */

  if (e.code==="KeyF") {
    toggleFlying();
    return;
  }

  if (e.code==="F5") {
    cameraMode=(cameraMode+1)%3;

    $("cameraView").textContent=[
      "First Person",
      "Third Person — Back",
      "Third Person — Front"
    ][cameraMode];

    notify($("cameraView").textContent);
  }

  if (/^Digit[1-9]$/.test(e.code)) {
    selected=Number(e.code.slice(-1))-1;
  }

  if (e.code==="KeyE") openPanel("inventory");
  if (e.code==="KeyC") openPanel("crafting");
  if (e.code==="KeyH") openPanel("chemistry");
  if (e.code==="KeyP") saveGame();

  if (e.code==="KeyG") {
    creative=!creative;
    notify(creative?"CREATIVE":"SURVIVAL");
  }

  if (e.code==="KeyV") {
    if (mounted) dismount();

    player.x=40;
    player.y=5.51;
    player.z=28;
    player.vx=player.vy=player.vz=0;

    centerKey="";
    notify("Welcome to the village");
  }

  if (e.code==="KeyR") {
    if (take("bread")) {
      hunger=Math.min(20,hunger+5);
      notify("Ate bread");
    } else if (take("apple")) {
      hunger=Math.min(20,hunger+4);
      notify("Ate apple");
    } else if (take("cooked")) {
      hunger=Math.min(20,hunger+6);
      notify("Ate cooked meat");
    } else {
      notify("No food available");
    }
  }
});

document.addEventListener("keyup",e=>{
  keys[e.code]=false;
});

document.addEventListener("contextmenu",e=>{
  e.preventDefault();
});

/* TARGETING */

const raycaster=new THREE.Raycaster();

function aim() {
  return new THREE.Vector3(
    -Math.sin(player.yaw)*Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw)*Math.cos(player.pitch)
  );
}

function trace() {
  const origin=new THREE.Vector3(
    player.x,player.y+1.62,player.z
  );
  const direction=aim();

  let previous=null;
  let last="";

  for (let d=.05;d<=REACH;d+=.05) {
    const x=Math.floor(origin.x+direction.x*d+.5);
    const y=Math.floor(origin.y+direction.y*d+.5);
    const z=Math.floor(origin.z+direction.z*d+.5);

    const k=key(x,y,z);
    if (k===last) continue;
    last=k;

    const id=block(x,y,z);

    if (id!==B.AIR) {
      return {x,y,z,id,place:previous,distance:d};
    }

    previous={x,y,z};
  }

  return null;
}

function targetMob() {
  const groups=[
    ...animals.map(a=>a.group),
    ...villagers.map(v=>v.group)
  ];

  if (!groups.length) return null;

  raycaster.set(
    new THREE.Vector3(player.x,player.y+1.62,player.z),
    aim()
  );

  raycaster.far=REACH;

  const hits=raycaster.intersectObjects(groups,true);
  if (!hits.length) return null;

  let object=hits[0].object;

  while (object.parent&&!object.userData.kind) {
    object=object.parent;
  }

  const a=animals.find(a=>a.group===object);
  const v=villagers.find(v=>v.group===object);

  return {
    kind:object.userData.kind,
    value:a||v,
    distance:hits[0].distance
  };
}

/* MINING */

function mine(t) {
  if (!t||t.id===B.BEDROCK) return;

  if (t.id===B.TNT) {
    explode(t.x,t.y,t.z);
    return;
  }

  if (t.id===B.CROPS) {
    harvest(t.x,t.y,t.z);
    return;
  }

  if (changeBlock(t.x,t.y,t.z,B.AIR)) {
    if (t.id===B.TALL_GRASS) {
      if (Math.random()<.6) add("seeds");
    } else if ([
      B.LEAVES,B.RED_LEAF,B.ORANGE_LEAF
    ].includes(t.id)) {
      if (Math.random()<.22) add("apple");
    } else if (![B.WATER,B.LAVA,B.FIRE].includes(t.id)) {
      add(t.id);
    }

    notify(`Mined ${nameOf(t.id)}`);
  }
}

function interact(t) {
  if (!t) return;

  const held=slots[selected];

  if (
    [B.WATER,B.LAVA].includes(t.id) &&
    held==="bucket" && take("bucket")
  ) {
    add(t.id===B.WATER?"water_bucket":"lava_bucket");
    changeBlock(t.x,t.y,t.z,B.AIR);
    notify("Bucket filled");
    return;
  }

  if (t.id===B.CHEST) {
    openPanel("chest",key(t.x,t.y,t.z));
    return;
  }

  if (t.id===B.FURNACE) {
    openPanel("furnace");
    return;
  }

  if (t.id===B.LAB) {
    openPanel("chemistry");
    return;
  }

  if (t.id===B.FARMLAND) {
    plant(t.x,t.y,t.z);
    return;
  }

  if (t.id===B.CROPS) {
    harvest(t.x,t.y,t.z);
    return;
  }

  if (t.id===B.TNT) {
    explode(t.x,t.y,t.z);
    return;
  }

  if (!t.place) return;

  const {x,y,z}=t.place;

  if (block(x,y,z)!==B.AIR) return;

  if (held==="water_bucket"||held==="lava_bucket") {
    if (!take(held)) return;

    add("bucket");

    changeBlock(
      x,y,z,
      held==="water_bucket"?B.WATER:B.LAVA
    );
    return;
  }

  if (held==="seeds") {
    if (block(x,y-1,z)===B.FARMLAND) {
      plant(x,y-1,z);
    } else {
      notify("Plant seeds on farmland");
    }
    return;
  }

  if (
    typeof held!=="number" ||
    [B.AIR,B.BEDROCK,B.WATER,B.LAVA].includes(held)
  ) return;

  const overlaps=
    x+.5>player.x-.3 &&
    x-.5<player.x+.3 &&
    y+.5>player.y &&
    y-.5<player.y+1.8 &&
    z+.5>player.z-.3 &&
    z-.5<player.z+.3;

  if (overlaps&&!flying) return;

  if (!creative&&!take(held)) {
    notify(`No ${nameOf(held)} available`);
    return;
  }

  changeBlock(x,y,z,held);
  notify(`Placed ${nameOf(held)}`);
}

let cooldown=0;

document.addEventListener("mousedown",e=>{
  if (!playing||cooldown>0) return;

  const t=trace();
  const mob=targetMob();

  if (mob?.value&&(!t||mob.distance<t.distance)) {
    if (e.button===2&&mob.kind==="animal") {
      if (!mounted) mount(mob.value);
      cooldown=.25;
      return;
    }

    if (e.button===2&&mob.kind==="villager") {
      openPanel("trading");
      return;
    }

    if (e.button===0&&mob.kind==="animal") {
      const a=mob.value;
      if (a===mounted) return;

      a.hp--;

      if (a.hp<=0) {
        scene.remove(a.group);

        const index=animals.indexOf(a);
        if (index>=0) animals.splice(index,1);

        add("meat",2);
        notify("Collected meat");
      }

      cooldown=.25;
      return;
    }
  }

  if (e.button===0) mine(t);
  if (e.button===2) interact(t);

  cooldown=.14;
});

/* HOTBAR */

for (let i=0;i<9;i++) {
  const div=document.createElement("div");
  div.className="slot";

  const icon=document.createElement("span");
  const count=document.createElement("small");

  div.append(icon,count);
  $("hotbar").append(div);
}

function updateHotbar() {
  [...$("hotbar").children].forEach((div,i)=>{
    const id=slots[i];

    div.classList.toggle("active",i===selected);
    div.classList.toggle("empty",(inventory[id]||0)<=0);

    div.querySelector("span").textContent=iconOf(id);
    div.querySelector("small").textContent=inventory[id]||0;
  });

  const held=slots[selected];

  $("heldName").textContent=
    `${nameOf(held)} (${inventory[held]||0})`;
}

/* MAIN LOOP */

const clock=new THREE.Clock();

let fpsFrames=0;
let fpsTimer=0;
let uiTimer=0;
let physicsTimer=0;
let hungerTimer=0;
let saveTimer=0;
let dayTime=0;

stream();
updateHotbar();

function animate() {
  requestAnimationFrame(animate);

  const dt=Math.min(.04,clock.getDelta());
  gameTime+=dt;

  fpsFrames++;
  fpsTimer+=dt;

  if (fpsTimer>=1) {
    $("fps").textContent=
      `FPS ${Math.round(fpsFrames/fpsTimer)}`;

    fpsFrames=0;
    fpsTimer=0;
  }

  dayTime+=dt*.013;

  const daylight=.5+.5*Math.cos(dayTime);

  ambient.intensity=.5+daylight*1.35;
  sun.intensity=.2+daylight*1.35;

  scene.background.setRGB(
    .07+daylight*.49,
    .10+daylight*.68,
    .19+daylight*.73
  );

  if (playing) {
    updatePlayer(dt);
    updateCamera();
    animatePlayer();

    stream();
    spawnAnimals();

    if (
      Math.abs(player.x-42)<40 &&
      Math.abs(player.z-29)<40
    ) {
      spawnVillagers();
    }

    updateAnimals(dt);
    updateVillagers(dt);
    updateCrops(dt);

    cooldown=Math.max(0,cooldown-dt);

    hungerTimer+=dt;
    saveTimer+=dt;
    uiTimer+=dt;

    if (hungerTimer>=6) {
      hungerTimer=0;

      if (!creative) {
        hunger=Math.max(0,hunger-1);

        if (hunger===0) {
          health=Math.max(0,health-1);
        }
      }
    }

    if (saveTimer>=45) {
      saveTimer=0;
      saveGame(true);
    }

    if (uiTimer>=.13) {
      uiTimer=0;

      $("coords").textContent=
        `XYZ ${Math.floor(player.x)} `+
        `${Math.floor(player.y)} `+
        `${Math.floor(player.z)}`;

      $("biome").textContent=biome(
        Math.floor(player.x),
        Math.floor(player.z)
      );

      $("health").textContent=Math.ceil(health);
      $("food").textContent=Math.ceil(hunger);
      $("mode").textContent=creative?"CREATIVE":"SURVIVAL";
      $("chunks").textContent=`Chunks ${chunks.size}`;

      const mob=targetMob();
      const t=trace();

      $("target").textContent=
        mob?.value&&(!t||mob.distance<t.distance)
          ?mob.kind==="animal"
            ?`${mob.value.type} — Right Click to Ride`
            :`${mob.value.job} — Right Click to Trade`
          :t?nameOf(t.id):"";

      updateHotbar();
    }
  }

  physicsTimer+=dt;

  if (physicsTimer>=.1) {
    physicsTimer=0;
    updatePhysics();
  }

  processChunk();

  if (noticeTime>0) {
    noticeTime-=dt;

    if (noticeTime<=0) {
      $("notice").textContent="";
    }
  }

  renderer.render(scene,camera);
}

updateCamera();
animate();

window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
