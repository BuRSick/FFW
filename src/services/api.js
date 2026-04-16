export async function sendVote({ name, answer, car, result, raceTime, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'YOUR_GOOGLE_SCRIPT_URL';

  const payload = {
    name,
    answer,
    car,
    result,
    raceTime,
    drinkPreferences,
    foodPreference,
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { ok: true };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}
