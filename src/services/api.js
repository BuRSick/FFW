export async function sendVote({ name, answer, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbyjhAxrBFXICU0s9bXJ5m6uFjoi-FeKYaygV9JvLYeB64mP3tcbA5eiUTAyTpH55oCE/exec';

  try {
    const payload = new URLSearchParams();
    payload.set('name', name || '');
    payload.set('answer', answer || '');
    payload.set('drinkPreferences', drinkPreferences.join(' | '));
    payload.set('foodPreference', foodPreference || '');
    payload.set('createdAt', new Date().toISOString());
    payload.set('_', String(Date.now()));

    if (navigator.sendBeacon) {
      const body = new Blob([payload.toString()], {
        type: 'application/x-www-form-urlencoded;charset=UTF-8'
      });

      if (navigator.sendBeacon(endpoint, body)) {
        return { ok: true, dispatched: true, transport: 'beacon' };
      }
    }

    const url = `${endpoint}?${payload.toString()}`;
    await fireImageBeacon(url);
    return { ok: true, dispatched: true };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}

function fireImageBeacon(src) {
  return new Promise((resolve, reject) => {
    const beacon = new Image();
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(result);
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      reject(error);
    };

    const timeoutId = window.setTimeout(() => {
      finish({ timeout: true });
    }, 2500);

    beacon.onload = () => finish({ loaded: true });
    // Apps Script returns text/html, so image decoding can fail even if the request reached the script.
    beacon.onerror = () => finish({ fallback: true });
    beacon.referrerPolicy = 'no-referrer';
    beacon.src = src;

    if (!beacon.src) {
      fail(new Error('Beacon source was not assigned'));
    }
  });
}
