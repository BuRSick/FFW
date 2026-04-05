export function initIntro(onContinue) {
  const startBtn = document.getElementById('startIntroBtn');
  const video = document.getElementById('introVideo');

  startBtn?.addEventListener('click', () => {
    if (video) {
      video.muted = false;
      video.play().catch(() => {});
    }

    onContinue();
  });
}