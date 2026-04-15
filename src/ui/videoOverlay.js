export function playVideoOverlay({ videoId, skipButtonId }) {
  const video = document.getElementById(videoId);
  const skipBtn = document.getElementById(skipButtonId);

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
      skipBtn?.removeEventListener('click', handleSkip);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };

    const handleEnd = () => finish();
    const handleSkip = () => finish();

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.controls = false;
    video.loop = false;

    video.addEventListener('ended', handleEnd, { once: true });
    video.addEventListener('error', handleEnd, { once: true });
    skipBtn?.addEventListener('click', handleSkip);

    video.play().catch(() => finish());
  });
}
