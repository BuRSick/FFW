import * as THREE from 'three';

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

function createRoadTexture() {
  const texture = createCanvasTexture(1024, 1024, (ctx, width, height) => {
    ctx.fillStyle = '#6e716c';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 220; i += 1) {
      const shade = 98 + Math.floor(Math.random() * 38);
      const alpha = 0.05 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = 8 + Math.random() * 16;
      const h = 4 + Math.random() * 12;
      ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 6;
    for (let y = 0; y < height; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + 24);
      ctx.stroke();
    }
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 36);
  texture.rotation = Math.PI / 2;
  texture.center.set(0.5, 0.5);
  return texture;
}

function createGroundTexture() {
  const texture = createCanvasTexture(1024, 1024, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e5c797');
    gradient.addColorStop(1, '#c69456');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(160, 114, 62, 0.12)';
    ctx.lineWidth = 3;
    for (let y = 20; y < height; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + 10);
      ctx.stroke();
    }

    for (let i = 0; i < 180; i += 1) {
      const alpha = 0.03 + Math.random() * 0.04;
      ctx.fillStyle = `rgba(148, 100, 48, ${alpha})`;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 6 + Math.random() * 18;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.8, 30);
  texture.rotation = Math.PI / 2;
  texture.center.set(0.5, 0.5);
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
    gradient.addColorStop(0, '#c6e6ff');
    gradient.addColorStop(0.34, '#e7f5ff');
    gradient.addColorStop(0.68, '#fff8ec');
    gradient.addColorStop(1, '#f2d4ab');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.68, height * 0.28, 24, width * 0.68, height * 0.28, width * 0.18);
    glow.addColorStop(0, 'rgba(255,252,239,1)');
    glow.addColorStop(0.4, 'rgba(255,242,203,0.58)');
    glow.addColorStop(1, 'rgba(255,242,203,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createLinearGradient(0, height * 0.58, 0, height);
    haze.addColorStop(0, 'rgba(255,246,224,0)');
    haze.addColorStop(0.48, 'rgba(247,225,177,0.34)');
    haze.addColorStop(1, 'rgba(224,188,126,0.68)');
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

  const sunTexture = createGlowTexture('rgba(255,252,238,1)', 'rgba(255,238,188,0)');
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
  sun.position.set(52, 50, -170);
  scene.add(sun);

  const flare = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 72),
    new THREE.MeshBasicMaterial({
      map: createGlowTexture('rgba(255,245,212,0.48)', 'rgba(255,245,212,0)', 1024),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  flare.position.set(28, 18, -160);
  flare.scale.set(0.95, 0.28, 1);
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
      fill: '#d7cab3',
      shadow: '#b3a592',
      peaks: 10
    },
    {
      width: 460,
      height: 104,
      y: 30,
      z: -190,
      opacity: 0.88,
      fill: '#cfbb93',
      shadow: '#b49c71',
      peaks: 8
    },
    {
      width: 420,
      height: 88,
      y: 20,
      z: -138,
      opacity: 0.82,
      fill: '#ddb97d',
      shadow: '#bf965c',
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
      map: createGlowTexture('rgba(255,244,216,0.42)', 'rgba(255,244,216,0)', 1024),
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

function createRunway(scene) {
  const asphaltMap = createRoadTexture();
  const sandMap = createGroundTexture();

  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(15.8, 920),
    new THREE.MeshStandardMaterial({
      map: asphaltMap,
      color: 0x888579,
      metalness: 0.05,
      roughness: 0.94,
      emissive: 0x000000,
      emissiveIntensity: 0
    })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 0, -110);
  runway.receiveShadow = true;
  scene.add(runway);

  const shoulderMaterial = new THREE.MeshStandardMaterial({
    map: sandMap,
    color: 0xdeba82,
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
  scene.add(runwayLights);

  const sideStreaks = new THREE.Group();
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
  scene.add(dustGroup);
  return dustGroup;
}

export function createScene(rendererWrap) {
  const cameraYaw = THREE.MathUtils.degToRad(260);
  const cameraRadiusScale = 0.84;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe6f4ff);
  scene.fog = null;

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
  renderer.setClearColor(0xe6f4ff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.42;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  rendererWrap.innerHTML = '';
  rendererWrap.appendChild(renderer.domElement);

  const runwayPack = createRunway(scene);
  createSkyCard(scene);
  createBackdropLayers(scene);
  const dustField = createDustField(scene);

  const sunLight = new THREE.DirectionalLight(0xfffcf2, 4.4);
  sunLight.position.set(34, 36, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -18;
  sunLight.shadow.camera.right = 18;
  sunLight.shadow.camera.top = 18;
  sunLight.shadow.camera.bottom = -18;
  scene.add(sunLight);

  const hemi = new THREE.HemisphereLight(0xd8efff, 0xe4bf88, 2.35);
  scene.add(hemi);

  const rimLight = new THREE.PointLight(0xe8f6ff, 10, 42, 2);
  rimLight.position.set(-10, 6, 16);
  scene.add(rimLight);

  const amberFill = new THREE.PointLight(0xfff1cf, 9, 44, 2);
  amberFill.position.set(14, 4, 12);
  scene.add(amberFill);

  return {
    scene,
    camera,
    renderer,
    road: runwayPack.runway,
    runwayMarks: runwayPack.runwayMarks,
    runwayLights: runwayPack.runwayLights,
    sideStreaks: runwayPack.sideStreaks,
    dustField
  };
}
