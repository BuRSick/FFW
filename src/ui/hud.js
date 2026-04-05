export function createHudBindings() {
  return {
    hud: document.getElementById('hud'),
    playerCarName: document.getElementById('playerCarName'),
    opponentCarName: document.getElementById('opponentCarName'),
    raceTimer: document.getElementById('raceTimer'),
    playerProgress: document.getElementById('playerProgress'),
    botProgress: document.getElementById('botProgress'),
    gearValue: document.getElementById('gearValue'),
    shiftFeedback: document.getElementById('shiftFeedback'),
    raceStatus: document.getElementById('raceStatus'),
    speedValue: document.getElementById('speedValue'),
    rpmValue: document.getElementById('rpmValue'),
    speedNeedle: document.getElementById('speedNeedle'),
    rpmFill: document.getElementById('rpmFill'),
    launchNeedle: document.getElementById('launchNeedle'),
    launchMarker: document.getElementById('launchMarker'),
    launchLabel: document.getElementById('launchLabel'),
    shiftBtn: document.getElementById('shiftBtn'),
    nosBtn: document.getElementById('nosBtn'),
    debugPanel: document.getElementById('debugPanel'),
    debugContent: document.getElementById('debugContent'),
    resultOverlay: document.getElementById('resultOverlay'),
    resultTitle: document.getElementById('resultTitle'),
    resultSubtitle: document.getElementById('resultSubtitle'),
    continueToInviteBtn: document.getElementById('continueToInviteBtn'),
    countdownOverlay: document.getElementById('countdownOverlay'),
    countdownText: document.getElementById('countdownText')
  };
}

export function formatTimer(seconds) {
  return seconds.toFixed(2).padStart(5, '0');
}

export function speedToNeedleAngle(value, maxValue = 1) {
  const ratio = Math.max(0, Math.min(value / maxValue, 1));
  return -158 + ratio * 158;
}

export function ratioToPercent(value) {
  return `${Math.max(0, Math.min(value, 1)) * 100}%`;
}
