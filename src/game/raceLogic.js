import { clamp } from './utils.js';

const BOT_ACCEL_FACTOR = 0.958;
const BOT_POWER_FACTOR = 0.928;
const BOT_TOP_SPEED_FACTOR = 0.94;
const BOT_SHIFT_BONUS_FACTOR = 0.905;

export function createRacer(car) {
  return {
    car,
    rpm: 0,
    speed: 0,
    distance: 0,
    gear: 1,
    maxGear: 6,
    finished: false,
    finalTime: 0,
    reactionDelay: Math.random() * 0.08 + 0.03,
    shiftCooldown: 0,
    nosAvailable: true,
    launchUsed: false,
    launchBonus: 0,
    launchRating: 'AUTO'
  };
}

export function updateRacer(racer, dt) {
  const accelFactor = racer.isBot ? BOT_ACCEL_FACTOR : 1;
  const powerFactor = racer.isBot ? BOT_POWER_FACTOR : 1;
  const topSpeedFactor = racer.isBot ? BOT_TOP_SPEED_FACTOR : 1;
  const gearFactor = 1 + racer.gear * 0.07;
  const powerBand = 0.38 + racer.rpm * 0.9;
  const effectiveMaxSpeed = racer.car.maxSpeed * topSpeedFactor;
  const drag = 0.012 + racer.speed / (effectiveMaxSpeed * 240);

  racer.rpm += racer.car.acceleration * accelFactor * gearFactor * dt * 34;
  racer.rpm = clamp(racer.rpm, 0, 1);
  racer.speed += racer.car.power * powerFactor * powerBand * dt * 1.55;
  racer.speed *= Math.max(0.94, 1 - drag * dt * 10);

  if (racer.speed > 0 && racer.speed < 22) racer.speed = 22;

  racer.speed = clamp(racer.speed, 0, effectiveMaxSpeed);
  racer.distance += racer.speed * dt * 0.38;

  if (racer.shiftCooldown > 0) racer.shiftCooldown -= dt;
}

export function updateLaunchRpm(racer, elapsed) {
  const wave = (Math.sin(elapsed * 5.6) + 1) / 2;
  racer.rpm = 0.22 + wave * 0.72;
}

export function setLaunchWindow(racer) {
  const rpm = racer.rpm;
  let rating = 'HIGH';
  let bonus = 12;

  if (rpm >= 0.58 && rpm <= 0.74) {
    rating = 'PERFECT';
    bonus = 24;
  } else if (rpm >= 0.48 && rpm < 0.58) {
    rating = 'GOOD';
    bonus = 17;
  } else if (rpm < 0.48) {
    rating = 'SLOW';
    bonus = 9;
  }

  racer.launchUsed = true;
  racer.launchBonus = bonus;
  racer.launchRating = rating;
  return { rating, bonus, rpm };
}

export function shiftRacer(racer) {
  if (racer.finished || racer.gear >= racer.maxGear || racer.shiftCooldown > 0) {
    return { result: 'LOCKED', bonus: 0 };
  }

  const { shiftWindowMin, shiftWindowMax, power } = racer.car;
  const rpm = racer.rpm;
  let result = 'EARLY';
  let multiplier = 0.62;

  if (rpm >= shiftWindowMin && rpm <= shiftWindowMax) {
    result = 'PERFECT';
    multiplier = 1.12;
  } else if (rpm >= shiftWindowMin - 0.1 && rpm < shiftWindowMin) {
    result = 'GOOD';
    multiplier = 0.92;
  } else if (rpm > shiftWindowMax && rpm <= 0.95) {
    result = 'LATE';
    multiplier = 0.76;
  } else if (rpm > 0.95) {
    result = 'OVERREV';
    multiplier = 0.58;
  }

  let bonus = power * multiplier * (racer.isBot ? BOT_SHIFT_BONUS_FACTOR : 1);

  if (!racer.launchUsed && racer.gear === 1) {
    bonus += 14;
    racer.launchUsed = true;
  }

  if (racer.gear === 1 && racer.launchBonus > 0) {
    bonus += racer.launchBonus;
    racer.launchBonus = 0;
  }

  const previousSpeed = racer.speed;
  racer.speed += bonus;

  if (racer.speed < previousSpeed + bonus * 0.65) {
    racer.speed = previousSpeed + bonus * 0.65;
  }

  racer.rpm = 0.22;
  racer.gear += 1;
  racer.shiftCooldown = 0.24;
  return { result, bonus };
}

export function tryUseNos(racer) {
  if (!racer.nosAvailable || racer.finished) return false;
  racer.nosAvailable = false;
  racer.speed += 34;
  return true;
}

export function updateBotAutoShift(bot) {
  if (bot.finished || bot.gear >= bot.maxGear || bot.shiftCooldown > 0) return;
  const target = bot.car.shiftWindowMin + 0.03 + bot.reactionDelay * 1.1;
  if (bot.rpm >= target) shiftRacer(bot);
}
