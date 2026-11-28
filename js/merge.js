/*
 * Merge two progress states (used by the browser and by server.js).
 *
 * Progress only grows on every device, so most fields merge by "keep the more advanced one":
 *   srs        per card: more reviews wins (reps only ever increases)
 *   answers    per question: more attempts wins
 *   quizBest   per day: max
 *   drills     per drill: more attempts wins
 *   mocks      union of attempts
 *   review     per question: the most recent update wins (field "t")
 *   newLog     per date: max
 *   activity   per date and kind: max
 * Things that can be switched off again carry a timestamp in `stamps` (ms), and the newer change wins:
 *   done       "done:<dayId>"
 *   guides     "guide:<topicId>/<sectionId>"
 *   settings   "settings"
 * Without stamps (old data), ticks are unioned.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.CCNA = root.CCNA || {}).mergeState = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const obj = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : {});
  const keys = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])];

  const byStamp = (a, b, sa, sb, key) => {
    const ta = obj(sa)[key] || 0, tb = obj(sb)[key] || 0;
    if (ta !== tb) return ta > tb ? { from: "a" } : { from: "b" };
    return { from: "tie" };
  };

  /** Toggle-style map (done): newest stamp wins; on a tie, keep it if either side has it (earliest date). */
  function mergeToggles(a, b, sa, sb, prefix) {
    const out = {};
    keys(a, b).forEach((k) => {
      const w = byStamp(a, b, sa, sb, prefix + k).from;
      let v;
      if (w === "a") v = a[k];
      else if (w === "b") v = b[k];
      else if (a[k] !== undefined && b[k] !== undefined) v = typeof a[k] === "string" && typeof b[k] === "string" ? (a[k] < b[k] ? a[k] : b[k]) : typeof a[k] === "string" ? a[k] : b[k];
      else v = a[k] !== undefined ? a[k] : b[k];
      if (v !== undefined && v !== false && v !== null) out[k] = v;
    });
    return out;
  }

  const pickBy = (a, b, score) => {
    const out = {};
    keys(a, b).forEach((k) => {
      if (a[k] === undefined) out[k] = b[k];
      else if (b[k] === undefined) out[k] = a[k];
      else out[k] = score(b[k]) > score(a[k]) ? b[k] : a[k];
    });
    return out;
  };

  return function mergeState(A, B) {
    const a = obj(A), b = obj(B);
    const sa = obj(a.stamps), sb = obj(b.stamps);
    const out = {};

    // unknown future keys: keep whichever side has them
    keys(a, b).forEach((k) => { out[k] = a[k] !== undefined ? a[k] : b[k]; });

    const stamps = {};
    keys(sa, sb).forEach((k) => { stamps[k] = Math.max(sa[k] || 0, sb[k] || 0); });
    out.stamps = stamps;

    out.done = mergeToggles(obj(a.done), obj(b.done), sa, sb, "done:");

    const ga = obj(a.guides), gb = obj(b.guides), guides = {};
    keys(ga, gb).forEach((t) => {
      const m = mergeToggles(obj(ga[t]), obj(gb[t]), sa, sb, `guide:${t}/`);
      if (Object.keys(m).length) guides[t] = m;
    });
    out.guides = guides;

    out.srs = pickBy(obj(a.srs), obj(b.srs), (s) => (s.reps || 0) * 1e13 + (s.due || 0));
    out.answers = pickBy(obj(a.answers), obj(b.answers), (x) => (x.right || 0) + (x.wrong || 0));
    out.drills = pickBy(obj(a.drills), obj(b.drills), (x) => x.attempts || 0);
    out.review = pickBy(obj(a.review), obj(b.review), (x) => x.t || 0); // newest update wins (graduated items stay as records)

    const qa = obj(a.quizBest), qb = obj(b.quizBest), quizBest = {};
    keys(qa, qb).forEach((k) => { quizBest[k] = Math.max(qa[k] ?? -1, qb[k] ?? -1); });
    out.quizBest = quizBest;

    const seen = new Set(), mocks = [];
    [...(Array.isArray(a.mocks) ? a.mocks : []), ...(Array.isArray(b.mocks) ? b.mocks : [])].forEach((m) => {
      const id = JSON.stringify(m);
      if (!seen.has(id)) { seen.add(id); mocks.push(m); }
    });
    out.mocks = mocks.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));

    const la = obj(a.newLog), lb = obj(b.newLog), newLog = {};
    keys(la, lb).forEach((d) => { newLog[d] = Math.max(la[d] || 0, lb[d] || 0); });
    out.newLog = newLog;

    const aa = obj(a.activity), ab = obj(b.activity), activity = {};
    keys(aa, ab).forEach((d) => {
      const x = obj(aa[d]), y = obj(ab[d]), day = {};
      keys(x, y).forEach((k) => { day[k] = Math.max(x[k] || 0, y[k] || 0); });
      activity[d] = day;
    });
    out.activity = activity;

    const w = byStamp(a, b, sa, sb, "settings").from;
    out.settings = Object.assign({}, w === "b" ? obj(a.settings) : obj(b.settings), w === "b" ? obj(b.settings) : obj(a.settings));

    return out;
  };
});
