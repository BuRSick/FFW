import * as THREE from 'three';

const ASSET_BASE = import.meta.env.BASE_URL;

function loadRepeatedTexture(loader, url, repeatX, repeatY, options = {}) {
  const texture = loader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.rotation = options.rotation ?? 0;
  texture.center.set(0.5, 0.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCanvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGlowTexture(innerColor, outerColor = 'rgba(255,255,255,0)', size = 512) {
  return createCanvasTexture(size, size, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      width * 0.06,
      width * 0.5,
      height * 0.5,
      width * 0.5
    );
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.38, innerColor);
    gradient.addColorStop(1, outerColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

function createAxisLabelSprite(text, color) {
  const texture = createCanvasTexture(128, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(10, 12, 18, 0.7)';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, width * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 62px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width * 0.5, height * 0.54);
  });

  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.82, 0.82, 0.82);
  return sprite;
}

function createAxisGuide(scene) {
  const guide = new THREE.Group();
  guide.position.set(-6.2, 0.04, 11.2);

  const axes = new THREE.AxesHelper(5.2);
  axes.material.depthTest = false;
  axes.renderOrder = 10;
  guide.add(axes);

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: false,
      toneMapped: false
    })
  );
  origin.renderOrder = 11;
  guide.add(origin);

  const xLabel = createAxisLabelSprite('X', '#ff5b57');
  xLabel.position.set(5.9, 0.34, 0);
  xLabel.renderOrder = 12;
  guide.add(xLabel);

  const yLabel = createAxisLabelSprite('Y', '#57d66b');
  yLabel.position.set(0, 5.95, 0);
  yLabel.renderOrder = 12;
  guide.add(yLabel);

  const zLabel = createAxisLabelSprite('Z', '#4fa3ff');
  zLabel.position.set(0, 0.34, 5.9);
  zLabel.renderOrder = 12;
  guide.add(zLabel);

  scene.add(guide);
  return guide;
}

function createCameraAxisGuide(camera) {
  const guide = new THREE.Group();
  guide.position.set(-2.8, -1.35, -4.8);

  const axes = new THREE.AxesHelper(0.75);
  axes.material.depthTest = false;
  axes.renderOrder = 1000;
  guide.add(axes);

  const xLabel = createAxisLabelSprite('X', '#ff5b57');
  xLabel.position.set(0.92, 0.02, 0);
  xLabel.scale.set(0.14, 0.14, 0.14);
  xLabel.renderOrder = 1001;
  guide.add(xLabel);

  const yLabel = createAxisLabelSprite('Y', '#57d66b');
  yLabel.position.set(0, 0.92, 0);
  yLabel.scale.set(0.14, 0.14, 0.14);
  yLabel.renderOrder = 1001;
  guide.add(yLabel);

  const zLabel = createAxisLabelSprite('Z', '#4fa3ff');
  zLabel.position.set(0, 0.02, 0.92);
  zLabel.scale.set(0.14, 0.14, 0.14);
  zLabel.renderOrder = 1001;
  guide.add(zLabel);

  camera.add(guide);
  return guide;
}

