export async function sendVote({ name, answer, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbwCoL6sepvu8FHWGvZVK2uRiUf6-bTEduo-Qe9HIRZkQrdMESdMBL3Dsvje5-5qswYt/exec';

  try {
    const url = new URL(endpoint);
    url.searchParams.set('name', name || '');
    url.searchParams.set('answer', answer || '');
    url.searchParams.set('drinkPreferences', drinkPreferences.join(' | '));
    url.searchParams.set('foodPreference', foodPreference || '');
    url.searchParams.set('createdAt', new Date().toISOString());
    url.searchParams.set('_', String(Date.now()));

    await fireImageBeacon(url.toString());
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
