(function () {
  const STORAGE_KEY = 'deepflow-device-layout';
  const root = document.documentElement;
  const chooser = document.getElementById('deviceChoice');
  const laptopButton = document.getElementById('chooseLaptop');
  const mobileButton = document.getElementById('chooseMobile');
  const changeButton = document.getElementById('changeDeviceLayoutBtn');
  const backgroundChooser = document.getElementById('backgroundChoice');
  const BACKGROUND_CHOICE_KEY = 'resona-background-choice';

  function openBackgroundChooserIfNeeded() {
    let choice = null;
    try { choice = localStorage.getItem(BACKGROUND_CHOICE_KEY); } catch (_) {}
    if (!choice && backgroundChooser) backgroundChooser.classList.remove('hidden');
  }

  function applyLayout(layout) {
    const choice = layout === 'mobile' ? 'mobile' : 'laptop';
    root.dataset.deviceLayout = choice;
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (_) {}
    if (chooser) chooser.classList.add('hidden');
    openBackgroundChooserIfNeeded();
  }

  function openChooser() {
    if (chooser) chooser.classList.remove('hidden');
  }

  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  if (saved === 'mobile' || saved === 'laptop') {
    root.dataset.deviceLayout = saved;
    openBackgroundChooserIfNeeded();
  } else {
    openChooser();
  }

  if (laptopButton) laptopButton.addEventListener('click', () => applyLayout('laptop'));
  if (mobileButton) mobileButton.addEventListener('click', () => applyLayout('mobile'));
  if (changeButton) changeButton.addEventListener('click', openChooser);
})();
