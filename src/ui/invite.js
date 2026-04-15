import { sendVote } from '../services/api.js';
import { appState } from '../core/state.js';

const CEREMONY_DATE = new Date('2026-06-22T11:00:00+03:00');

export function initInvite() {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const status = document.getElementById('rsvpStatus');
  const guestName = document.getElementById('inviteGuestName');
  const raceSummary = document.getElementById('inviteRaceSummary');
  const raceBadge = document.getElementById('inviteRaceBadge');
  const countDays = document.getElementById('countDays');
  const countHours = document.getElementById('countHours');
  const countMinutes = document.getElementById('countMinutes');
  const countSeconds = document.getElementById('countSeconds');

  let countdownTimer = null;

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

    if (raceSummary && raceBadge) {
      const time = Number(appState.raceTime || 0).toFixed(2);
      const win = appState.raceResult === 'WIN';

      raceBadge.textContent = win ? 'Квалификация пройдена' : 'Заезд завершен';
      raceSummary.textContent = win
        ? `Skyline прошел дистанцию за ${time} с. Теперь главный старт вечера ждет тебя уже не на трассе, а рядом с нами.`
        : `Даже если Supra пришла чуть раньше, твой пропуск на главный старт вечера уже активирован. Твое время: ${time} с.`;
    }

    startCountdown();
  }

  async function handle(answer) {
    if (!yesBtn || !noBtn || !status) return;

    yesBtn.disabled = true;
    noBtn.disabled = true;
    status.textContent = 'Сохраняем ответ...';

    const result = await sendVote({
      name: appState.playerName,
      answer,
      car: appState.playerCar?.name || '',
      result: appState.raceResult,
      raceTime: appState.raceTime
    });

    if (result.ok) {
      status.textContent = 'Ответ сохранен. Спасибо, увидимся на старте!';
      return;
    }

    yesBtn.disabled = false;
    noBtn.disabled = false;
    status.textContent = 'Не удалось сохранить ответ. Проверь подключение и URL скрипта.';
  }

  document.addEventListener('screenchange', (event) => {
    if (event.detail?.screenId === 'inviteScreen') {
      renderInvite();
    }
  });

  renderInvite();
  yesBtn?.addEventListener('click', () => handle('yes'));
  noBtn?.addEventListener('click', () => handle('no'));
}
