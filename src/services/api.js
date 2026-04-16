export async function sendVote({ name, answer, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbwCoL6sepvu8FHWGvZVK2uRiUf6-bTEduo-Qe9HIRZkQrdMESdMBL3Dsvje5-5qswYt/exec';

  const payload = new URLSearchParams({
    name: name || '',
    answer: answer || '',
    drinkPreferences: drinkPreferences.join(' | '),
    foodPreference: foodPreference || '',
    createdAt: new Date().toISOString()
  });

  try {
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: payload.toString()
    });

    return { ok: true };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}
