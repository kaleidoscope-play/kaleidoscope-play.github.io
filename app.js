/* eslint-disable no-use-before-define */
(() => {
  const canvas = document.getElementById("kaleido");
  const ctx = canvas.getContext("2d", { alpha: true });

  const roomCodeEl = document.getElementById("roomCode");
  const copyRoomBtn = document.getElementById("copyRoom");
  const generateRoomBtn = document.getElementById("generateRoom");
  const resetDemoBtn = document.getElementById("resetDemo");
  const toggleLiveBtn = document.getElementById("toggleLive");
  const liveBadge = document.getElementById("liveBadge");
  const toggleMotionBtn = document.getElementById("toggleMotion");
  const intensityRange = document.getElementById("intensity");

  const statPlayers = document.getElementById("statPlayers");
  const statBluff = document.getElementById("statBluff");
  const statRounds = document.getElementById("statRounds");

  const questionText = document.getElementById("questionText");
  const answersWrap = document.getElementById("answers");
  const categoryPill = document.getElementById("categoryPill");
  const phaseText = document.getElementById("phaseText");
  const meterFill = document.getElementById("meterFill");
  const nextPhaseBtn = document.getElementById("nextPhase");
  const shuffleQBtn = document.getElementById("shuffleQ");

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  );

  let manualReducedMotion = false;
  let paused = false;
  let isLive = false;

  let pointerX = 0.5;
  let pointerY = 0.5;
  let intensity = 0.72;

  // A tiny pattern canvas that we repaint over time; the kaleidoscope is built from it.
  const texture = document.createElement("canvas");
  const tctx = texture.getContext("2d", { alpha: true });
  texture.width = 320;
  texture.height = 240;

  // Resize + DPR handling.
  function resize() {
    const dpr = Math.max(1, Math.min(2.2, window.devicePixelRatio || 1));
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Pointer steering for the prism.
  function setPointerFromEvent(ev) {
    const x = ev.clientX ?? (ev.touches && ev.touches[0]?.clientX);
    const y = ev.clientY ?? (ev.touches && ev.touches[0]?.clientY);
    if (typeof x !== "number" || typeof y !== "number") return;
    pointerX = clamp(x / window.innerWidth, 0, 1);
    pointerY = clamp(y / window.innerHeight, 0, 1);
  }

  window.addEventListener("pointermove", setPointerFromEvent, { passive: true });
  window.addEventListener("touchmove", setPointerFromEvent, { passive: true });

  // Demo dashboard logic
  const categories = [
    "World & Geography",
    "Science & Nature",
    "Pop Culture",
    "History",
    "Weird & Wonderful",
  ];

  const questionBank = [
    {
      category: "Weird & Wonderful",
      q: "What everyday object was once used as an early form of “paper” by Romans?",
      a: ["Bread crusts", "Onion skins", "Wax tablets", "Sea shells"],
      hotIndex: 2,
    },
    {
      category: "Science & Nature",
      q: "What is the only mammal known to have truly blue pigment in its skin?",
      a: ["A dolphin", "A baboon", "A bat", "A human"],
      hotIndex: 1,
    },
    {
      category: "History",
      q: "Which snack was once sold as a health food in pharmacies in the 1800s?",
      a: ["Popcorn", "Licorice", "Pretzels", "Chocolate bars"],
      hotIndex: 2,
    },
    {
      category: "Pop Culture",
      q: "Which instrument was accidentally created while trying to build a keyboard?",
      a: ["Theremin", "Synthesizer", "Mellotron", "Clavinet"],
      hotIndex: 0,
    },
    {
      category: "World & Geography",
      q: "Which country has a national animal that is a mythical creature?",
      a: ["Scotland", "Japan", "Brazil", "Norway"],
      hotIndex: 0,
    },
  ];

  const phases = [
    { label: "Collecting fakes", meter: 35 },
    { label: "Voting", meter: 62 },
    { label: "Reveal", meter: 92 },
    { label: "Scoreboard", meter: 100 },
  ];

  let phaseIndex = 0;
  let questionIndex = 0;

  function applyQuestion() {
    const item = questionBank[questionIndex];
    questionText.textContent = item.q;
    categoryPill.textContent = item.category;
    answersWrap.innerHTML = "";
    item.a.forEach((ans, idx) => {
      const div = document.createElement("div");
      div.className = "ans" + (idx === item.hotIndex ? " hot" : "");
      div.textContent = ans;
      answersWrap.appendChild(div);
    });
  }

  function applyPhase() {
    const phase = phases[phaseIndex];
    phaseText.textContent = phase.label;
    meterFill.style.width = `${phase.meter}%`;
  }

  function nextPhase() {
    phaseIndex = (phaseIndex + 1) % phases.length;
    applyPhase();
  }

  function shuffleQuestion() {
    questionIndex = (questionIndex + 1) % questionBank.length;
    applyQuestion();
  }

  nextPhaseBtn.addEventListener("click", nextPhase);
  shuffleQBtn.addEventListener("click", shuffleQuestion);
  applyQuestion();
  applyPhase();

  function setLive(next) {
    isLive = next;
    liveBadge.classList.toggle("isLive", isLive);
    liveBadge.querySelector(".label").textContent = isLive ? "LIVE" : "Ready";
    toggleLiveBtn.textContent = isLive ? "End live" : "Go live";
  }

  toggleLiveBtn.addEventListener("click", () => setLive(!isLive));

  function randomRoomCode() {
    // Stream-friendly: avoid ambiguous chars like I, O, 0, 1.
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 4; i += 1) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  function setRoomCode(code) {
    roomCodeEl.textContent = code;
    copyRoomBtn.disabled = code === "----";
  }

  async function copyRoomCode() {
    const code = roomCodeEl.textContent.trim();
    if (!code || code === "----") return;
    try {
      await navigator.clipboard.writeText(code);
      toast(`Copied ${code}`);
    } catch {
      // Fallback: select-and-copy via a temporary input.
      const tmp = document.createElement("input");
      tmp.value = code;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      tmp.remove();
      toast(`Copied ${code}`);
    }
  }

  function resetDemo() {
    setRoomCode("----");
    setLive(false);
    phaseIndex = 0;
    questionIndex = 0;
    applyQuestion();
    applyPhase();

    animateCount(statPlayers, 0, { suffix: "" });
    animateCount(statRounds, 0, { suffix: "" });
    animateCount(statBluff, 0, { suffix: "%", isPercent: true });
    toast("Reset");
  }

  generateRoomBtn.addEventListener("click", () => {
    const code = randomRoomCode();
    setRoomCode(code);
    toast(`Room ${code} ready`);

    const players = 3 + Math.floor(Math.random() * 6);
    const rounds = 2 + Math.floor(Math.random() * 6);
    const bluff = 18 + Math.floor(Math.random() * 33);

    animateCount(statPlayers, players, { suffix: "" });
    animateCount(statRounds, rounds, { suffix: "" });
    animateCount(statBluff, bluff, { suffix: "%", isPercent: true });
  });

  copyRoomBtn.addEventListener("click", copyRoomCode);
  resetDemoBtn.addEventListener("click", resetDemo);

  // Motion controls for people who want the page calmer.
  function isReducedMotion() {
    return Boolean(prefersReducedMotion?.matches) || manualReducedMotion;
  }

  toggleMotionBtn.addEventListener("click", () => {
    manualReducedMotion = !manualReducedMotion;
    paused = manualReducedMotion;
    toggleMotionBtn.textContent = manualReducedMotion
      ? "Enable motion"
      : "Reduce motion";
    toast(manualReducedMotion ? "Motion reduced" : "Motion enabled");
  });

  intensityRange.addEventListener("input", () => {
    intensity = clamp(Number(intensityRange.value) / 100, 0, 1);
  });

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden || isReducedMotion();
  });

  // Tiny toast: intentionally minimal, but gives satisfying feedback for buttons.
  let toastTimer = 0;
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 1400);
  }

  injectToastStyles();

  // Kaleidoscope renderer
  let raf = 0;
  let last = performance.now();

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (paused || isReducedMotion()) {
      // Still draw occasionally to avoid a blank canvas on first load.
      if (now - last > 800) {
        last = now;
        draw(now, 0.001);
      }
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(now, dt);
  }

  function draw(now, dt) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // Update the source texture.
    paintTexture(now, dt);

    ctx.clearRect(0, 0, w, h);

    const baseSegments = 10;
    const segments = Math.floor(baseSegments + intensity * 12);
    const wedge = (Math.PI * 2) / segments;
    const rot = now * 0.00022 + (pointerX - 0.5) * 0.6;
    const scale = 1.1 + intensity * 0.7;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    for (let i = 0; i < segments; i += 1) {
      ctx.save();
      ctx.rotate(i * wedge);

      if (i % 2 === 1) ctx.scale(-1, 1);

      // Clip wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(w, h) * 0.75, -wedge * 0.52, wedge * 0.52);
      ctx.closePath();
      ctx.clip();

      const x = (-texture.width * scale) / 2 + (pointerX - 0.5) * 180;
      const y = (-texture.height * scale) / 2 + (pointerY - 0.5) * 140;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(texture, x, y, texture.width * scale, texture.height * scale);

      // A soft tint layer keeps the palette lively and "gamey".
      ctx.globalAlpha = 0.22 + intensity * 0.14;
      ctx.fillStyle = tint(now, i / segments);
      ctx.fillRect(-w * 0.9, -h * 0.9, w * 1.8, h * 1.8);

      ctx.restore();
    }

    // Add a subtle center bloom so the background reads well behind UI.
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * 0.45);
    g.addColorStop(0, "rgba(255,246,231,0.06)");
    g.addColorStop(0.55, "rgba(255,246,231,0.02)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }

  function paintTexture(now, dt) {
    const tw = texture.width;
    const th = texture.height;

    const time = now * 0.001;
    const driftX = (Math.sin(time * 0.7) + Math.cos(time * 0.33)) * 0.5;
    const driftY = (Math.cos(time * 0.54) - Math.sin(time * 0.27)) * 0.5;

    // Backdrop gradient
    const g = tctx.createLinearGradient(0, 0, tw, th);
    g.addColorStop(0, `hsl(${Math.floor(320 + 80 * Math.sin(time * 0.4))} 90% 55% / 0.75)`);
    g.addColorStop(0.5, `hsl(${Math.floor(42 + 30 * Math.sin(time * 0.6 + 1.2))} 95% 55% / 0.72)`);
    g.addColorStop(1, `hsl(${Math.floor(190 + 40 * Math.cos(time * 0.5))} 95% 55% / 0.7)`);
    tctx.fillStyle = g;
    tctx.fillRect(0, 0, tw, th);

    // Streaks
    tctx.save();
    tctx.globalCompositeOperation = "overlay";
    tctx.translate(tw * (0.5 + driftX * 0.08), th * (0.5 + driftY * 0.06));
    tctx.rotate(time * 0.5);
    tctx.fillStyle = "rgba(255,246,231,0.08)";
    for (let i = 0; i < 8; i += 1) {
      tctx.fillRect(-tw, (-th * 0.4) + i * 22, tw * 2, 10);
    }
    tctx.restore();

    // Sparkles / noise dots
    const sparkleCount = Math.floor(140 + intensity * 240);
    tctx.globalCompositeOperation = "screen";
    for (let i = 0; i < sparkleCount; i += 1) {
      const r = (i * 997) % 7;
      const x = ((i * 73.7 + time * (18 + r)) % tw + tw) % tw;
      const y = ((i * 41.3 + time * (12 + r * 0.6)) % th + th) % th;
      const a = 0.05 + ((i % 9) / 9) * 0.12;
      tctx.fillStyle = `rgba(255,246,231,${a})`;
      tctx.fillRect(x, y, 1 + (i % 2), 1);
    }

    // Soft vignette inside the texture to avoid harsh edges when mirrored.
    tctx.globalCompositeOperation = "multiply";
    const vg = tctx.createRadialGradient(tw * 0.5, th * 0.45, 10, tw * 0.5, th * 0.45, tw * 0.75);
    vg.addColorStop(0, "rgba(255,255,255,1)");
    vg.addColorStop(1, "rgba(0,0,0,0.52)");
    tctx.fillStyle = vg;
    tctx.fillRect(0, 0, tw, th);
    tctx.globalCompositeOperation = "source-over";

    // dt is unused for now but kept for future tweaks without API churn.
    void dt;
  }

  function tint(now, t) {
    const time = now * 0.001;
    const hue = (210 + 120 * Math.sin(time * 0.35 + t * Math.PI * 2)) % 360;
    return `hsl(${hue} 95% 55% / 0.85)`;
  }

  function animateCount(el, target, opts) {
    const suffix = opts?.suffix ?? "";
    const isPercent = Boolean(opts?.isPercent);
    const startText = String(el.textContent || "0").replace("%", "");
    const start = Number(startText) || 0;

    const duration = 720;
    const t0 = performance.now();

    function tick(now) {
      const p = clamp((now - t0) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (target - start) * eased);
      el.textContent = isPercent ? `${v}${suffix}` : `${v}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function injectToastStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .toast{
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%) translateY(14px);
        z-index: 20;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,246,231,0.14);
        background: rgba(10, 10, 24, 0.72);
        backdrop-filter: blur(14px);
        color: rgba(255,246,231,0.92);
        box-shadow: 0 18px 60px rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 160ms ease, transform 160ms ease;
        font-weight: 600;
        letter-spacing: 0.01em;
        pointer-events: none;
      }
      .toast.show{
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  // Start in a calm state; generating a room turns it into a "live" dashboard.
  resetDemo();
  paused = isReducedMotion();
  raf = requestAnimationFrame(loop);

  // Ensure we don't keep animating if the page is closed.
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
})();

