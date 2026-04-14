const CUTSCENE_MAP = new Map([
['default', { id: 'default', character: 'street-racer', videoPath: 'assets/cutscenes/default.mp4' }]
]);

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function getCutsceneByPlayerName(name) {
  const normalized = normalizeName(name);
  return CUTSCENE_MAP.get(normalized) ?? CUTSCENE_MAP.get('default');
}
