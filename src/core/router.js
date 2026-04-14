const screenIds = [
  'introScreen',
  'formScreen',
  'preRaceVideoScreen',
  'gameScreen',
  'inviteScreen'
];

export function showScreen(screenId) {
  for (const id of screenIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.classList.toggle('active', id === screenId);
  }

  document.dispatchEvent(
    new CustomEvent('screenchange', {
      detail: { screenId }
    })
  );
}
