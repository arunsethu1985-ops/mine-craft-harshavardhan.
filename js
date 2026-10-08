
import * as THREE from "https://esm.sh/three@0.180.0";

// ===============================
// GALAXY BLOCKVERSE 3D ENGINE
// ===============================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 95);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(25, 50, 20);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
sunlight.shadow.camera.left = -45;
sunlight.shadow.camera.right = 45;
sunlight.shadow.camera.top = 45;
sunlight.shadow.camera.bottom = -45;
scene.add(sunlight);

// BLOCK MATERIALS
const blockTypes = {
  1: { name: "Grass Block", color: 0x62ba48 },
  2: { name: "Dirt Block", color: 0x825337 },
  3: { name: "Stone Block", color: 0x888888 },
  4: { name: "Wood Block", color: 0x86552d },
  5: { name: "Leaves Block", color: 0x288b39 },
  6: { name: "Sand Block", color: 0xe5d28b }
};

const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = {};

Object.keys(blockTypes).forEach(type => {
  materials[type] = new THREE.MeshLambertMaterial({
    color: blockTypes[type].color
  });
});

const blocks = new Map();
const blockMeshes = [];

function key(x, y, z) {
  return `${x},${y},${z}`;
}

function addBlock(x, y, z, type = 1) {
  const k = key(x, y, z);
  if (blocks.has(k)) return;

  const mesh = new THREE.Mesh(geometry, materials[type]);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.type = type;

  scene.add(mesh);
  blocks.set(k, mesh);
  blockMeshes.push(mesh);
}

function removeBlock(mesh) {
  if (!mesh) return;

  const p = mesh.position;
  blocks.delete(key(p.x, p.y, p.z));

  scene.remove(mesh);
  const index = blockMeshes.indexOf(mesh);
  if (index !== -1) blockMeshes.splice(index, 1);
}

// TERRAIN
function terrainHeight(x, z) {
  return Math.floor(
    Math.sin(x * 0.17) * 2 +
    Math.cos(z * 0.13) * 2 +
    Math.sin((x + z) * 0.09)
  );
}

const WORLD_SIZE = 38;

for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {
  for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {
    const height = terrainHeight(x, z);

    addBlock(x, height, z, height < -1 ? 6 : 1);
    addBlock(x, height - 1, z, 2);
    addBlock(x, height - 2, z, 3);
  }
}

// TREES
function makeTree(x, z) {
  const y = terrainHeight(x, z);

  for (let h = 1; h <= 4; h++) {
    addBlock(x, y + h, z, 4);
  }

  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = 3; dy <= 5; dy++) {
        if (Math.abs(dx) + Math.abs(dz) < 4) {
          addBlock(x + dx, y + dy, z + dz, 5);
        }
      }
    }
  }

  addBlock(x, y + 6, z, 5);
}

for (let i = 0; i < 55; i++) {
  const x = Math.floor(Math.random() * 65) - 32;
  const z = Math.floor(Math.random() * 65) - 32;

  if (Math.hypot(x, z) > 8) {
    makeTree(x, z);
  }
}

// PLAYER
const player = {
  height: 1.7,
  speed: 5,
  sprint: 9,
  verticalVelocity: 0,
  flying: false,
  grounded: false
};

camera.position.set(
  0,
  terrainHeight(0, 8) + player.height + 1,
  8
);

const keys = {};
let yaw = 0;
let pitch = 0;
let selectedBlock = 1;
let gameStarted = false;

const startScreen = document.getElementById("startScreen");
const hud = document.getElementById("hud");
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  gameStarted = document.pointerLockElement === renderer.domElement;
  startScreen.style.display = gameStarted ? "none" : "flex";
  hud.style.display = gameStarted ? "block" : "none";
  if (!gameStarted) {
    Object.keys(keys).forEach(k => keys[k] = false);
  }
});

