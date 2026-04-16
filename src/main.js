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
let introBackgroundTime = 0;

function getIntroVideo() {
  return document.getElementById('introVideo');
}

function getRaceBackgroundVideo() {
  return document.getElementById('raceBackgroundVideo');
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

function pauseIntroVideo() {
  const introVideo = getIntroVideo();
  if (!introVideo) return;

  introBackgroundTime = introVideo.currentTime || 0;
  introVideo.pause();
}

async function startRaceBackgroundVideo() {
  const raceVideo = getRaceBackgroundVideo();
  if (!raceVideo) return;

  raceVideo.style.display = 'block';
  raceVideo.currentTime = introBackgroundTime || 0;
  raceVideo.muted = false;
  raceVideo.volume = 1;

  try {
    await raceVideo.play();
  } catch {}
}

function stopRaceBackgroundVideo() {
  const raceVideo = getRaceBackgroundVideo();
  if (!raceVideo) return;

  raceVideo.pause();
  raceVideo.currentTime = 0;
  raceVideo.style.display = 'none';
}

function boot() {
  warmVideoElement('preRaceVideo');
  warmVideoElement('postRaceVideo');

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
        await playVideoOverlay({
          videoId: 'postRaceVideo',
          skipButtonId: 'postRaceVideoSkipBtn'
        });
        showScreen('inviteScreen');
      }
    });

    showScreen('preRaceVideoScreen');
    const preparePromise = currentGame.prepare();
    await playVideoOverlay({
      videoId: 'preRaceVideo',
      skipButtonId: 'preRaceVideoSkipBtn'
    });
    showScreen('gameScreen');
    await preparePromise;
    await startRaceBackgroundVideo();
    await currentGame.start();
  });

  initInvite();
  showScreen('openingScreen');
}

boot();
