export async function sendVote({ name, answer, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbwCoL6sepvu8FHWGvZVK2uRiUf6-bTEduo-Qe9HIRZkQrdMESdMBL3Dsvje5-5qswYt/exec';

  const payload = {
    name,
    answer,
    drinkPreferences,
    foodPreference,
    createdAt: new Date().toISOString()
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return { ok: true };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}