document.addEventListener("mousemove", e => {
  if (!gameStarted) return;

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = THREE.MathUtils.clamp(pitch, -1.5, 1.5);

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

document.addEventListener("keydown", e => {
  keys[e.code] = true;

  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === "KeyF" && !e.repeat) {
    player.flying = !player.flying;
    player.verticalVelocity = 0;
    document.getElementById("mode").textContent =
      player.flying ? "FLY MODE" : "CREATIVE MODE";
  }

  if (e.code.startsWith("Digit")) {
    const number = Number(e.code.replace("Digit", ""));
    if (blockTypes[number]) selectBlock(number);
  }
});

document.addEventListener("keyup", e => {
  keys[e.code] = false;
});

function selectBlock(type) {
  selectedBlock = type;

  document.querySelectorAll(".slot").forEach(slot => {
    slot.classList.toggle(
      "selected",
      Number(slot.dataset.block) === type
    );
  });

  document.getElementById("blockName").textContent =
    blockTypes[type].name;
}

document.querySelectorAll(".slot").forEach(slot => {
  slot.addEventListener("click", () => {
    selectBlock(Number(slot.dataset.block));
  });
});

// MINING AND BUILDING
const raycaster = new THREE.Raycaster();
raycaster.far = 7;
const center = new THREE.Vector2(0, 0);

document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("mousedown", e => {
  if (!gameStarted) return;

  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(blockMeshes, false);

  if (hits.length === 0) return;

  const hit = hits[0];

  if (e.button === 0) {
    removeBlock(hit.object);
  }

  if (e.button === 2) {
    const target = hit.object.position.clone()
      .add(hit.face.normal);

    target.round();

    if (target.distanceTo(camera.position) < 1.5) {
      return;
    }

    addBlock(
      target.x,
      target.y,
      target.z,
      selectedBlock
    );
  }
});

// BASIC PLAYER COLLISION
function surfaceHeight(x, z, feetY) {
  const bx = Math.round(x);
  const bz = Math.round(z);

  let highest = -100;

  for (let y = Math.floor(feetY + 0.5); y >= feetY - 5; y--) {
    if (blocks.has(key(bx, y, bz))) {
      highest = Math.max(highest, y + 0.5);
      break;
    }
  }

  return highest;
}

const clock = new THREE.Clock();
const moveDirection = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);

  if (gameStarted) {
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    moveDirection.set(0, 0, 0);

    if (keys.KeyW) moveDirection.add(forward);
    if (keys.KeyS) moveDirection.sub(forward);
    if (keys.KeyD) moveDirection.add(right);
    if (keys.KeyA) moveDirection.sub(right);

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      const speed = keys.ShiftLeft ? player.sprint : player.speed;
      camera.position.addScaledVector(moveDirection, speed * dt);
    }

    camera.position.x = THREE.MathUtils.clamp(
      camera.position.x, -WORLD_SIZE, WORLD_SIZE
    );

    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z, -WORLD_SIZE, WORLD_SIZE
    );

    if (player.flying) {
      if (keys.Space) camera.position.y += 8 * dt;
      if (keys.ControlLeft) camera.position.y -= 8 * dt;
    } else {
      const feet = camera.position.y - player.height;
      const ground = surfaceHeight(
        camera.position.x,
        camera.position.z,
        feet
      );

      player.verticalVelocity -= 22 * dt;

      if (keys.Space && player.grounded) {
        player.verticalVelocity = 8;
        player.grounded = false;
      }

      camera.position.y += player.verticalVelocity * dt;

      if (camera.position.y - player.height <= ground) {
        camera.position.y = ground + player.height;
        player.verticalVelocity = 0;
        player.grounded = true;
      } else {
        player.grounded = false;
      }
    }

    document.getElementById("coordinates").textContent =
      `XYZ: ${camera.position.x.toFixed(0)}, ` +
      `${camera.position.y.toFixed(0)}, ` +
      `${camera.position.z.toFixed(0)}`;
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
