/* Core registry, persistence and shared helpers. Loaded first. */
(function () {
  const CCNA = (window.CCNA = window.CCNA || {});

  // CCNA 200-301 exam blueprint weights.
  CCNA.DOMAINS = {
    fund:     { name: "Network Fundamentals",        weight: 0.20, color: "#4f7cff" },
    access:   { name: "Network Access",              weight: 0.20, color: "#14a37f" },
    conn:     { name: "IP Connectivity",             weight: 0.25, color: "#e0862b" },
    services: { name: "IP Services",                 weight: 0.10, color: "#9b59d0" },
    security: { name: "Security Fundamentals",       weight: 0.15, color: "#d6455d" },
    auto:     { name: "Automation & Programmability", weight: 0.10, color: "#2a9fc0" },
  };

  CCNA.NOTES_GITHUB = "https://github.com/psaumur/CCNA_Course_Notes/blob/main/Course_Notes/";
  CCNA.NOTES_LOCAL = "../CCNA_Course_Notes/Course_Notes/";

  // ---- content registry (filled by data/days/*.js) ----
  CCNA.days = {};
  CCNA.addDay = function (id, data) {
    const entry = (window.CCNA_MANIFEST || []).find((m) => m.id === id);
    (data.cards || []).forEach((c) => { c.dayId = id; });
    (data.questions || []).forEach((q) => { q.dayId = id; q.domain = entry ? entry.domain : "fund"; });
    CCNA.days[id] = data;
  };
  CCNA.manifest = () => window.CCNA_MANIFEST || [];
  CCNA.entry = (id) => CCNA.manifest().find((m) => m.id === id);
  CCNA.allCards = (scope) =>
    Object.entries(CCNA.days).filter(([id]) => !scope || id === scope).flatMap(([, d]) => d.cards || []);
  CCNA.allQuestions = (scope) =>
    Object.entries(CCNA.days).filter(([id]) => !scope || id === scope).flatMap(([, d]) => d.questions || []);

  // ---- persistence ----
  const KEY = "ccna_prep_v1";
  const blank = () => ({
    done: {},          // dayId -> true
    srs: {},           // cardId -> {due, interval, ease, reps, lapses}
    answers: {},       // questionId -> {right, wrong, last}
    quizBest: {},      // dayId -> best percentage
    drills: {},        // drillType -> {attempts, correct, streak, bestStreak, bestMs}
    mocks: [],         // [{date, total, correct, byDomain}]
    newLog: {},        // yyyy-mm-dd -> new cards introduced
    settings: { newPerDay: 20 },
  });
  let state;
  try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch (e) { state = blank(); }
  CCNA.state = state;
  CCNA.save = () => localStorage.setItem(KEY, JSON.stringify(state));
  CCNA.exportState = () => JSON.stringify(state, null, 2);
  CCNA.importState = (json) => {
    const parsed = JSON.parse(json);
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, blank(), parsed);
    CCNA.save();
  };
  CCNA.resetState = () => { localStorage.removeItem(KEY); location.reload(); };

  CCNA.recordAnswer = (qid, correct) => {
    const a = (state.answers[qid] = state.answers[qid] || { right: 0, wrong: 0, last: null });
    correct ? a.right++ : a.wrong++;
    a.last = correct;
  };

  // ---- helpers ----
  CCNA.today = () => new Date().toISOString().slice(0, 10);
  CCNA.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Tiny formatter for content strings: `code`, **bold**, newlines.
  CCNA.fmt = (s) =>
    CCNA.esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  CCNA.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  CCNA.pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
  CCNA.fmtMs = (ms) => {
    const s = Math.round(ms / 1000);
    return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${(ms / 1000).toFixed(1)}s`;
  };
})();
