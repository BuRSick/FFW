export function initIntro(onContinue) {
  const startBtn = document.getElementById('openInviteBtn');
  const video = document.getElementById('introVideo');
  let opened = false;

  const openInvite = () => {
    if (opened) return;
    opened = true;

    if (video) {
      video.muted = false;
      video.play().catch(() => {});
    }

    onContinue();
  };

  startBtn?.addEventListener('click', openInvite);
  startBtn?.addEventListener('pointerup', openInvite);
}
