/* Router + views. */
(function () {
  const CCNA = window.CCNA;
  const { esc, fmt, pct, shuffle, SRS, DOMAINS } = CCNA;
  const S = CCNA.state;
  const $main = () => document.getElementById("main");
  let cleanup = null; // per-view teardown (timers, key handlers)

  const setView = (html) => {
    $main().innerHTML = html;
    window.scrollTo(0, 0);
  };
  const onKey = (handler) => {
    const h = (e) => { if (e.target.tagName === "INPUT" && !["Enter"].includes(e.key)) return; handler(e); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  };
  const noteLinks = (m) =>
    `<a href="${CCNA.NOTES_GITHUB}${m.file}" target="_blank" rel="noopener">notes ↗</a>`;
  const dayLabel = (m) => `Day ${m.day}${/[a-z]$/.test(m.id) ? m.id.slice(-1) : ""}`;

  // ---------- stats ----------
  const dayStats = (m) => {
    const d = CCNA.days[m.id];
    const cards = d ? d.cards || [] : [];
    const qs = d ? d.questions || [] : [];
    return {
      built: !!d,
      cards: cards.length,
      learned: cards.filter((c) => !SRS.isNew(c.id)).length,
      mature: cards.filter((c) => SRS.isMature(c.id)).length,
      due: cards.filter((c) => SRS.isDue(c.id)).length,
      questions: qs.length,
      best: S.quizBest[m.id],
    };
  };
  const domainStats = (key) => {
    const notes = CCNA.manifest().filter((m) => m.domain === key);
    let right = 0, wrong = 0;
    CCNA.allQuestions().filter((q) => q.domain === key).forEach((q) => {
      const a = S.answers[q.id]; if (a) { right += a.right; wrong += a.wrong; }
    });
    return {
      notes: notes.length,
      built: notes.filter((m) => CCNA.days[m.id]).length,
      done: notes.filter((m) => S.done[m.id]).length,
      right, wrong, acc: right + wrong ? pct(right, right + wrong) : null,
    };
  };

  // ---------- dashboard ----------
  function dashboard() {
    const man = CCNA.manifest();
    const due = SRS.dueCount();
    const newAvail = Math.min(SRS.newCount(), SRS.newRemainingToday());
    const builtN = man.filter((m) => CCNA.days[m.id]).length;
    const doneN = man.filter((m) => S.done[m.id]).length;
    const bestMock = S.mocks.length ? Math.max(...S.mocks.map((x) => pct(x.correct, x.total))) : null;

    // Study-today suggestions
    const todo = [];
    if (due + newAvail > 0) todo.push(`<a class="todo" href="#/cards"><b>${[due ? `Review ${due} due card${due === 1 ? "" : "s"}` : "", newAvail ? `${due ? "+" : "Learn"} ${newAvail} new card${newAvail === 1 ? "" : "s"}` : ""].filter(Boolean).join(" ")}</b><span>Spaced repetition — do this first, every day.</span></a>`);
    const weak = Object.keys(DOMAINS).map((k) => ({ k, ...domainStats(k) })).filter((d) => d.acc !== null && d.right + d.wrong >= 5).sort((a, b) => a.acc - b.acc)[0];
    if (weak && weak.acc < 85) {
      const day = man.find((m) => m.domain === weak.k && CCNA.days[m.id] && (S.quizBest[m.id] ?? 0) < 90);
      if (day) todo.push(`<a class="todo" href="#/quiz/${day.id}"><b>Weakest domain: ${DOMAINS[weak.k].name} (${weak.acc}%)</b><span>Retake the ${dayLabel(day)} quiz — ${esc(day.title)}.</span></a>`);
    }
    const unquizzed = man.find((m) => CCNA.days[m.id] && S.done[m.id] && S.quizBest[m.id] === undefined);
    if (unquizzed) todo.push(`<a class="todo" href="#/quiz/${unquizzed.id}"><b>Quiz yourself on ${dayLabel(unquizzed)}</b><span>${esc(unquizzed.title)} — marked done but not quizzed yet.</span></a>`);
    const drillWeak = Object.entries(CCNA.DRILLS).map(([k, d]) => ({ k, d, s: S.drills[k] })).sort((a, b) => (a.s ? a.s.correct / a.s.attempts : -1) - (b.s ? b.s.correct / b.s.attempts : -1))[0];
    if (drillWeak) todo.push(`<a class="todo" href="#/drills/${drillWeak.k}"><b>5-minute drill: ${drillWeak.d.name}</b><span>${drillWeak.s ? `${pct(drillWeak.s.correct, drillWeak.s.attempts)}% accuracy so far` : "Not attempted yet"}.</span></a>`);
    const next = man.find((m) => !S.done[m.id]);
    if (next) todo.push(`<a class="todo" href="${CCNA.NOTES_GITHUB}${next.file}" target="_blank" rel="noopener"><b>Next lesson: ${dayLabel(next)} — ${esc(next.title)}</b><span>Read the notes / watch the video, then tick it off below.</span></a>`);

    const domainRows = Object.entries(DOMAINS).map(([k, d]) => {
      const s = domainStats(k);
      return `<div class="dom">
        <div class="dom-head"><span class="dot" style="background:${d.color}"></span><b>${d.name}</b><span class="muted">${Math.round(d.weight * 100)}% of exam</span></div>
        <div class="bar" title="Lessons done"><i style="width:${pct(s.done, s.notes)}%;background:${d.color}"></i></div>
        <div class="dom-meta muted"><span>${s.done}/${s.notes} done</span><span>${s.built}/${s.notes} built</span><span>${s.acc === null ? "no answers yet" : `${s.acc}% correct (${s.right + s.wrong})`}</span></div>
      </div>`;
    }).join("");

    const rows = man.map((m) => {
      const s = dayStats(m);
      const d = DOMAINS[m.domain];
      const content = s.built
        ? `<span class="pill ok">${s.cards} cards · ${s.questions} Qs</span>`
        : `<span class="pill">not built</span>`;
      const mastery = s.built
        ? `<span title="cards learned / mature">${s.learned}/${s.cards}${s.mature ? ` <small>(${s.mature} mature)</small>` : ""}</span>${s.best !== undefined ? ` · <span title="best quiz">${s.best}%</span>` : ""}`
        : "";
      const actions = s.built
        ? `<a class="btn sm" href="#/cards/${m.id}">Cards${s.due ? ` (${s.due})` : ""}</a> <a class="btn sm" href="#/quiz/${m.id}">Quiz</a>`
        : "";
      return `<tr class="${S.done[m.id] ? "is-done" : ""}">
        <td><input type="checkbox" data-done="${m.id}" ${S.done[m.id] ? "checked" : ""} aria-label="Mark ${dayLabel(m)} done"></td>
        <td class="nowrap">${dayLabel(m)}</td>
        <td>${esc(m.title)} <small>${noteLinks(m)}</small></td>
        <td><span class="dot" style="background:${d.color}" title="${d.name}"></span></td>
        <td>${content}</td>
        <td class="nowrap">${mastery}</td>
        <td class="nowrap right">${actions}</td>
      </tr>`;
    }).join("");

    setView(`
      <section class="stats">
        <div class="stat"><b>${due}</b><span>cards due</span></div>
        <div class="stat"><b>${doneN}<small>/${man.length}</small></b><span>lessons done</span></div>
        <div class="stat"><b>${builtN}<small>/${man.length}</small></b><span>lessons with practice content</span></div>
        <div class="stat"><b>${bestMock === null ? "—" : bestMock + "%"}</b><span>best mock exam</span></div>
      </section>
      <div class="grid2">
        <section class="panel"><h2>Study today</h2>${todo.join("") || '<p class="muted">All caught up.</p>'}</section>
        <section class="panel"><h2>Exam domains</h2>${domainRows}</section>
      </div>
      <section class="panel">
        <h2>Course days <small class="muted">Jeremy's IT Lab · CCNA 200-301</small></h2>
        <div class="table-wrap"><table class="days">
          <thead><tr><th></th><th>Day</th><th>Lesson</th><th></th><th>Content</th><th>Mastery</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </section>`);

    $main().querySelectorAll("[data-done]").forEach((cb) =>
      cb.addEventListener("change", () => {
        const id = cb.dataset.done;
        cb.checked ? (S.done[id] = true) : delete S.done[id];
        CCNA.save();
        dashboard();
      }));
  }

  // ---------- flashcards ----------
  function cards(scope) {
    const m = scope && CCNA.entry(scope);
    if (scope && !CCNA.days[scope]) return notBuilt(m);
    const queue = SRS.buildQueue(scope);
    const title = m ? `${dayLabel(m)} — ${esc(m.title)}` : "All built days";
    let i = 0, flipped = false, reviewed = 0;

    const render = () => {
      if (i >= queue.length) {
        const more = !scope && SRS.newCount() > 0 && SRS.newRemainingToday() === 0;
        return setView(`<section class="panel center">
          <h2>Session complete</h2><p>${reviewed} card${reviewed === 1 ? "" : "s"} reviewed · ${title}</p>
          ${more ? `<p class="muted">Daily new-card limit reached (${S.settings.newPerDay}). Change it under <a href="#/data">Data</a>, or study a single day.</p>` : ""}
          <a class="btn" href="#/">Back to dashboard</a></section>`);
      }
      const c = queue[i];
      const isNew = SRS.isNew(c.id);
      const cm = CCNA.entry(c.dayId);
      setView(`<section class="panel card-view">
        <div class="row between muted"><span>${title}</span><span>${i + 1} / ${queue.length}${isNew ? ' · <span class="pill">new</span>' : ""}</span></div>
        <div class="flash ${flipped ? "flipped" : ""}" id="flash">
          <div class="front">${fmt(c.front)}</div>
          ${flipped ? `<hr><div class="back">${fmt(c.back)}</div>` : ""}
        </div>
        <div class="row between muted small"><span>${dayLabel(cm)} · ${noteLinks(cm)}</span><span>Space = flip · 1–4 = grade</span></div>
        <div class="grades">${flipped
          ? ["Again", "Hard", "Good", "Easy"].map((g, k) => `<button class="btn g${k}" data-g="${k}">${g}<small>${SRS.preview(c.id, k)}</small></button>`).join("")
          : `<button class="btn primary wide" id="flip">Show answer</button>`}</div>
      </section>`);
      const flipBtn = document.getElementById("flip");
      if (flipBtn) flipBtn.onclick = flip;
      $main().querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => grade(+b.dataset.g)));
    };
    const flip = () => { if (!flipped) { flipped = true; render(); } };
    const grade = (g) => {
      if (!flipped) return;
      const c = queue[i];
      SRS.grade(c.id, g);
      reviewed++;
      if (g === 0) queue.push(c); // see it again this session
      i++; flipped = false; render();
    };
    cleanup = onKey((e) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
      else if (["1", "2", "3", "4"].includes(e.key)) grade(+e.key - 1);
    });
    render();
  }

  // ---------- quiz (practice + mock) ----------
  const prepQuestion = (q) => {
    const order = shuffle(q.options.map((_, k) => k));
    return { q, order, correct: new Set(q.answer.map((a) => order.indexOf(a))) };
  };

  function runQuiz({ title, questions, mock, minutes, onFinish }) {
    const items = questions.map(prepQuestion);
    const results = []; // {item, chosen:Set, ok}
    let i = 0, chosen = new Set(), revealed = false;
    const deadline = mock ? Date.now() + minutes * 60000 : null;
    let timer = null;

    const finish = () => { if (timer) clearInterval(timer); onFinish(results); };
    const render = () => {
      if (i >= items.length) return finish();
      const it = items[i];
      const multi = it.q.type === "multi";
      const need = it.correct.size;
      const opts = it.order.map((orig, k) => {
        let cls = "opt";
        if (chosen.has(k)) cls += " chosen";
        if (revealed) cls += it.correct.has(k) ? " right" : chosen.has(k) ? " wrong" : "";
        return `<button class="${cls}" data-k="${k}" ${revealed ? "disabled" : ""}><span class="key">${String.fromCharCode(65 + k)}</span>${fmt(it.q.options[orig])}</button>`;
      }).join("");
      const cm = CCNA.entry(it.q.dayId);
      setView(`<section class="panel quiz">
        <div class="row between muted"><span>${title}</span><span>${mock ? `<b id="clock"></b> · ` : ""}Q ${i + 1} / ${items.length}</span></div>
        <div class="progress"><i style="width:${pct(i, items.length)}%"></i></div>
        <div class="qtext">${fmt(it.q.q)}</div>
        ${multi ? `<p class="muted small">Choose ${need}.</p>` : ""}
        <div class="opts">${opts}</div>
        ${revealed ? `<div class="explain ${results[results.length - 1].ok ? "ok" : "bad"}"><b>${results[results.length - 1].ok ? "Correct" : "Incorrect"}.</b> ${fmt(it.q.explain || "")} <small>${dayLabel(cm)} · ${noteLinks(cm)}</small></div>` : ""}
        <div class="row end">
          ${!revealed && (multi || mock) ? `<button class="btn primary" id="submit" ${chosen.size === (multi ? need : 1) ? "" : "disabled"}>${mock ? (i + 1 === items.length ? "Finish exam" : "Next (no going back)") : "Check"}</button>` : ""}
          ${revealed ? `<button class="btn primary" id="next">${i + 1 === items.length ? "See results" : "Next"}</button>` : ""}
        </div>
      </section>`);
      $main().querySelectorAll(".opt").forEach((b) => (b.onclick = () => choose(+b.dataset.k)));
      const sub = document.getElementById("submit"); if (sub) sub.onclick = submit;
      const nx = document.getElementById("next"); if (nx) nx.onclick = next;
      tick();
    };
    const choose = (k) => {
      if (revealed) return;
      const it = items[i];
      if (it.q.type === "multi") {
        chosen.has(k) ? chosen.delete(k) : chosen.size < it.correct.size && chosen.add(k);
        render();
      } else {
        chosen = new Set([k]);
        mock ? render() : submit();
      }
    };
    const submit = () => {
      const it = items[i];
      if (chosen.size !== (it.q.type === "multi" ? it.correct.size : 1)) return;
      const ok = chosen.size === it.correct.size && [...chosen].every((k) => it.correct.has(k));
      results.push({ item: it, chosen: new Set(chosen), ok });
      CCNA.recordAnswer(it.q.id, ok);
      CCNA.save();
      if (mock) { i++; chosen = new Set(); render(); }
      else { revealed = true; render(); }
    };
    const next = () => { i++; chosen = new Set(); revealed = false; render(); };
    const tick = () => {
      if (!mock) return;
      const left = deadline - Date.now();
      const el = document.getElementById("clock");
      if (el) { el.textContent = CCNA.fmtMs(Math.max(0, left)); el.className = left < 5 * 60000 ? "warn" : ""; }
      if (left <= 0) { // time's up: remaining questions count as wrong
        for (; i < items.length; i++) { results.push({ item: items[i], chosen: new Set(), ok: false }); CCNA.recordAnswer(items[i].q.id, false); }
        CCNA.save(); finish();
      }
    };
    if (mock) timer = setInterval(tick, 1000);
    const keyOff = onKey((e) => {
      if (e.key === "Enter") { const b = document.getElementById("next") || document.getElementById("submit"); if (b && !b.disabled) b.click(); }
      const k = e.key.toUpperCase().charCodeAt(0) - 65;
      if (e.key.length === 1 && k >= 0 && k < (items[i] ? items[i].order.length : 0)) choose(k);
    });
    cleanup = () => { keyOff(); if (timer) clearInterval(timer); };
    render();
  }

  const reviewList = (results) => {
    const missed = results.filter((r) => !r.ok);
    if (!missed.length) return '<p class="ok-text">No mistakes — nice.</p>';
    return `<h3>Review your mistakes</h3>` + missed.map((r) => {
      const q = r.item.q;
      const correctTxt = q.answer.map((a) => fmt(q.options[a])).join("<br>");
      const yours = r.chosen.size ? [...r.chosen].map((k) => fmt(q.options[r.item.order[k]])).join("<br>") : "<em>not answered</em>";
      const cm = CCNA.entry(q.dayId);
      return `<div class="missed"><div class="qtext small">${fmt(q.q)}</div>
        <div class="cols"><div><small class="muted">Your answer</small><div class="bad-text">${yours}</div></div>
        <div><small class="muted">Correct</small><div class="ok-text">${correctTxt}</div></div></div>
        <p class="small">${fmt(q.explain || "")} <small>${dayLabel(cm)} · ${noteLinks(cm)}</small></p></div>`;
    }).join("");
  };

  function quiz(scope) {
    const m = CCNA.entry(scope);
    if (!CCNA.days[scope]) return notBuilt(m);
    const title = `${dayLabel(m)} quiz — ${esc(m.title)}`;
    runQuiz({
      title, questions: shuffle(CCNA.allQuestions(scope)), mock: false,
      onFinish: (results) => {
        const score = pct(results.filter((r) => r.ok).length, results.length);
        const prevBest = S.quizBest[scope];
        S.quizBest[scope] = Math.max(prevBest ?? 0, score);
        CCNA.save();
        setView(`<section class="panel">
          <h2>${title}</h2>
          <div class="score ${score >= 85 ? "ok-text" : score >= 70 ? "" : "bad-text"}">${score}%</div>
          <p class="center muted">${results.filter((r) => r.ok).length} / ${results.length} correct${prevBest !== undefined ? ` · previous best ${prevBest}%` : ""}</p>
          <div class="row center"><button class="btn primary" id="retry">Retry</button> <a class="btn" href="#/cards/${scope}">Flashcards</a> <a class="btn" href="#/">Dashboard</a></div>
          ${reviewList(results)}</section>`);
        document.getElementById("retry").onclick = () => quiz(scope);
      },
    });
  }

  function drawMock(n) {
    const byDom = {};
    CCNA.allQuestions().forEach((q) => (byDom[q.domain] = byDom[q.domain] || []).push(q));
    Object.keys(byDom).forEach((k) => (byDom[k] = shuffle(byDom[k])));
    const total = Object.values(byDom).reduce((s, a) => s + a.length, 0);
    n = Math.min(n, total);
    const present = Object.keys(byDom);
    const wsum = present.reduce((s, k) => s + DOMAINS[k].weight, 0);
    const picked = [];
    present.forEach((k) => picked.push(...byDom[k].splice(0, Math.min(byDom[k].length, Math.round((DOMAINS[k].weight / wsum) * n)))));
    const rest = shuffle(Object.values(byDom).flat());
    while (picked.length < n && rest.length) picked.push(rest.pop());
    return shuffle(picked.slice(0, n));
  }

  function mock() {
    const total = CCNA.allQuestions().length;
    const builtDoms = new Set(CCNA.allQuestions().map((q) => q.domain));
    const lens = [20, 50, 100].filter((n) => n < total).concat(total <= 100 ? [total] : []);
    const uniq = [...new Set(lens)];
    const history = S.mocks.slice(-5).reverse().map((x) =>
      `<li>${x.date} — <b>${pct(x.correct, x.total)}%</b> (${x.correct}/${x.total})</li>`).join("");
    setView(`<section class="panel">
      <h2>Mock exam</h2>
      <p>Questions are drawn from every built day, weighted by the official domain percentages. Like the real exam: <b>timed</b>, <b>no feedback until the end</b> and <b>no going back</b>. The real exam is ~100 questions in 120 minutes (~1.2 min each).</p>
      <p class="muted">Pool: ${total} questions from ${builtDoms.size}/6 domains. ${total < 100 ? "Build more days to make full-length mocks possible." : ""}</p>
      <div class="row">${uniq.map((n) => `<button class="btn primary" data-n="${n}">${n} questions · ${Math.ceil(n * 1.2)} min</button>`).join(" ")}</div>
      ${history ? `<h3>Recent attempts</h3><ul>${history}</ul>` : ""}
    </section>`);
    $main().querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => startMock(+b.dataset.n)));
  }

  function startMock(n) {
    const questions = drawMock(n);
    runQuiz({
      title: "Mock exam", questions, mock: true, minutes: Math.ceil(n * 1.2),
      onFinish: (results) => {
        const correct = results.filter((r) => r.ok).length;
        const byDomain = {};
        results.forEach((r) => { const d = (byDomain[r.item.q.domain] = byDomain[r.item.q.domain] || { c: 0, t: 0 }); d.t++; if (r.ok) d.c++; });
        S.mocks.push({ date: CCNA.today(), total: results.length, correct, byDomain });
        CCNA.save();
        const score = pct(correct, results.length);
        const domRows = Object.entries(DOMAINS).filter(([k]) => byDomain[k]).map(([k, d]) => {
          const x = byDomain[k], p = pct(x.c, x.t);
          return `<div class="dom"><div class="dom-head"><span class="dot" style="background:${d.color}"></span><b>${d.name}</b><span class="muted">${x.c}/${x.t}</span></div>
            <div class="bar"><i style="width:${p}%;background:${d.color}"></i></div><div class="dom-meta muted"><span>${p}%</span></div></div>`;
        }).join("");
        setView(`<section class="panel">
          <h2>Mock exam result</h2>
          <div class="score ${score >= 85 ? "ok-text" : score >= 70 ? "" : "bad-text"}">${score}%</div>
          <p class="center muted">${correct} / ${results.length} correct. Cisco doesn't publish a pass mark; aim for a consistent 85%+ on practice before booking.</p>
          ${domRows}
          <div class="row center"><a class="btn primary" href="#/mock">New mock</a> <a class="btn" href="#/">Dashboard</a></div>
          ${reviewList(results)}</section>`);
      },
    });
  }

  // ---------- drills ----------
  function drillList() {
    const items = Object.entries(CCNA.DRILLS).map(([k, d]) => {
      const s = S.drills[k];
      return `<a class="drill-card" href="#/drills/${k}"><b>${d.name}</b><span class="muted small">${d.blurb}</span>
        <span class="small">${s ? `${pct(s.correct, s.attempts)}% of ${s.attempts} · best streak ${s.bestStreak}${s.bestMs ? ` · fastest ${CCNA.fmtMs(s.bestMs)}` : ""}` : '<span class="muted">not attempted</span>'}</span></a>`;
    }).join("");
    setView(`<section class="panel"><h2>Calculation drills</h2>
      <p class="muted">Generated endlessly. Subnetting speed is the difference between finishing the exam and running out of time.</p>
      <div class="drill-grid"><a class="drill-card mixed" href="#/drills/mixed"><b>Mixed</b><span class="muted small">Random drill each round — best for warm-ups.</span></a>${items}</div></section>`);
  }

  function drill(type) {
    const keys = Object.keys(CCNA.DRILLS);
    if (type !== "mixed" && !CCNA.DRILLS[type]) return drillList();
    let cur, t0, checked = false, sessionRight = 0, sessionTotal = 0;

    const newRound = () => {
      const k = type === "mixed" ? keys[Math.floor(Math.random() * keys.length)] : type;
      cur = { k, ...CCNA.DRILLS[k].gen() };
      checked = false; t0 = Date.now(); render();
    };
    const render = (feedback) => {
      const st = S.drills[cur.k] || {};
      setView(`<section class="panel drill">
        <div class="row between muted"><span><a href="#/drills">Drills</a> / ${CCNA.DRILLS[cur.k].name}${type === "mixed" ? " (mixed)" : ""}</span>
          <span>session ${sessionRight}/${sessionTotal} · streak ${st.streak || 0} · best ${st.bestStreak || 0}</span></div>
        <div class="drill-prompt">${cur.prompt}</div>
        <form id="df" class="fields" autocomplete="off">${cur.fields.map((f) => `<label><span>${f.label}</span>
          <input class="mono ${feedback ? (feedback[f.key] ? "in-ok" : "in-bad") : ""}" name="${f.key}" placeholder="${f.placeholder || ""}" ${checked ? "readonly" : ""} spellcheck="false" autocapitalize="off">
          ${feedback && !feedback[f.key] ? `<em class="ok-text mono">${esc(cur.answers[f.key])}</em>` : ""}</label>`).join("")}
          <div class="row end">${checked ? `<button class="btn primary" type="button" id="dnext">Next ↵</button>` : `<button class="btn primary" type="submit">Check ↵</button>`}</div>
        </form>
        ${feedback ? `<div class="explain ${feedback.all ? "ok" : "bad"}"><b>${feedback.all ? `Correct in ${CCNA.fmtMs(feedback.ms)}` : "Not quite"}.</b> ${cur.explain}</div>` : ""}
      </section>`);
      const form = document.getElementById("df");
      if (feedback) cur.fields.forEach((f) => (form.elements[f.key].value = feedback.values[f.key]));
      else form.elements[cur.fields[0].key].focus();
      form.onsubmit = (e) => { e.preventDefault(); check(form); };
      const nx = document.getElementById("dnext");
      if (nx) { nx.onclick = newRound; nx.focus(); }
    };
    const check = (form) => {
      if (checked) return newRound();
      const values = {}, fb = { values, ms: Date.now() - t0 };
      let all = true;
      cur.fields.forEach((f) => { values[f.key] = form.elements[f.key].value; fb[f.key] = !!cur.check[f.key](values[f.key]); all = all && fb[f.key]; });
      fb.all = all;
      const st = (S.drills[cur.k] = S.drills[cur.k] || { attempts: 0, correct: 0, streak: 0, bestStreak: 0, bestMs: null });
      st.attempts++; sessionTotal++;
      if (all) {
        st.correct++; st.streak++; sessionRight++;
        st.bestStreak = Math.max(st.bestStreak, st.streak);
        st.bestMs = st.bestMs ? Math.min(st.bestMs, fb.ms) : fb.ms;
      } else st.streak = 0;
      CCNA.save();
      checked = true; render(fb);
    };
    newRound();
  }

  // ---------- data / settings ----------
  function data() {
    setView(`<section class="panel">
      <h2>Progress data</h2>
      <p class="muted">Progress is stored in this browser's localStorage. Export it to back it up or move it to another browser.</p>
      <div class="row"><button class="btn" id="exp">Export progress (JSON)</button>
        <label class="btn">Import progress<input type="file" id="imp" accept="application/json" hidden></label>
        <button class="btn danger" id="reset">Reset all progress</button></div>
      <h3>Flashcard settings</h3>
      <label class="inline">New cards per day <input type="number" id="npd" min="0" max="500" value="${S.settings.newPerDay}"></label>
      <p class="muted small">Studying a single day's cards ignores this limit.</p>
    </section>`);
    document.getElementById("exp").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([CCNA.exportState()], { type: "application/json" }));
      a.download = `ccna-progress-${CCNA.today()}.json`; a.click();
    };
    document.getElementById("imp").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { try { CCNA.importState(t); location.hash = "#/"; } catch (err) { e.target.closest("section").insertAdjacentHTML("beforeend", `<p class="bad-text">Import failed: ${esc(err.message)}</p>`); } });
    };
    const reset = document.getElementById("reset");
    reset.onclick = () => {
      if (reset.dataset.armed) return CCNA.resetState();
      reset.dataset.armed = "1"; reset.textContent = "Click again to confirm reset";
    };
    document.getElementById("npd").onchange = (e) => { S.settings.newPerDay = Math.max(0, +e.target.value || 0); CCNA.save(); };
  }

  function notBuilt(m) {
    setView(`<section class="panel center"><h2>${m ? `${dayLabel(m)} — ${esc(m.title)}` : "Unknown day"}</h2>
      <p>No practice content has been built for this lesson yet.</p>
      ${m ? `<p class="muted small">Add <code>data/days/${m.id}.js</code> and set <code>"built": true</code> in <code>data/manifest.js</code>.</p>` : ""}
      <a class="btn" href="#/">Back</a></section>`);
  }

  // ---------- router ----------
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const [, view, arg] = (location.hash || "#/").split("/");
    document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#/${view || ""}`));
    ({ "": dashboard, cards: () => cards(arg), quiz: () => quiz(arg), mock, drills: () => (arg ? drill(arg) : drillList()), data }[view || ""] || dashboard)();
    const due = SRS.dueCount();
    document.getElementById("due-badge").textContent = due ? due : "";
  }

  // Load content for built days, then start.
  function boot() {
    const built = CCNA.manifest().filter((m) => m.built);
    let pending = built.length;
    const missing = [];
    const done = () => {
      if (missing.length) document.getElementById("warn").innerHTML = `Content file missing for: ${missing.join(", ")} — run <code>python3 tools/status.py</code>.`;
      window.addEventListener("hashchange", route);
      route();
    };
    if (!pending) return done();
    built.forEach((m) => {
      const s = document.createElement("script");
      s.src = `data/days/${m.id}.js`;
      s.onload = () => { if (!CCNA.days[m.id]) missing.push(m.id); if (--pending === 0) done(); };
      s.onerror = () => { missing.push(m.id); if (--pending === 0) done(); };
      document.body.appendChild(s);
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
