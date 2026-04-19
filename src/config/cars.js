const assetBase = import.meta.env.BASE_URL;

export const cars = [
  {
    id: 'charger',
    name: 'Dodge Charger',
    modelPath: `${assetBase}assets/models/charger-lite.glb`,
    color: 0x3e434a,
    acceleration: 0.0204,
    power: 34.2,
    grip: 0.984,
    shiftWindowMin: 0.73,
    shiftWindowMax: 0.845,
    maxSpeed: 306,
    modelScale: 1.04,
    modelRotationY: Math.PI * 0.5,
    modelWheelSpinAxis: 'y',
    modelYOffset: 0.0,
    modelOffsetX: 0.0,
    modelOffsetZ: 0.0,
    wheelHelper: {
      radius: 0.31,
      thickness: 0.18,
      y: 0.27,
      x: 0.84,
      zFront: 1.19,
      zRear: -1.14
    }
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
    modelScale: 1.776,
    modelRotationY: Math.PI,
    modelYOffset: 0.0,
    modelOffsetX: 0.0,
    modelOffsetZ: 0.0
  }
];

export const PLAYER_CAR_ID = 'supra';
export const BOT_CAR_ID = 'charger';

export function getPlayerCar() {
  return cars.find((car) => car.id === PLAYER_CAR_ID) ?? cars[0];
}

export function getBotCar() {
  return cars.find((car) => car.id === BOT_CAR_ID) ?? cars[1] ?? cars[0];
}
