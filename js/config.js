// Chain Reaction Carnival settings. Change these without touching the game code.
window.CR_CONFIG = {
  // Paste the SAME Google Apps Script web-app link used by the other Quizmas games.
  // While empty, scores are kept safely on the device and sent later.
  SHEETS_URL: "https://script.google.com/macros/s/AKfycbzxAbynK-IJnqTZnjvMTBGATtzqUDDBsUL1kxRjUNJGn_zTyS02vBRsnm8DaHUpS7DC/exec",
  GAME_ID: "chain-reaction",
  GAME_NAME: "Chain Reaction Carnival",
  // Fun games are saved apart from the skill-based games (their own "Fun Scores" tab).
  CATEGORY: "Entertainment",
  // Building time, in seconds, for each ride.
  RIDE_TIME: { 1: 70, 2: 80, 3: 100 },
  // How many times the student can set off each ride.
  TRIES_PER_RIDE: 3,
  // "Back to my track" links. Open the game with ?from=graphics (or coding / video)
  // and the button takes students back there. Leave a link empty to hide its button.
  TRACK_LINKS: {
    graphics: "",
    coding: "",
    video: "",
  },
  TRACK_NAMES: { graphics: "Graphic Design", coding: "Coding", video: "Video Editing" },
  // Minimum time the loading screen stays up, so it never just flashes.
  LOADER_MIN_MS: 2400,
};
// Shared modules read the settings from this name.
window.DR_CONFIG = window.CR_CONFIG;
