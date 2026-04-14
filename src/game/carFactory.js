import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const WHEEL_NAME_RE = /(wheel|tyre|tire|rim)/i;
const HIDDEN_MESH_NAME_RE = /underlighting/i;

function shouldUseSimpleCars() {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get('cars') === 'simple';
}

function applyCarMaterial(root, color) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;

    obj.castShadow = true;
    obj.receiveShadow = true;

    const source = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!source) return;

    const material = source.clone();

    if ('color' in material) {
      material.color = new THREE.Color(color);
    }

    material.metalness = 0.6;
    material.roughness = 0.3;
    obj.material = material;
  });
}

function collectWheelMeshes(root) {
  const wheels = [];

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    if (obj.userData?.isWheel || WHEEL_NAME_RE.test(obj.name)) {
      wheels.push(obj);
    }
  });

  root.userData.wheels = wheels;
}

function createFallbackCar(color) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.6, 4.45),
    new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.35 })
  );
  body.position.y = 0.58;

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.48, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x101419, metalness: 0.18, roughness: 0.52 })
  );
  roof.position.set(0, 1, -0.1);

  group.add(body);
  group.add(roof);

  for (const x of [-0.88, 0.88]) {
    for (const z of [-1.45, 1.45]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.32, 20),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.36, z);
      wheel.userData.isWheel = true;
      group.add(wheel);
    }
  }

  return group;
}

function normalizeModel(root, car) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  if (!Number.isFinite(size.length()) || size.length() === 0) {
    return;
  }

  root.position.sub(center);

  const targetLength = 4.6;
  const targetHeight = 1.65;
  const scaleByLength = targetLength / Math.max(size.z, 0.001);
  const scaleByHeight = targetHeight / Math.max(size.y, 0.001);
  const normalizedScale = Math.min(scaleByLength, scaleByHeight) * (car.modelScale ?? 1);

  root.scale.multiplyScalar(normalizedScale);
  root.updateMatrixWorld(true);

  const normalizedBox = new THREE.Box3().setFromObject(root);
  const minY = normalizedBox.min.y;

  if (Number.isFinite(minY)) {
    root.position.addScaledVector(UP_AXIS, -minY + (car.modelYOffset ?? 0));
  }

  root.rotation.y = car.modelRotationY ?? Math.PI;
}

export async function createCarModel(car) {
  if (shouldUseSimpleCars()) {
    const fallback = createFallbackCar(car.color);
    fallback.rotation.y = car.modelRotationY ?? Math.PI;
    fallback.position.y = car.modelYOffset ?? 0;
    fallback.scale.multiplyScalar(car.modelScale ?? 1);
    collectWheelMeshes(fallback);
    return fallback;
  }

  try {
    const gltf = await loader.loadAsync(car.modelPath);
    const model = gltf.scene || gltf.scenes?.[0];

    if (!model) {
      throw new Error('GLTF scene is missing');
    }

    model.traverse((obj) => {
      if (!obj.isMesh) return;

      if (car.id === 'supra' && HIDDEN_MESH_NAME_RE.test(obj.name)) {
        obj.visible = false;
      }
    });

    applyCarMaterial(model, car.color);
    normalizeModel(model, car);
    collectWheelMeshes(model);
    return model;
  } catch (error) {
    console.warn(`Failed to load ${car.modelPath}. Using fallback mesh.`, error);

    const fallback = createFallbackCar(car.color);
    fallback.rotation.y = car.modelRotationY ?? Math.PI;
    fallback.position.y = car.modelYOffset ?? 0;
    fallback.scale.multiplyScalar(car.modelScale ?? 1);
    collectWheelMeshes(fallback);
    return fallback;
  }
}
