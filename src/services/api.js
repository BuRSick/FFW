export async function sendVote({ name, answer, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbwCoL6sepvu8FHWGvZVK2uRiUf6-bTEduo-Qe9HIRZkQrdMESdMBL3Dsvje5-5qswYt/exec';

  try {
    const url = new URL(endpoint);
    url.searchParams.set('name', name || '');
    url.searchParams.set('answer', answer || '');
    url.searchParams.set('drinkPreferences', drinkPreferences.join(' | '));
    url.searchParams.set('foodPreference', foodPreference || '');
    url.searchParams.set('createdAt', new Date().toISOString());

    await fetch(url.toString(), {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store'
    });

    return { ok: true };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}
