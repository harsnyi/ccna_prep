/* Spaced repetition (simplified SM-2). */
(function () {
  const CCNA = window.CCNA;
  const DAY = 86400000;
  const MIN = 60000;

  const SRS = (CCNA.SRS = {});

  SRS.cardState = (id) => CCNA.state.srs[id];
  SRS.isNew = (id) => !CCNA.state.srs[id];
  SRS.isDue = (id, now = Date.now()) => { const s = CCNA.state.srs[id]; return !!s && s.due <= now; };
  SRS.isMature = (id) => { const s = CCNA.state.srs[id]; return !!s && s.interval >= 21; };

  SRS.newIntroducedToday = () => CCNA.state.newLog[CCNA.today()] || 0;
  SRS.newRemainingToday = () => Math.max(0, CCNA.state.settings.newPerDay - SRS.newIntroducedToday());

  SRS.dueCount = (scope) => CCNA.allCards(scope).filter((c) => SRS.isDue(c.id)).length;
  SRS.newCount = (scope) => CCNA.allCards(scope).filter((c) => SRS.isNew(c.id)).length;

  /** Build a study queue: due reviews first (oldest due first), then new cards up to the daily limit. */
  SRS.buildQueue = (scope) => {
    const cards = CCNA.allCards(scope);
    const due = cards.filter((c) => SRS.isDue(c.id)).sort((a, b) => SRS.cardState(a.id).due - SRS.cardState(b.id).due);
    // Studying a single day explicitly ignores the daily new-card cap.
    const newLimit = scope ? Infinity : SRS.newRemainingToday();
    const fresh = cards.filter((c) => SRS.isNew(c.id)).slice(0, newLimit);
    return [...due, ...fresh];
  };

  /** Preview label for the next interval of each grade. */
  SRS.preview = (id, grade) => {
    const next = SRS.schedule(CCNA.state.srs[id], grade, true);
    const ms = next.due - Date.now();
    if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))}m`;
    const d = Math.round(ms / DAY);
    return d >= 30 ? `${Math.round(d / 30)}mo` : `${d}d`;
  };

  /** grade: 0 again, 1 hard, 2 good, 3 easy. Returns the new state; persists unless dryRun. */
  SRS.schedule = (prev, grade, dryRun) => {
    const now = Date.now();
    const s = prev ? { ...prev } : { interval: 0, ease: 2.5, reps: 0, lapses: 0, due: now };
    if (grade === 0) {
      if (s.reps > 0) s.lapses++;
      s.interval = 0;
      s.ease = Math.max(1.3, s.ease - 0.2);
      s.due = now + 10 * MIN;
    } else if (s.interval === 0) {
      // learning step / first successful recall
      s.interval = grade === 1 ? 1 : grade === 2 ? 1 : 4;
      if (grade === 1) s.ease = Math.max(1.3, s.ease - 0.15);
      s.due = now + s.interval * DAY;
    } else {
      if (grade === 1) { s.ease = Math.max(1.3, s.ease - 0.15); s.interval = Math.max(s.interval + 1, Math.round(s.interval * 1.2)); }
      if (grade === 2) { s.interval = Math.max(s.interval + 1, Math.round(s.interval * s.ease)); }
      if (grade === 3) { s.ease += 0.15; s.interval = Math.max(s.interval + 1, Math.round(s.interval * s.ease * 1.3)); }
      s.due = now + s.interval * DAY;
    }
    s.reps++;
    return s;
  };

  SRS.grade = (id, grade) => {
    const wasNew = SRS.isNew(id);
    CCNA.state.srs[id] = SRS.schedule(CCNA.state.srs[id], grade);
    if (wasNew) { const t = CCNA.today(); CCNA.state.newLog[t] = (CCNA.state.newLog[t] || 0) + 1; }
    CCNA.save();
    return CCNA.state.srs[id];
  };
})();
