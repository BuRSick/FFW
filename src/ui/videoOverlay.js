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
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.volume = 1;
    video.controls = false;
    video.loop = false;
    video.preload = 'auto';

    video.addEventListener('ended', handleEnd, { once: true });
    video.addEventListener('error', handleEnd, { once: true });
    skipBtn?.addEventListener('click', handleSkip);

    try {
      video.load();
    } catch {}

    const playWithFallback = async () => {
      try {
        video.muted = false;
        await video.play();
        return;
      } catch {}

      try {
        // Mobile browsers may block post-race autoplay with sound.
        video.muted = true;
        await video.play();
        return;
      } catch {}

      finish();
    };

    playWithFallback();
  });
}
