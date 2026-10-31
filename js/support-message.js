// Occasional spoken support message between completed tracks.
// Uses the browser's built-in speech engine; no audio files, packages, or API calls.
const SupportMessage = (() => {
  const MESSAGE = 'Enjoying the ad-free music? Consider donating.';
  let completedTracks = 0;
  let nextThreshold = randomThreshold();
  let handlingEnd = false;

  function randomThreshold() {
    return Math.floor(Math.random() * 3) + 4; // 4, 5, or 6 tracks
  }

  function speak() {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(MESSAGE);
      utterance.lang = 'en-IN';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.85;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        resolve();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      // Prevent a failed speech engine from holding up the queue indefinitely.
      window.setTimeout(finish, 12000);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  async function afterTrackEnds() {
    if (handlingEnd) return;
    handlingEnd = true;

    try {
      completedTracks += 1;
      if (completedTracks < nextThreshold) return;

      completedTracks = 0;
      nextThreshold = randomThreshold();
      await speak();
    } finally {
      handlingEnd = false;
    }
  }

  return { afterTrackEnds };
})();
