export async function sendVote({
  name,
  answer,
  drinkPreferences = [],
  allergy = '',
  transferPreference = '',
  shootingPreference = ''
}) {
  const endpoint = 'https://script.google.com/macros/s/AKfycbzRP39oqLpkIShm-38Wk0ZFSl98iR5bmsnnJBoII5ajMopxA39AleACqK2PdjHQ_rDJ/exec';

  try {
    const payload = {
      name: name || '',
      answer: answer || '',
      drinkPreferences: drinkPreferences.join(' | '),
      allergy: allergy || '',
      transferPreference: transferPreference || '',
      shootingPreference: shootingPreference || '',
      createdAt: new Date().toISOString(),
      _: String(Date.now())
    };

    if (navigator.sendBeacon) {
      const body = new Blob([new URLSearchParams(payload).toString()], {
        type: 'application/x-www-form-urlencoded;charset=UTF-8'
      });

      if (navigator.sendBeacon(endpoint, body)) {
        return { ok: true, dispatched: true, transport: 'beacon' };
      }
    }

    await submitWithHiddenForm(endpoint, payload);
    return { ok: true, dispatched: true, transport: 'iframe-form' };
  } catch (error) {
    console.error('Vote send error:', error);
    return { ok: false, error };
  }
}

function submitWithHiddenForm(action, payload) {
  return new Promise((resolve, reject) => {
    const frameName = `rsvp-submit-frame-${Date.now()}`;
    const iframe = document.createElement('iframe');
    const form = document.createElement('form');
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      iframe.remove();
      form.remove();
      resolve(result);
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      iframe.remove();
      form.remove();
      reject(error);
    };

    const timeoutId = window.setTimeout(() => {
      finish({ timeout: true });
    }, 4000);

    iframe.name = frameName;
    iframe.hidden = true;
    iframe.style.display = 'none';
    iframe.addEventListener('load', () => {
      finish({ loaded: true });
    });

    form.method = 'POST';
    form.action = action;
    form.target = frameName;
    form.acceptCharset = 'UTF-8';
    form.style.display = 'none';

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();

    if (!document.body.contains(form)) {
      fail(new Error('Hidden RSVP form was not attached'));
    }
  });
}
