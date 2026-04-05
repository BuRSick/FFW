export function initForm(onSubmit) {
  const input = document.getElementById('playerNameInput');
  const btn = document.getElementById('startRaceBtn');

  const submit = () => {
    const name = input?.value?.trim();

    if (!name || name.length < 2) {
      input?.focus();
      return;
    }

    onSubmit(name);
  };

  btn?.addEventListener('click', submit);
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      submit();
    }
  });
}