export async function sendVote({ name, answer, drinkPreferences = [], foodPreference = '' }) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbwCoL6sepvu8FHWGvZVK2uRiUf6-bTEduo-Qe9HIRZkQrdMESdMBL3Dsvje5-5qswYt/exec';

  try {
    const iframeName = `rsvpTarget_${Date.now()}`;
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.action = endpoint;
    form.method = 'POST';
    form.target = iframeName;
    form.style.display = 'none';

    const fields = {
      name: name || '',
      answer: answer || '',
      drinkPreferences: drinkPreferences.join(' | '),
      foodPreference: foodPreference || '',
      createdAt: new Date().toISOString()
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    window.setTimeout(() => {
      form.remove();
      iframe.remove();
    }, 4000);

    return { ok: true };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}
