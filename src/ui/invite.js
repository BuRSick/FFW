import { sendVote } from '../services/api.js';
import { appState } from '../core/state.js';

const CEREMONY_DATE = new Date('2026-06-22T11:00:00+03:00');

export function initInvite({ onConfirmYes } = {}) {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const status = document.getElementById('rsvpStatus');
  const guestName = document.getElementById('inviteGuestName');
  const countDays = document.getElementById('countDays');
  const countHours = document.getElementById('countHours');
  const countMinutes = document.getElementById('countMinutes');
  const countSeconds = document.getElementById('countSeconds');
  const drinkInputs = Array.from(document.querySelectorAll('input[name="drinkPreference"]'));
  const transferInputs = Array.from(document.querySelectorAll('input[name="transferPreference"]'));
  const shootingInputs = Array.from(document.querySelectorAll('input[name="shootingPreference"]'));
  const allergyInput = document.getElementById('allergyInput');
  const preferenceInputs = [...drinkInputs, ...transferInputs, ...shootingInputs].filter(Boolean);

  let countdownTimer = null;
  let attendanceAnswer = null;
  let isSubmitting = false;
  let isLocked = false;

  function setCounter(days, hours, minutes, seconds) {
    if (countDays) countDays.textContent = String(days).padStart(2, '0');
    if (countHours) countHours.textContent = String(hours).padStart(2, '0');
    if (countMinutes) countMinutes.textContent = String(minutes).padStart(2, '0');
    if (countSeconds) countSeconds.textContent = String(seconds).padStart(2, '0');
  }

  function updateCountdown() {
    const diff = CEREMONY_DATE.getTime() - Date.now();

    if (diff <= 0) {
      setCounter(0, 0, 0, 0);
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setCounter(days, hours, minutes, seconds);
  }

  function startCountdown() {
    updateCountdown();
    if (countdownTimer) return;

    countdownTimer = window.setInterval(() => {
      updateCountdown();
    }, 1000);
  }

  function renderInvite() {
    if (guestName) {
      guestName.textContent = appState.playerName || 'Пилот';
    }

    startCountdown();
    updateSubmitAvailability();
  }

  function preferencesReady() {
    const hasDrink = drinkInputs.some((input) => input.checked);
    const hasTransfer = transferInputs.some((input) => input.checked);
    const hasShooting = shootingInputs.some((input) => input.checked);
    return hasDrink && hasTransfer && hasShooting;
  }

  function updateSubmitAvailability() {
    const enabled = preferencesReady() && !isSubmitting && !isLocked;
    if (yesBtn) yesBtn.disabled = !enabled;
    if (noBtn) noBtn.disabled = !enabled;
  }

  function setLockedState(locked) {
    isLocked = locked;
    preferenceInputs.forEach((input) => {
      input.disabled = locked;
    });

    if (allergyInput) {
      allergyInput.disabled = locked;
    }

    updateSubmitAvailability();
  }

  async function handle(answer) {
    if (!yesBtn || !noBtn || !status) return;
    if (!preferencesReady()) {
      status.textContent = 'Сначала выбери напитки, трансфер и ответ по мастер-классу.';
      updateSubmitAvailability();
      return;
    }

    attendanceAnswer = answer;
    isSubmitting = true;
    updateSubmitAvailability();
    status.textContent = 'Сохраняем ответ...';

    const drinkPreferences = drinkInputs.filter((input) => input.checked).map((input) => input.value);
    const allergy = allergyInput?.value?.trim() || '';
    const transferPreference = transferInputs.find((input) => input.checked)?.value || '';
    const shootingPreference = shootingInputs.find((input) => input.checked)?.value || '';

    const result = await sendVote({
      name: appState.playerName,
      answer,
      drinkPreferences,
      allergy,
      transferPreference,
      shootingPreference
    });

    if (result.ok) {
      status.textContent = 'Ответ сохранен. Спасибо!';
      setLockedState(true);
      isSubmitting = false;
      if (answer === 'yes') {
        await onConfirmYes?.();
      }
      return;
    }

    isSubmitting = false;
    updateSubmitAvailability();
    status.textContent = 'Не удалось сохранить ответ. Проверь подключение и URL скрипта.';
  }

  document.addEventListener('screenchange', (event) => {
    const isInviteScreen = event.detail?.screenId === 'inviteScreen';

    if (isInviteScreen) {
      renderInvite();
    }
  });

  renderInvite();
  yesBtn?.addEventListener('click', () => handle('yes'));
  noBtn?.addEventListener('click', () => handle('no'));

  drinkInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (isLocked) return;
      updateSubmitAvailability();
      if (attendanceAnswer) status.textContent = 'Изменения учтутся при следующем сохранении ответа.';
    });
  });

  transferInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (isLocked) return;
      updateSubmitAvailability();
      if (attendanceAnswer) status.textContent = 'Изменения учтутся при следующем сохранении ответа.';
    });
  });

  shootingInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (isLocked) return;
      updateSubmitAvailability();
      if (attendanceAnswer) status.textContent = 'Изменения учтутся при следующем сохранении ответа.';
    });
  });

  allergyInput?.addEventListener('input', () => {
    if (isLocked) return;
    if (attendanceAnswer) status.textContent = 'Изменения учтутся при следующем сохранении ответа.';
  });
}
