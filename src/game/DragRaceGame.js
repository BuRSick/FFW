import * as THREE from 'three';
import { appState } from '../core/state.js';
import {
  createHudBindings,
  formatTimer,
  ratioToPercent,
  speedToNeedleAngle
} from '../ui/hud.js';
import { createCarModel } from './carFactory.js';
import {
  createRacer,
  setLaunchWindow,
  shiftRacer,
  tryUseNos,
  updateBotAutoShift,
  updateLaunchRpm,
  updateRacer
} from './raceLogic.js';
import { clamp, lerp } from './utils.js';
import { createScene } from './sceneSetup.js';

const CAMERA_YAW_OFFSET = THREE.MathUtils.degToRad(260);
const CAMERA_RADIUS_SCALE = 0.84;
const WORLD_TRAVEL_SCALE = 0.32;
const WORLD_GAP_SCALE = 0.12;
const MAX_WORLD_TRAVEL = 220;
const VISIBLE_TRACK_LENGTH = MAX_WORLD_TRAVEL / WORLD_TRAVEL_SCALE;

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

export class DragRaceGame {
  constructor({ playerCar, botCar, onFinish }) {
    this.playerCarConfig = playerCar;
    this.botCarConfig = botCar;
    this.onFinish = onFinish;
    this.gameScreen = document.getElementById('gameScreen');
    this.wrap = document.getElementById('gameCanvasWrap');
    this.hud = createHudBindings();
    this.player = createRacer(this.playerCarConfig);
    this.bot = createRacer(this.botCarConfig);
    this.player.isPlayer = true;
    this.bot.isBot = true;
    this.displaySpeedMax = 260;
    this.playerLane = { x: 2.6, z: 7.8 };
    this.botLane = { x: -2.6, z: 6.2 };
    this.playerCarModel = null;
    this.botCarModel = null;
    this.elapsed = 0;
    this.trackLength = VISIBLE_TRACK_LENGTH;
    this.running = false;
    this.finished = false;
    this.resultShown = false;
    this.finishSequenceActive = false;
    this.finishSequenceTimer = 0;
    this.finishSequenceDuration = 1.25;
    this.finishSnapshot = null;
    this.raceStarted = false;
    this.launchLocked = false;
    this.scenePack = null;
    this.clock = new THREE.Clock();
    this.cameraMode = 'staging';
    this.launchBoostTime = 0;
    this.debugEnabled = false;
    this.cameraLookTarget = null;
    this.prepared = false;
    this.trailerMedia = { stage: null, race: null, dust: null };
    this.handleShift = this.handleShift.bind(this);
    this.handleNos = this.handleNos.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);
  }

  async prepare() {
    if (this.prepared) return;

    this.scenePack = createScene(this.wrap);
    this.playerCarModel = await createCarModel(this.playerCarConfig);
    this.botCarModel = await createCarModel(this.botCarConfig);

    this.playerCarModel.position.set(this.playerLane.x, this.playerCarConfig.modelYOffset ?? 0, this.playerLane.z);
    this.botCarModel.position.set(this.botLane.x, this.botCarConfig.modelYOffset ?? 0, this.botLane.z);

    this.playerCarModel.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = true;
    });
    this.botCarModel.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = true;
    });

    this.scenePack.scene.add(this.playerCarModel);
    this.scenePack.scene.add(this.botCarModel);
    this.setupTrailerMedia();
    this.resetHud();

    this.hud.shiftBtn.addEventListener('click', this.handleShift);
    this.hud.nosBtn.addEventListener('click', this.handleNos);
    window.addEventListener('resize', this.handleResize);
    this.prepared = true;
  }

  async start() {
    await this.prepare();
    this.running = true;
    this.clock.start();

    await this.playIntroSequence();
    this.loop();
  }

  async init() {
    await this.prepare();
    await this.start();
  }

  resetHud() {
    this.hud.playerCarName.textContent = this.playerCarConfig.name;
    this.hud.opponentCarName.textContent = this.botCarConfig.name;
    this.hud.hud.classList.remove('hidden');
    this.hud.resultOverlay.classList.add('hidden');
    this.hud.shiftFeedback.textContent = 'HOLD RPM';
    this.hud.shiftFeedback.style.color = '#ffffff';
    this.hud.raceStatus.textContent = 'Lock launch in the green zone, then chain perfect shifts.';
    this.hud.gearValue.textContent = '1';
    this.hud.speedValue.textContent = '0';
    this.hud.rpmValue.textContent = '0.00';
    this.hud.rpmFill.style.width = ratioToPercent(0);
    this.hud.launchMarker.style.left = ratioToPercent(0.66);
    this.hud.launchNeedle.style.left = ratioToPercent(0);
    this.hud.launchLabel.textContent = 'Tap SHIFT in the green zone';
    this.hud.speedNeedle.style.transform = `translate(-31%, -55%) rotate(${speedToNeedleAngle(this.player.rpm, 1)}deg)`;
    this.hud.speedNeedle.classList.remove('shift-ready');
    this.hud.nosBtn.disabled = true;
    this.hud.shiftBtn.disabled = false;
    this.resultShown = false;
    this.finishSequenceActive = false;
    this.finishSequenceTimer = 0;
    this.finishSnapshot = null;
    this.updateTrailerPhase();
  }

  setupTrailerMedia() {
    this.trailerMedia.stage = document.getElementById('stageBackplate');
    this.trailerMedia.race = document.getElementById('raceBackplate');
    this.trailerMedia.dust = document.getElementById('dustBackplate');

    for (const media of Object.values(this.trailerMedia)) {
      if (!media) continue;
      media.pause();
      media.removeAttribute('src');
      media.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
      media.load();
      media.style.display = 'none';
    }

    this.updateTrailerPhase();
  }

  updateTrailerPhase() {
    if (!this.gameScreen) return;
    const racePhase = this.cameraMode === 'race' || this.finishSequenceActive || this.resultShown;
    this.gameScreen.classList.toggle('game-phase-race', racePhase);
  }

  async playIntroSequence() {
    await this.animateStaging();
    await this.runCountdown();
    this.startRace();
  }

  animateStaging() {
    return new Promise((resolve) => {
      this.cameraMode = 'staging';
      const duration = 2300;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        this.playerCarModel.position.x = lerp(3.2, this.playerLane.x, ease);
        this.botCarModel.position.x = lerp(-3.2, this.botLane.x, ease);
        this.playerCarModel.position.z = lerp(10.6, this.playerLane.z, ease);
        this.botCarModel.position.z = lerp(8.5, this.botLane.z, ease);
        this.playerCarModel.position.y = (this.playerCarConfig.modelYOffset ?? 0) + 0.03 + Math.sin(t * Math.PI * 3.2) * 0.008;
        this.botCarModel.position.y = (this.botCarConfig.modelYOffset ?? 0) + 0.03 + Math.sin(t * Math.PI * 3.2 + 0.45) * 0.008;

        const cam = this.scenePack.camera;
        const stageLookX = lerp(-0.4, -0.55, ease);
        const stageLookY = lerp(1.55, 1.2, ease);
        const stageLookZ = lerp(5.8, 4.6, ease);
        const rotatedStageCamera = rotatePointAroundY(
          lerp(10.8, 8.8, ease),
          lerp(18.8, 14.5, ease),
          stageLookX,
          stageLookZ,
          CAMERA_YAW_OFFSET,
          CAMERA_RADIUS_SCALE
        );
        cam.position.x = rotatedStageCamera.x;
        cam.position.y = lerp(3.1, 2.55, ease);
        cam.position.z = rotatedStageCamera.z;
        cam.lookAt(stageLookX, stageLookY, stageLookZ);
        this.scenePack.renderer.render(this.scenePack.scene, this.scenePack.camera);

        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };

      requestAnimationFrame(tick);
    });
  }

  runCountdown() {
    return new Promise(async (resolve) => {
      this.cameraMode = 'countdown';
      const overlay = this.hud.countdownOverlay;
      const text = this.hud.countdownText;
      overlay.classList.remove('hidden');

      for (const step of ['3', '2', '1', 'GO!']) {
        text.textContent = step;
        text.classList.remove('show');
        void text.offsetWidth;
        text.classList.add('show');
        this.hud.shiftFeedback.textContent = step === 'GO!' ? 'LAUNCH' : 'GET READY';
        await this.wait(step === 'GO!' ? 700 : 820);
      }

      overlay.classList.add('hidden');
      resolve();
    });
  }

  startRace() {
    this.raceStarted = true;
    this.cameraMode = 'launch';
    this.launchBoostTime = 1.1;
    this.player.speed = Math.max(this.player.speed, this.player.launchBonus);
    this.hud.shiftBtn.disabled = false;
    this.hud.nosBtn.disabled = false;
    this.hud.shiftFeedback.textContent = this.player.launchRating || 'AUTO';
    this.hud.shiftFeedback.style.color = '#ffffff';
    this.hud.raceStatus.textContent = 'Perfect shifts build your lead.';
    this.hud.launchLabel.textContent = `Launch: ${this.player.launchRating || 'AUTO'}`;
    this.updateTrailerPhase();
    this.flashStart();
    this.clock.start();
  }

  flashStart() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '20';
    flash.style.background = 'radial-gradient(circle, rgba(255,255,255,0.75), rgba(255,255,255,0.12), rgba(255,255,255,0))';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 420ms ease';
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.opacity = '0';
    });
    setTimeout(() => flash.remove(), 500);
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  handleShift() {
    if (!this.running || this.finished) return;

    if (!this.raceStarted) {
      if (this.launchLocked) return;
      const launch = setLaunchWindow(this.player);
      this.launchLocked = true;
      this.hud.shiftFeedback.textContent = launch.rating;
      this.hud.shiftFeedback.style.color = launch.rating === 'PERFECT' ? '#ffcc48' : launch.rating === 'GOOD' ? '#7fe7ff' : '#ff7e6b';
      this.hud.launchLabel.textContent = `Launch locked: ${launch.rating}`;
      this.hud.raceStatus.textContent = 'Wait for green.';
      return;
    }

    const prevSpeed = this.player.speed;
    const result = shiftRacer(this.player);
    if (result.result === 'LOCKED') return;
    if (this.player.speed < prevSpeed) this.player.speed = prevSpeed + Math.max(6, result.bonus * 0.5);
    this.hud.shiftFeedback.textContent = result.result;
    this.hud.raceStatus.textContent =
      result.result === 'PERFECT' ? 'Clean shift. Keep chaining.' :
      result.result === 'GOOD' ? 'Good shift. Stay in the band.' :
      'Too early or too late.';
    this.hud.shiftFeedback.style.color =
      result.result === 'PERFECT' ? '#ffcc48' :
      result.result === 'GOOD' ? '#7fe7ff' :
      '#ffd57b';
  }

  handleNos() {
    if (!this.running || this.finished || !this.raceStarted) return;
    const success = tryUseNos(this.player);
    if (!success) return;
    appState.hasUsedNos = true;
    this.hud.nosBtn.disabled = true;
    this.hud.shiftFeedback.textContent = 'NOS!';
    this.hud.shiftFeedback.style.color = '#ff4f74';
    this.hud.raceStatus.textContent = 'Nitrous is in. Finish the pull.';
  }

  updateShiftReadyIndicator() {
    const shiftReady =
      this.raceStarted &&
      !this.finishSequenceActive &&
      this.player.gear < this.player.maxGear &&
      this.player.rpm >= this.player.car.shiftWindowMin &&
      this.player.rpm <= this.player.car.shiftWindowMax;

    this.hud.speedNeedle.classList.toggle('shift-ready', shiftReady);
  }

  finishRace() {
    if (this.finishSequenceActive || this.resultShown) return;

    this.finished = true;
    this.player.finished = true;
    this.bot.finished = true;
    this.player.distance = Math.min(this.player.distance, this.trackLength);
    this.bot.distance = Math.min(this.bot.distance, this.trackLength);
    this.player.speed = 0;
    this.bot.speed = 0;
    this.player.rpm = 0;
    this.bot.rpm = 0;
    const playerWon = this.player.distance >= this.bot.distance;
    const result = playerWon ? 'WIN' : 'LOSE';
    appState.raceResult = result;
    appState.raceTime = Number(this.elapsed.toFixed(2));
    this.finishSequenceActive = true;
    this.finishSequenceTimer = 0;
    this.finishSnapshot = { result, playerWon, time: appState.raceTime };
    this.hud.shiftBtn.disabled = true;
    this.hud.nosBtn.disabled = true;
    this.hud.shiftFeedback.textContent = 'FINISH';
    this.hud.shiftFeedback.style.color = '#ffffff';
    this.hud.raceStatus.textContent = 'Finish line crossed. Cars stopped on the line.';
    this.hud.speedNeedle.classList.remove('shift-ready');
  }

  showRaceResult() {
    if (this.resultShown || !this.finishSnapshot) return;

    this.resultShown = true;
    this.running = false;
    const { result, time } = this.finishSnapshot;
    this.destroy();
    this.onFinish?.({ result, time });
  }

  updatePostFinish(dt) {
    this.finishSequenceTimer += dt;
    this.player.speed = 0;
    this.bot.speed = 0;
    this.player.rpm = lerp(this.player.rpm, 0, 0.18);
    this.bot.rpm = lerp(this.bot.rpm, 0, 0.18);

    this.hud.speedValue.textContent = `${Math.round(this.player.speed)}`;
    this.hud.rpmValue.textContent = this.player.rpm.toFixed(2);
    this.hud.rpmFill.style.width = ratioToPercent(this.player.rpm);
    this.hud.launchNeedle.style.left = ratioToPercent(this.player.rpm);
    this.hud.speedNeedle.style.transform = `translate(-31%, -55%) rotate(${speedToNeedleAngle(this.player.rpm, 1)}deg)`;
    this.hud.speedNeedle.classList.remove('shift-ready');

    this.animateCars(dt);

    if (this.finishSequenceTimer >= this.finishSequenceDuration) {
      this.showRaceResult();
    }
  }

  updateWorld(dt) {
    if (!this.raceStarted) {
      this.elapsed += dt;
      if (this.cameraMode === 'countdown') {
        updateLaunchRpm(this.player, this.elapsed);
      } else {
        this.player.rpm = 0;
      }
      this.hud.rpmValue.textContent = this.player.rpm.toFixed(2);
      this.hud.rpmFill.style.width = ratioToPercent(this.player.rpm);
      this.hud.launchNeedle.style.left = ratioToPercent(this.player.rpm);
      this.hud.speedNeedle.style.transform = `translate(-31%, -55%) rotate(${speedToNeedleAngle(this.player.rpm, 1)}deg)`;
      this.animateCars(dt);
      this.updateShiftReadyIndicator();
      return;
    }

    if (this.finishSequenceActive) {
      this.updatePostFinish(dt);
      return;
    }

    this.elapsed += dt;
    this.hud.raceTimer.textContent = formatTimer(this.elapsed);
    updateRacer(this.player, dt);
    updateRacer(this.bot, dt);
    updateBotAutoShift(this.bot);
    this.applyRaceDirector();

    if (this.launchBoostTime > 0) {
      this.launchBoostTime -= dt;
      if (this.launchBoostTime <= 0 && this.cameraMode === 'launch') {
        this.cameraMode = 'race';
        this.updateTrailerPhase();
      }
    }

    const playerProgressRatio = clamp(this.player.distance / this.trackLength, 0, 1);
    const botProgressRatio = clamp(this.bot.distance / this.trackLength, 0, 1);
    this.hud.playerProgress.style.left = `${playerProgressRatio * 100}%`;
    this.hud.botProgress.style.left = `${botProgressRatio * 100}%`;
    this.hud.gearValue.textContent = String(this.player.gear);
    this.hud.speedValue.textContent = `${Math.round(this.player.speed)}`;
    this.hud.rpmValue.textContent = this.player.rpm.toFixed(2);
    this.hud.rpmFill.style.width = ratioToPercent(this.player.rpm);
    this.hud.launchNeedle.style.left = ratioToPercent(this.player.rpm);
    this.hud.speedNeedle.style.transform = `translate(-31%, -55%) rotate(${speedToNeedleAngle(this.player.rpm, 1)}deg)`;
    this.updateShiftReadyIndicator();
    this.animateCars(dt);

    if (this.player.distance >= this.trackLength || this.bot.distance >= this.trackLength) {
      this.finishRace();
    }
  }

  applyRaceDirector() {
    const lead = this.bot.distance - this.player.distance;
    const gapToPlayer = this.player.distance - this.bot.distance;
    const playerFinishRatio = this.trackLength > 0 ? this.player.distance / this.trackLength : 0;
    const desiredGap = playerFinishRatio > 0.84 ? 0.38 : 0.52;
    const maxBotDistance = Math.max(0, this.player.distance - desiredGap);

    if (lead > -3.2) {
      const softCap = this.player.speed * 0.986 + 2.1;
      this.bot.speed = Math.min(this.bot.speed, softCap);
    }

    if (lead > 1.4) {
      this.bot.speed *= 0.955;
    }

    if (playerFinishRatio > 0.72) {
      this.bot.speed *= 0.99;
    }

    if (playerFinishRatio > 0.88) {
      this.bot.speed = Math.min(this.bot.speed, this.player.speed * 0.955);
    }

    if (gapToPlayer > desiredGap + 1.1) {
      const catchupBoost = clamp((gapToPlayer - desiredGap - 1.1) * 3.7, 0, 7.2);
      this.bot.speed = Math.min(this.bot.speed + catchupBoost, this.player.speed + 6.2);
    }

    if (this.bot.distance > maxBotDistance) {
      this.bot.distance = maxBotDistance;
      this.bot.speed = Math.min(this.bot.speed, this.player.speed * 0.994);
    }
  }

  scrollLoop(group, delta, repeatLength) {
    if (!group) return;
    group.position.z += delta;
    if (group.position.z > repeatLength) group.position.z = 0;
  }

  animateCars(dt) {
    if (!this.playerCarModel || !this.botCarModel) return;
    const gap = clamp((this.player.distance - this.bot.distance) * WORLD_GAP_SCALE, -8.5, 8.5);
    const playerTravel = clamp(this.player.distance * WORLD_TRAVEL_SCALE, 0, MAX_WORLD_TRAVEL);
    const botTravel = clamp(this.bot.distance * WORLD_TRAVEL_SCALE, 0, MAX_WORLD_TRAVEL);

    this.playerCarModel.position.x = lerp(this.playerCarModel.position.x, this.playerLane.x, 0.08);
    this.botCarModel.position.x = lerp(this.botCarModel.position.x, this.botLane.x, 0.08);
    this.playerCarModel.position.y = lerp(this.playerCarModel.position.y, (this.playerCarConfig.modelYOffset ?? 0) + 0.03 + Math.sin(this.elapsed * 12) * 0.008, 0.08);
    this.botCarModel.position.y = lerp(this.botCarModel.position.y, (this.botCarConfig.modelYOffset ?? 0) + 0.03 + Math.sin(this.elapsed * 11) * 0.008, 0.08);
    this.playerCarModel.position.z = lerp(this.playerCarModel.position.z, this.playerLane.z - playerTravel, 0.16);
    this.botCarModel.position.z = lerp(this.botCarModel.position.z, this.botLane.z - botTravel - gap, 0.16);
    this.playerCarModel.rotation.z = lerp(this.playerCarModel.rotation.z, (this.player.rpm - 0.5) * 0.016, 0.06);
    this.botCarModel.rotation.z = lerp(this.botCarModel.rotation.z, (this.bot.rpm - 0.5) * 0.016, 0.06);

    this.rotateWheels(this.playerCarModel, this.player.speed, dt);
    this.rotateWheels(this.botCarModel, this.bot.speed, dt);

    const sceneSpeed = Math.max(this.player.speed, this.bot.speed, 22);
    const roadScroll = sceneSpeed * dt * 3.8;
    this.scrollLoop(this.scenePack.runwayMarks, roadScroll * 1.18, 15);
    this.scrollLoop(this.scenePack.runwayLights, roadScroll * 1.22, 7);
    this.scrollLoop(this.scenePack.sideStreaks, roadScroll * 1.8, 12);
    this.scrollLoop(this.scenePack.dustField, roadScroll * 0.34, 24);
    this.updateCamera(sceneSpeed);
  }

  updateCamera(sceneSpeed) {
    const cam = this.scenePack.camera;
    const t = this.elapsed;
    const launchPunch = clamp(this.launchBoostTime / 1.1, 0, 1);
    const speedKick = clamp(sceneSpeed * 0.024, 0, 4.2);
    const microShakeY = Math.sin(t * 10) * 0.003;
    const microShakeX = Math.sin(t * 13) * 0.004;

    const leadOffset = clamp((this.player.distance - this.bot.distance) * 0.012, -0.9, 0.9);
    const playerZ = this.playerCarModel?.position.z ?? this.playerLane.z;
    const botZ = this.botCarModel?.position.z ?? this.botLane.z;
    const followZ = Math.min(playerZ, botZ + 0.8);

    let targetX = 10.2;
    let targetY = 2.36;
    let targetZ = followZ + 8.1;
    let lookX = -0.18 + leadOffset * 0.32;
    let lookY = 1.05;
    let lookZ = followZ - 1.05;

    if (this.cameraMode === 'countdown') {
      targetX = 9.8 + leadOffset * 0.18;
      targetY = 2.28;
      targetZ = followZ + 7.75;
      lookX = -0.08 + leadOffset * 0.18;
      lookY = 1.02;
      lookZ = followZ - 0.92;
    }

    if (this.cameraMode === 'launch') {
      targetX = 9.32 + leadOffset * 0.2;
      targetY = 2.18;
      targetZ = followZ + 6.85 - launchPunch * 0.55;
      lookX = 0.08 + leadOffset * 0.22;
      lookY = 1.0;
      lookZ = followZ - 0.9;
    }

    if (this.cameraMode === 'race') {
      const finishPullback = clamp(Math.max(this.player.distance, this.bot.distance) / this.trackLength, 0, 1);
      const finishPullbackBoost = clamp((finishPullback - 0.72) / 0.28, 0, 1);
      targetX = 9.6 + microShakeX + leadOffset * 0.22;
      targetY = 2.32 + microShakeY + finishPullbackBoost * 0.18;
      targetZ = followZ + 6.9 + speedKick * 0.2 + finishPullbackBoost * 3.6;
      lookX = 0.12 + leadOffset * 0.22;
      lookY = 1.04;
      lookZ = followZ - 1.15;
    }

    const rotatedTarget = rotatePointAroundY(targetX, targetZ, lookX, lookZ, CAMERA_YAW_OFFSET, CAMERA_RADIUS_SCALE);
    targetX = rotatedTarget.x;
    targetZ = rotatedTarget.z;

    const followLerp = this.cameraMode === 'race' ? 0.12 : 0.09;
    cam.position.x = lerp(cam.position.x, targetX, followLerp);
    cam.position.y = lerp(cam.position.y, targetY, followLerp);
    cam.position.z = lerp(cam.position.z, targetZ, followLerp + 0.04);

    if (!this.cameraLookTarget) {
      this.cameraLookTarget = new THREE.Vector3(lookX, lookY, lookZ);
    }

    this.cameraLookTarget.x = lerp(this.cameraLookTarget.x, lookX, 0.16);
    this.cameraLookTarget.y = lerp(this.cameraLookTarget.y, lookY, 0.16);
    this.cameraLookTarget.z = lerp(this.cameraLookTarget.z, lookZ, 0.2);
    cam.lookAt(this.cameraLookTarget);

    cam.fov = lerp(cam.fov, 44 + speedKick * 9, 0.06);
    cam.updateProjectionMatrix();
  }

  rotateWheels(carModel, speed, dt) {
    const wheels = carModel?.userData?.wheels;
    if (!wheels?.length) return;

    const spin = (speed * dt) / 0.55;
    for (const wheel of wheels) {
      const axis = wheel.userData?.spinAxis ?? 'x';
      wheel.rotation[axis] -= spin;
    }
  }

  loop() {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.033);
    this.updateWorld(dt);
    this.scenePack.renderer.render(this.scenePack.scene, this.scenePack.camera);
    requestAnimationFrame(this.loop);
  }

  handleResize() {
    if (!this.scenePack) return;
    const { camera, renderer } = this.scenePack;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    this.running = false;
    this.launchLocked = false;
    this.hud.hud.classList.add('hidden');
    this.hud.resultOverlay.classList.add('hidden');
    this.hud.shiftBtn.removeEventListener('click', this.handleShift);
    this.hud.nosBtn.removeEventListener('click', this.handleNos);
    window.removeEventListener('resize', this.handleResize);
    this.gameScreen?.classList.remove('game-phase-race');
    for (const media of Object.values(this.trailerMedia)) {
      media?.pause();
    }
    if (this.scenePack?.renderer) this.scenePack.renderer.dispose();
    this.wrap.innerHTML = '';
  }
}

