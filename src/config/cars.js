const assetBase = import.meta.env.BASE_URL;

export const cars = [
  {
    id: 'skyline',
    name: 'Nissan Skyline GT-R R34',
    modelPath: `${assetBase}assets/models/skyline-lite.glb`,
    color: 0xc8cdd6,
    acceleration: 0.02,
    power: 36,
    grip: 0.985,
    shiftWindowMin: 0.72,
    shiftWindowMax: 0.84,
    maxSpeed: 318,
    modelScale: 1.0,
    modelRotationY: Math.PI,
    modelYOffset: 0.0,
    modelOffsetX: 0.0,
    modelOffsetZ: 0.0
  },
  {
    id: 'supra',
    name: 'Toyota Supra MK4',
    modelPath: `${assetBase}assets/models/supra-lite.glb`,
    color: 0xff8f2a,
    acceleration: 0.021,
    power: 35,
    grip: 0.983,
    shiftWindowMin: 0.73,
    shiftWindowMax: 0.85,
    maxSpeed: 312,
    modelScale: 1.12,
    modelRotationY: Math.PI,
    modelYOffset: 0.0,
    modelOffsetX: 0.0,
    modelOffsetZ: 0.0
  }
];

export const PLAYER_CAR_ID = 'skyline';
export const BOT_CAR_ID = 'supra';

export function getPlayerCar() {
  return cars.find((car) => car.id === PLAYER_CAR_ID) ?? cars[0];
}

export function getBotCar() {
  return cars.find((car) => car.id === BOT_CAR_ID) ?? cars[1] ?? cars[0];
}
