export function playPreRaceVideo() {
  const video = document.getElementById('preRaceVideo');
  const playBtn = document.getElementById('preRaceVideoPlayBtn');

  if (!video) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let finished = false;

    const cleanup = () => {
      video.pause();
      video.currentTime = 0;
      video.removeEventListener('ended', handleEnd);
      video.removeEventListener('error', handleEnd);
      playBtn?.removeEventListener('click', handleManualPlay);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };

    const handleEnd = () => finish();

    const handleManualPlay = async () => {
      playBtn?.classList.add('hidden');

      try {
        await video.play();
      } catch {
        finish();
      }
    };

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.controls = false;
    video.loop = false;

    video.addEventListener('ended', handleEnd, { once: true });
    video.addEventListener('error', handleEnd, { once: true });
    playBtn?.addEventListener('click', handleManualPlay);

    video.play().catch(() => {
      playBtn?.classList.remove('hidden');
    });
  });
}
