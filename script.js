import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const canvas = document.getElementById("bg-canvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  40
);
camera.position.z = 9;

const particleCount = 16000;
const bounds = { x: 12, y: 7 };

const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 2);
const seeds = new Float32Array(particleCount);
const sizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i += 1) {
  const i3 = i * 3;
  const i2 = i * 2;
  positions[i3] = (Math.random() - 0.5) * bounds.x * 2.0;
  positions[i3 + 1] = (Math.random() - 0.5) * bounds.y * 2.0;
  positions[i3 + 2] = (Math.random() - 0.5) * 1.8;
  velocities[i2] = (Math.random() - 0.5) * 0.02;
  velocities[i2 + 1] = (Math.random() - 0.5) * 0.02;
  seeds[i] = Math.random();
  sizes[i] = 1.0 + Math.random() * 2.0;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: `
    uniform float uTime;
    uniform vec2 uMouse;
    attribute float aSeed;
    attribute float aSize;
    varying float vSeed;
    varying float vGlow;

    void main() {
      vec3 p = position;
      float mouseDist = distance(p.xy, uMouse);
      float adsorb = smoothstep(3.2, 0.0, mouseDist);

      vSeed = aSeed;
      vGlow = adsorb;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (8.0 + adsorb * 10.0) * (8.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying float vSeed;
    varying float vGlow;

    vec3 goldA = vec3(0.83, 0.69, 0.22);
    vec3 goldB = vec3(1.00, 0.86, 0.48);
    vec3 amber = vec3(0.95, 0.58, 0.09);

    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      float mask = smoothstep(0.5, 0.0, d);
      if (mask < 0.01) discard;

      vec3 base = mix(goldA, goldB, vSeed);
      base = mix(base, amber, vGlow * 0.45);

      float core = smoothstep(0.2, 0.0, d);
      float alpha = mask * (0.16 + vGlow * 0.58);

      gl_FragColor = vec4(base * (0.7 + core * 0.8), alpha);
    }
  `,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

const mouse = new THREE.Vector2(999, 999);
const targetMouse = new THREE.Vector2(999, 999);
const rayTarget = new THREE.Vector3();

function onPointerMove(event) {
  const nx = (event.clientX / window.innerWidth) * 2 - 1;
  const ny = -(event.clientY / window.innerHeight) * 2 + 1;
  rayTarget.set(nx, ny, 0.5).unproject(camera);
  const dir = rayTarget.sub(camera.position).normalize();
  const t = -camera.position.z / dir.z;
  targetMouse.set(camera.position.x + dir.x * t, camera.position.y + dir.y * t);
}

function onPointerLeave() {
  targetMouse.set(999, 999);
}

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerleave", onPointerLeave);

function flowField(x, y, t) {
  const a = Math.sin(y * 0.65 + t * 0.55) + Math.cos(x * 0.58 - t * 0.38);
  return { fx: Math.cos(a), fy: Math.sin(a) };
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  mouse.lerp(targetMouse, 0.12);
  material.uniforms.uMouse.value.copy(mouse);
  material.uniforms.uTime.value = now * 0.001;

  const t = now * 0.001;
  const attractRadius = 3.6;
  const iMax = particleCount * 3;

  for (let i3 = 0, i2 = 0; i3 < iMax; i3 += 3, i2 += 2) {
    const x = positions[i3];
    const y = positions[i3 + 1];

    const f = flowField(x, y, t);
    velocities[i2] += f.fx * 0.0042;
    velocities[i2 + 1] += f.fy * 0.0042;

    const dx = mouse.x - x;
    const dy = mouse.y - y;
    const d2 = dx * dx + dy * dy;

    if (d2 < attractRadius * attractRadius) {
      const d = Math.sqrt(d2) + 0.0001;
      const force = (1.0 - d / attractRadius) * 0.075;
      velocities[i2] += (dx / d) * force;
      velocities[i2 + 1] += (dy / d) * force;

      const swirl = force * 0.85;
      velocities[i2] += (-dy / d) * swirl;
      velocities[i2 + 1] += (dx / d) * swirl;
    }

    velocities[i2] *= 0.972;
    velocities[i2 + 1] *= 0.972;

    positions[i3] += velocities[i2] * (dt * 60.0);
    positions[i3 + 1] += velocities[i2 + 1] * (dt * 60.0);

    if (positions[i3] > bounds.x) positions[i3] = -bounds.x;
    if (positions[i3] < -bounds.x) positions[i3] = bounds.x;
    if (positions[i3 + 1] > bounds.y) positions[i3 + 1] = -bounds.y;
    if (positions[i3 + 1] < -bounds.y) positions[i3 + 1] = bounds.y;
  }

  geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
});
