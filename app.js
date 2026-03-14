(() => {
  const roomCodeEl = document.getElementById("roomCode");
  const genRoomBtn = document.getElementById("genRoom");
  const fill = document.getElementById("fill");
  const phase = document.getElementById("phase");

  const phases = [
    { label: "Collecting fakes", meter: 38 },
    { label: "Voting", meter: 64 },
    { label: "Reveal", meter: 92 },
    { label: "Scoreboard", meter: 100 },
  ];

  let phaseIndex = 0;

  function randomRoomCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 4; i += 1) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  function applyPhase() {
    const p = phases[phaseIndex];
    phase.textContent = p.label;
    fill.style.width = `${p.meter}%`;
  }

  function tickPhase() {
    phaseIndex = (phaseIndex + 1) % phases.length;
    applyPhase();
  }

  function setRoomCode(code) {
    roomCodeEl.textContent = code;
  }

  genRoomBtn?.addEventListener("click", () => {
    setRoomCode(randomRoomCode());
    tickPhase();
  });

  // Make nav anchor clicks feel snappy without relying on browser defaults.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);
    });
  });

  setRoomCode("----");
  applyPhase();
})();

