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

  // Exam version being targeted. Cisco: last day to test 200-301 v1.1 is 2027-02-02; v2.0 starts 2027-02-03.
  CCNA.EXAM = { name: "CCNA 200-301 v1.1", lastDay: "2027-02-02", nextVersion: "v2.0" };

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
    done: {},          // dayId -> "yyyy-mm-dd" it was marked done (older data: true)
    srs: {},           // cardId -> {due, interval, ease, reps, lapses}
    answers: {},       // questionId -> {right, wrong, last}
    quizBest: {},      // dayId -> best percentage
    drills: {},        // drillType -> {attempts, correct, streak, bestStreak, bestMs}
    mocks: [],         // [{date, total, correct, byDomain}]
    newLog: {},        // yyyy-mm-dd -> new cards introduced
    activity: {},      // yyyy-mm-dd -> {cards, questions, drills, lessons, reading}
    guides: {},        // topicId -> {sectionId: "yyyy-mm-dd" marked understood}
    stamps: {},        // change times (ms) for things that can be switched off again — used by sync (js/merge.js)
    settings: { newPerDay: 20, examDate: null, reviewDays: 14 },
  });
  let state;
  const load = (obj) => { const b = blank(); const st = Object.assign(b, obj); st.settings = Object.assign(blank().settings, obj.settings); return st; };
  try { state = load(JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch (e) { state = blank(); }
  CCNA.state = state;
  CCNA.normalize = load;
  CCNA.saveLocal = () => localStorage.setItem(KEY, JSON.stringify(state));
  CCNA.onSave = [];   // js/sync.js hooks in here
  CCNA.save = () => { CCNA.saveLocal(); CCNA.onSave.forEach((f) => f()); };
  /** Record when something that can be undone changed (lesson tick, guide section, settings) so sync keeps the newest. */
  CCNA.touch = (key) => { state.stamps[key] = Date.now(); };
  CCNA.exportState = () => JSON.stringify(state, null, 2);
  CCNA.importState = async (json) => {
    const parsed = JSON.parse(json);
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, load(parsed));
    CCNA.saveLocal();
    if (CCNA.sync && CCNA.sync.enabled) await CCNA.sync.replaceRemote();
  };
  CCNA.resetState = async () => {
    if (CCNA.sync && CCNA.sync.enabled) await CCNA.sync.resetRemote();
    localStorage.removeItem(KEY);
    location.reload();
  };

  CCNA.recordAnswer = (qid, correct) => {
    const a = (state.answers[qid] = state.answers[qid] || { right: 0, wrong: 0, last: null });
    correct ? a.right++ : a.wrong++;
    a.last = correct;
    CCNA.logActivity("questions");
  };
  CCNA.logActivity = (kind, n = 1) => {
    const d = (state.activity[CCNA.today()] = state.activity[CCNA.today()] || {});
    d[kind] = (d[kind] || 0) + n;
  };

  // ---- helpers ----
  // Local calendar dates as yyyy-mm-dd (not UTC, so late-night study counts for the right day).
  CCNA.dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  CCNA.parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  CCNA.today = () => CCNA.dateStr(new Date());
  CCNA.addDays = (s, n) => { const d = CCNA.parseDate(s); d.setDate(d.getDate() + n); return CCNA.dateStr(d); };
  CCNA.daysBetween = (a, b) => Math.round((CCNA.parseDate(b) - CCNA.parseDate(a)) / 86400000);
  CCNA.fmtDate = (s, opts = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) =>
    CCNA.parseDate(s).toLocaleDateString(undefined, opts);
  CCNA.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Tiny formatter for content strings: ```exhibit blocks``` (monospace, spacing kept), `code`, **bold**, newlines.
  const fmtInline = (s) =>
    CCNA.esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  CCNA.fmt = (s) =>
    String(s).split(/\n?```\n?([\s\S]*?)\n?```\n?/)
      .map((part, i) => (i % 2 ? `<pre class="code exhibit">${CCNA.esc(part)}</pre>` : fmtInline(part)))
      .join("");
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