function createAxisOverlay(rendererWrap) {
  const overlay = document.createElement('div');
  overlay.className = 'axis-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="axis-overlay-title">AXES</div>
    <div class="axis-overlay-row axis-overlay-row-x"><span>X</span><i></i></div>
    <div class="axis-overlay-row axis-overlay-row-y"><span>Y</span><i></i></div>
    <div class="axis-overlay-row axis-overlay-row-z"><span>Z</span><i></i></div>
  `;
  rendererWrap.appendChild(overlay);
  return overlay;
}

function rotatePointAroundY(pointX, pointZ, pivotX, pivotZ, angleRad, radiusScale = 1) {
  const dx = (pointX - pivotX) * radiusScale;
  const dz = (pointZ - pivotZ) * radiusScale;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: pivotX + dx * cos - dz * sin,
    z: pivotZ + dx * sin + dz * cos
  };
}

function createSkyCard(scene) {
  const skyTexture = createCanvasTexture(2048, 1024, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2b1e1f');
    gradient.addColorStop(0.22, '#8a4d37');
    gradient.addColorStop(0.48, '#cf8d5a');
    gradient.addColorStop(0.74, '#efba74');
    gradient.addColorStop(1, '#f2c887');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.52, height * 0.58, 20, width * 0.52, height * 0.58, width * 0.24);
    glow.addColorStop(0, 'rgba(255,236,195,0.95)');
    glow.addColorStop(0.4, 'rgba(255,183,104,0.34)');
    glow.addColorStop(1, 'rgba(255,183,104,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createLinearGradient(0, height * 0.54, 0, height);
    haze.addColorStop(0, 'rgba(255,214,154,0)');
    haze.addColorStop(0.5, 'rgba(244,184,112,0.22)');
    haze.addColorStop(1, 'rgba(185,114,63,0.58)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, height * 0.54, width, height * 0.46);
  });

  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(480, 220),
    new THREE.MeshBasicMaterial({
      map: skyTexture,
      toneMapped: false,
      depthWrite: false
    })
  );
  sky.position.set(0, 78, -250);
  scene.add(sky);

  const sunTexture = createGlowTexture('rgba(255,227,173,0.95)', 'rgba(255,195,121,0)');
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 44),
    new THREE.MeshBasicMaterial({
      map: sunTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  sun.position.set(14, 39, -170);
  scene.add(sun);

  const flare = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 72),
    new THREE.MeshBasicMaterial({
      map: createGlowTexture('rgba(255,202,120,0.45)', 'rgba(255,202,120,0)', 1024),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  flare.position.set(8, 20, -160);
  flare.scale.set(1.1, 0.38, 1);
  scene.add(flare);
}

function createRidgeTexture(fill, shadow, peakCount, wobble = 0.16) {
  return createCanvasTexture(2048, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    const path = new Path2D();
    path.moveTo(0, height);
    path.lineTo(0, height * 0.78);

    for (let i = 0; i <= peakCount; i += 1) {
      const x = (width / peakCount) * i;
      const normalized = i / peakCount;
      const ridge = Math.sin(normalized * Math.PI * 2.6 + wobble) * 0.12;
      const peakBias = i % 2 === 0 ? 0.08 : -0.05;
      const y = height * (0.56 + ridge + peakBias);
      path.lineTo(x, y);
    }

    path.lineTo(width, height * 0.8);
    path.lineTo(width, height);
    path.closePath();

    const gradient = ctx.createLinearGradient(0, height * 0.42, 0, height);
    gradient.addColorStop(0, fill);
    gradient.addColorStop(1, shadow);
    ctx.fillStyle = gradient;
    ctx.fill(path);

    ctx.globalAlpha = 0.26;
    ctx.fillStyle = '#f7cf94';
    ctx.fillRect(0, height * 0.74, width, height * 0.02);
    ctx.globalAlpha = 1;
  });
}

function createBackdropLayers(scene) {
  const layers = [
    {
      width: 500,
      height: 120,
      y: 42,
      z: -240,
      opacity: 0.9,
      fill: '#725037',
      shadow: '#473223',
      peaks: 10
    },
    {
      width: 460,
      height: 104,
      y: 30,
      z: -190,
      opacity: 0.88,
      fill: '#916542',
      shadow: '#5a3d2a',
      peaks: 8
    },
    {
      width: 420,
      height: 88,
      y: 20,
      z: -138,
      opacity: 0.82,
      fill: '#b07c4d',
      shadow: '#825936',
      peaks: 7
    }
  ];

  for (const layer of layers) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(layer.width, layer.height),
      new THREE.MeshBasicMaterial({
        map: createRidgeTexture(layer.fill, layer.shadow, layer.peaks),
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false
      })
    );
    mesh.position.set(0, layer.y, layer.z);
    scene.add(mesh);
  }

  const horizonMist = new THREE.Mesh(
    new THREE.PlaneGeometry(460, 64),
    new THREE.MeshBasicMaterial({
      map: createGlowTexture('rgba(255,221,168,0.45)', 'rgba(255,221,168,0)', 1024),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  horizonMist.position.set(0, 14, -126);
  horizonMist.scale.set(1.5, 0.42, 1);
  scene.add(horizonMist);
}

function createRunwayMarkings(scene) {
  const markings = new THREE.Group();
  const stripeMaterial = new THREE.MeshBasicMaterial({
    color: 0xf6f3eb,
    toneMapped: false
  });
  const finishLineZ = -212;

  for (let z = -340; z <= 120; z += 15) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 8.2), stripeMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.024, z);
    markings.add(line);
  }

  scene.add(markings);

  const thresholdBarMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  for (let i = 0; i < 8; i += 1) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 4.4), thresholdBarMaterial);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(-4.9 + i * 1.4, 0.03, 9.8);
    scene.add(bar);
  }

  const startBand = new THREE.Mesh(
    new THREE.PlaneGeometry(15.6, 1.6),
    new THREE.MeshBasicMaterial({ color: 0xe8d072, toneMapped: false })
  );
  startBand.rotation.x = -Math.PI / 2;
  startBand.position.set(0, 0.035, 6.2);
  scene.add(startBand);

  const finishBand = new THREE.Mesh(
    new THREE.PlaneGeometry(15.6, 2.4),
    new THREE.MeshBasicMaterial({ color: 0xf4f2ec, toneMapped: false })
  );
  finishBand.rotation.x = -Math.PI / 2;
  finishBand.position.set(0, 0.038, finishLineZ);
  scene.add(finishBand);

  const finishStripeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false });
  for (let x = -7.1; x <= 7.1; x += 1.55) {
    const stripeA = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.2), finishStripeMaterial);
    stripeA.rotation.x = -Math.PI / 2;
    stripeA.position.set(x, 0.041, finishLineZ - 0.6);
    scene.add(stripeA);

    const stripeB = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.2), finishStripeMaterial);
    stripeB.rotation.x = -Math.PI / 2;
    stripeB.position.set(x + 0.78, 0.041, finishLineZ + 0.6);
    scene.add(stripeB);
  }

  const finishGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 6),
    new THREE.MeshBasicMaterial({
      map: createGlowTexture('rgba(255,244,192,0.32)', 'rgba(255,244,192,0)', 512),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  finishGlow.rotation.x = -Math.PI / 2;
  finishGlow.position.set(0, 0.06, finishLineZ);
  scene.add(finishGlow);

  return { markings, finishLineZ };
}

function createRunway(scene, textureLoader) {
  const asphaltMap = loadRepeatedTexture(
    textureLoader,
    `${ASSET_BASE}assets/trailer/textures/aerial-asphalt-diffuse.jpg`,
    1.8,
    38,
    { rotation: Math.PI / 2 }
  );
  const sandMap = loadRepeatedTexture(
    textureLoader,
    `${ASSET_BASE}assets/trailer/textures/aerial-sand-diffuse.jpg`,
    3.2,
    34,
    { rotation: Math.PI / 2 }
  );

  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(15.8, 920),
    new THREE.MeshStandardMaterial({
      map: asphaltMap,
      color: 0x171a20,
      metalness: 0.24,
      roughness: 0.88,
      emissive: 0x0b0f15,
      emissiveIntensity: 0.34
    })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 0, -110);
  runway.receiveShadow = true;
  scene.add(runway);

  const sheen = new THREE.Mesh(
    new THREE.PlaneGeometry(12.4, 920),
    new THREE.MeshBasicMaterial({
      color: 0x5d7488,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(0, 0.012, -110);
  scene.add(sheen);

  const shoulderMaterial = new THREE.MeshStandardMaterial({
    map: sandMap,
    color: 0xa17546,
    roughness: 1,
    metalness: 0
  });

  const leftShoulder = new THREE.Mesh(new THREE.PlaneGeometry(42, 920), shoulderMaterial);
  leftShoulder.rotation.x = -Math.PI / 2;
  leftShoulder.position.set(-28.8, -0.025, -110);
  scene.add(leftShoulder);

  const rightShoulder = leftShoulder.clone();
  rightShoulder.position.x = 28.8;
  scene.add(rightShoulder);

  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xf8f7ef, toneMapped: false });
  for (const x of [-7.4, 7.4]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 920), edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(x, 0.018, -110);
    scene.add(edge);
  }

  const runwayMarkPack = createRunwayMarkings(scene);

  const runwayLights = new THREE.Group();
  const amberLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xf8bd6d,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });

  for (let z = -340; z <= 120; z += 7) {
    for (const x of [-8.1, 8.1]) {
      const light = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.45), amberLightMaterial);
      light.rotation.x = -Math.PI / 2;
      light.position.set(x, 0.028, z);
      runwayLights.add(light);
    }
  }
  scene.add(runwayLights);

  const sideStreaks = new THREE.Group();
  for (let z = -340; z <= 120; z += 12) {
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 12),
      new THREE.MeshBasicMaterial({
        color: 0x8cd5ff,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(9.4, 0.02, z);
    sideStreaks.add(streak);

    const amber = streak.clone();
    amber.position.x = -9.4;
    amber.material = streak.material.clone();
    amber.material.color = new THREE.Color(0xffc16f);
    amber.material.opacity = 0.09;
    sideStreaks.add(amber);
  }
  scene.add(sideStreaks);

  return {
    runway,
    runwayMarks: runwayMarkPack.markings,
    runwayLights,
    sideStreaks,
    finishLineZ: runwayMarkPack.finishLineZ
  };
}

function createDustField(scene) {
  const dustGroup = new THREE.Group();
  const dustTexture = createGlowTexture('rgba(255,214,155,0.48)', 'rgba(255,214,155,0)', 512);

  for (let i = 0; i < 16; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const puff = new THREE.Mesh(
      new THREE.PlaneGeometry(16 + (i % 3) * 6, 7 + (i % 4) * 2),
      new THREE.MeshBasicMaterial({
        map: dustTexture,
        transparent: true,
        opacity: 0.2 + (i % 3) * 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      })
    );
    puff.position.set(side * (13 + (i % 4) * 2.4), 3.4 + (i % 3) * 0.45, -20 - i * 24);
    dustGroup.add(puff);
  }

  scene.add(dustGroup);
  return dustGroup;
}

export function createScene(rendererWrap) {
  const cameraYaw = THREE.MathUtils.degToRad(280);
  const cameraRadiusScale = 0.84;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc38d57, 62, 240);

  const camera = new THREE.PerspectiveCamera(
    44,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  const rotatedCameraStart = rotatePointAroundY(10.8, 15.8, -0.25, 5.1, cameraYaw, cameraRadiusScale);
  camera.position.set(rotatedCameraStart.x, 2.58, rotatedCameraStart.z);
  camera.lookAt(-0.25, 1.1, 5.1);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  rendererWrap.innerHTML = '';
  rendererWrap.appendChild(renderer.domElement);
  const axisOverlay = createAxisOverlay(rendererWrap);

  const textureLoader = new THREE.TextureLoader();
  const runwayPack = createRunway(scene, textureLoader);
  const dustField = createDustField(scene);
  const axisGuide = createAxisGuide(scene);
  const cameraAxisGuide = createCameraAxisGuide(camera);

  const sunLight = new THREE.DirectionalLight(0xffe4be, 3.25);
  sunLight.position.set(-28, 22, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -18;
  sunLight.shadow.camera.right = 18;
  sunLight.shadow.camera.top = 18;
  sunLight.shadow.camera.bottom = -18;
  scene.add(sunLight);

  const hemi = new THREE.HemisphereLight(0xffc88c, 0x5e3e24, 1.5);
  scene.add(hemi);

  const rimLight = new THREE.PointLight(0x79d4ff, 22, 40, 2);
  rimLight.position.set(7, 3.5, 18);
  scene.add(rimLight);

  const amberFill = new THREE.PointLight(0xffaa61, 18, 50, 2);
  amberFill.position.set(-10, 2.5, 8);
  scene.add(amberFill);

  return {
    scene,
    camera,
    renderer,
    road: runwayPack.runway,
    runwayMarks: runwayPack.runwayMarks,
    runwayLights: runwayPack.runwayLights,
    sideStreaks: runwayPack.sideStreaks,
    dustField,
    axisGuide,
    cameraAxisGuide,
    axisOverlay
  };
}
