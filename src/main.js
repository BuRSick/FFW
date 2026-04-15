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

function boot() {
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

    currentGame?.destroy();

    currentGame = new DragRaceGame({
      playerCar: appState.playerCar,
      botCar: appState.botCar,
      onFinish: async () => {
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
    await currentGame.start();
  });

  initInvite();
  showScreen('openingScreen');
}

boot();
