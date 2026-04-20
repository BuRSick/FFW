import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const WHEEL_NAME_RE = /(wheel|tyre|tire|rim)/i;
const CHARGER_WHEEL_PART_RE = /(tarmac_tyre_tread|tarmac_tyre_wall|tarmac_wheel|discs|caliper)/i;
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

    material.metalness = root.userData?.carPaintMetalness ?? 0.6;
    material.roughness = root.userData?.carPaintRoughness ?? 0.3;
    obj.material = material;
  });
}

function collectConfiguredWheelNodes(root, car) {
  const names = new Set(car.wheelNodeNames ?? []);
  if (!names.size) return null;

  const wheels = [];
  root.traverse((obj) => {
    if (!names.has(obj.name)) return;
    obj.userData.isWheel = true;
    obj.userData.spinAxis = car.modelWheelSpinAxis ?? 'x';
    wheels.push(obj);
  });

  root.userData.wheels = wheels;
  return wheels;
}

function normalizeWheelPivot(mesh) {
  mesh.geometry?.computeBoundingBox?.();
  const bbox = mesh.geometry?.boundingBox;
  if (!bbox) return;

  const center = new THREE.Vector3();
  bbox.getCenter(center);

  if (center.lengthSq() < 1e-6) {
    return;
  }

  mesh.geometry = mesh.geometry.clone();
  mesh.geometry.translate(-center.x, -center.y, -center.z);
  mesh.position.add(center);
}

function collectWheelMeshes(root, car) {
  const wheels = [];

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    const sourceMaterial = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    const materialName = sourceMaterial?.name ?? '';

    if (obj.userData?.isWheel || WHEEL_NAME_RE.test(obj.name) || WHEEL_NAME_RE.test(materialName)) {
      normalizeWheelPivot(obj);

      if (car?.modelWheelSpinAxis) {
        obj.userData.spinAxis = car.modelWheelSpinAxis;
        wheels.push(obj);
        return;
      }

      obj.geometry?.computeBoundingBox?.();
      const bbox = obj.geometry?.boundingBox;

      if (bbox) {
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const entries = [
          ['x', size.x],
          ['z', size.z]
        ].sort((a, b) => a[1] - b[1]);
        obj.userData.spinAxis = entries[0][0];
      }

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

function attachWheelHelpers(root, car) {
  if (!car.wheelHelper) return;

  const { radius, thickness, x, y, zFront, zRear, spinAxis = 'x', tireRotationAxis = 'z' } = car.wheelHelper;
  const scaleComp = Math.abs(root.scale.x) > 1e-6 ? Math.abs(root.scale.x) : 1;
  const unit = 1 / scaleComp;
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x121212,
    roughness: 0.88,
    metalness: 0.08
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3f48,
    roughness: 0.45,
    metalness: 0.72
  });

  const wheels = [];

  for (const side of [-1, 1]) {
    for (const z of [zRear, zFront]) {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(side * x * unit, y * unit, z * unit);
      wheelGroup.userData.isWheel = true;
      wheelGroup.userData.spinAxis = spinAxis;

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * unit, radius * unit, thickness * unit, 28),
        wheelMaterial
      );
      tire.rotation[tireRotationAxis] = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.56 * unit, radius * 0.56 * unit, thickness * 1.06 * unit, 18),
        rimMaterial
      );
      rim.rotation[tireRotationAxis] = Math.PI / 2;
      rim.castShadow = true;
      rim.receiveShadow = true;

      wheelGroup.add(tire, rim);
      root.add(wheelGroup);
      wheels.push(wheelGroup);
    }
  }

  root.userData.wheels = wheels;
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
    collectWheelMeshes(fallback, car);
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
        return;
      }

      if (car.id === 'charger' && car.wheelHelper) {
        const sourceMaterial = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        const materialName = sourceMaterial?.name ?? '';

        if (CHARGER_WHEEL_PART_RE.test(obj.name) || CHARGER_WHEEL_PART_RE.test(materialName)) {
          obj.visible = false;
        }
      }
    });

    model.userData.carPaintMetalness = car.paintMetalness;
    model.userData.carPaintRoughness = car.paintRoughness;
    applyCarMaterial(model, car.color);
    normalizeModel(model, car);
    if (collectConfiguredWheelNodes(model, car)?.length) {
      return model;
    }

    if (car.wheelHelper) {
      attachWheelHelpers(model, car);
    } else {
      collectWheelMeshes(model, car);
    }
    return model;
  } catch (error) {
    console.warn(`Failed to load ${car.modelPath}. Using fallback mesh.`, error);

    const fallback = createFallbackCar(car.color);
    fallback.rotation.y = car.modelRotationY ?? Math.PI;
    fallback.position.y = car.modelYOffset ?? 0;
    fallback.scale.multiplyScalar(car.modelScale ?? 1);
    collectWheelMeshes(fallback, car);
    return fallback;
  }
}
