import './style.css';

import { getBotCar, getPlayerCar } from './config/cars.js';
import { getCutsceneByPlayerName } from './config/cutscenes.js';
import { showScreen } from './core/router.js';
import { appState } from './core/state.js';
import { DragRaceGame } from './game/DragRaceGame.js';
import { initForm } from './ui/form.js';
import { initIntro } from './ui/intro.js';
import { initInvite } from './ui/invite.js';
import { playVideoOverlay } from './ui/videoOverlay.js';

let currentGame = null;
let video1PlaybackTime = 0;

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function getIntroVideo() {
  return document.getElementById('introVideo');
}

function getRaceBackgroundVideo() {
  return document.getElementById('raceBackgroundVideo');
}

function getInviteBackgroundVideo() {
  return document.querySelector('#inviteScreen .invite-bg-video');
}

function warmVideoElement(id) {
  const video = document.getElementById(id);
  if (!video) return;

  video.preload = 'auto';
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  try {
    video.load();
  } catch {}
}

function warmVideoNode(video) {
  if (!video) return;

  video.preload = 'auto';
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  try {
    video.load();
  } catch {}
}

function pauseIntroVideo() {
  const introVideo = getIntroVideo();
  if (!introVideo) return;

  video1PlaybackTime = introVideo.currentTime || 0;
  introVideo.pause();
}

async function startRaceBackgroundVideo() {
  const raceVideo = getRaceBackgroundVideo();
  if (!raceVideo) return;

  raceVideo.style.display = 'block';
  raceVideo.currentTime = video1PlaybackTime || 0;
  raceVideo.muted = false;
  raceVideo.volume = 1;

  try {
    await raceVideo.play();
  } catch {}
}

function stopRaceBackgroundVideo() {
  const raceVideo = getRaceBackgroundVideo();
  if (!raceVideo) return;

  video1PlaybackTime = raceVideo.currentTime || video1PlaybackTime || 0;
  raceVideo.pause();
  raceVideo.currentTime = 0;
  raceVideo.style.display = 'none';
}

async function startInviteBackgroundVideo() {
  const inviteVideo = getInviteBackgroundVideo();
  if (!inviteVideo) return;

  if (Math.abs((inviteVideo.currentTime || 0) - (video1PlaybackTime || 0)) > 0.35) {
    inviteVideo.currentTime = video1PlaybackTime || 0;
  }
  inviteVideo.muted = true;
  inviteVideo.defaultMuted = true;
  inviteVideo.volume = 0;
  inviteVideo.loop = true;
  inviteVideo.autoplay = true;
  inviteVideo.playsInline = true;
  inviteVideo.setAttribute('playsinline', '');
  inviteVideo.setAttribute('webkit-playsinline', '');

  try {
    await inviteVideo.play();
  } catch {}
}

function pauseInviteBackgroundVideo() {
  const inviteVideo = getInviteBackgroundVideo();
  if (!inviteVideo) return;

  video1PlaybackTime = inviteVideo.currentTime || video1PlaybackTime || 0;
  inviteVideo.pause();
}

function installInviteVideoGuards() {
  const inviteVideo = getInviteBackgroundVideo();
  if (!inviteVideo || inviteVideo.dataset.guardsInstalled === 'true') return;

  inviteVideo.dataset.guardsInstalled = 'true';

  const recover = async () => {
    const inviteScreen = document.getElementById('inviteScreen');
    if (!inviteScreen?.classList.contains('active')) return;
    await startInviteBackgroundVideo();
  };

  inviteVideo.addEventListener('ended', () => {
    inviteVideo.currentTime = 0;
    recover();
  });
  inviteVideo.addEventListener('pause', () => {
    if (!document.hidden) recover();
  });
  inviteVideo.addEventListener('stalled', recover);
  inviteVideo.addEventListener('suspend', recover);
  inviteVideo.addEventListener('waiting', recover);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recover();
  });
}

function boot() {
  warmVideoElement('preRaceVideo');
  warmVideoElement('postRaceVideo');
  warmVideoElement('postConfirmVideo');
  warmVideoNode(getInviteBackgroundVideo());
  installInviteVideoGuards();

  initIntro(() => {
    showScreen('introScreen');
  });

  initForm(async (playerName) => {
    appState.playerName = playerName;
    appState.playerCar = getPlayerCar();
    appState.botCar = getBotCar();
    appState.playerCutscene = getCutsceneByPlayerName(playerName);
    appState.raceResult = null;
    appState.raceTime = 0;
    appState.hasUsedNos = false;

    pauseIntroVideo();
    currentGame?.destroy();
    stopRaceBackgroundVideo();

    currentGame = new DragRaceGame({
      playerCar: appState.playerCar,
      botCar: appState.botCar,
      onFinish: async () => {
        stopRaceBackgroundVideo();
        showScreen('postRaceVideoScreen');
        await nextPaint();
        await playVideoOverlay({
          videoId: 'postRaceVideo',
          skipButtonId: 'postRaceVideoSkipBtn'
        });
        showScreen('inviteScreen');
        await nextPaint();
        await startInviteBackgroundVideo();
      }
    });

    showScreen('preRaceVideoScreen');
    const preparePromise = currentGame.prepare();
    await nextPaint();
    await playVideoOverlay({
      videoId: 'preRaceVideo',
      skipButtonId: 'preRaceVideoSkipBtn'
    });
    showScreen('gameScreen');
    await preparePromise;
    await startRaceBackgroundVideo();
    await currentGame.start();
  });

  initInvite({
    onConfirmYes: async () => {
      pauseInviteBackgroundVideo();
      showScreen('postConfirmVideoScreen');
      await nextPaint();
      await playVideoOverlay({
        videoId: 'postConfirmVideo'
      });
      showScreen('inviteScreen');
      await nextPaint();
      await startInviteBackgroundVideo();
    }
  });
  showScreen('openingScreen');
}

boot();
