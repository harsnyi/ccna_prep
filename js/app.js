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


  // ---------- exam plan ----------
  const examPlan = () => {
    const man = CCNA.manifest();
    const today = CCNA.today();
    const exam = S.settings.examDate || CCNA.EXAM.lastDay;
    const daysLeft = CCNA.daysBetween(today, exam);
    const reviewDays = Math.max(0, Math.min(S.settings.reviewDays, Math.max(0, daysLeft - 1)));
    const learnEnd = CCNA.addDays(exam, -reviewDays);
    const learnDaysLeft = Math.max(0, CCNA.daysBetween(today, learnEnd));
    const doneN = man.filter((m) => S.done[m.id]).length;
    const left = man.length - doneN;
    const doneToday = man.filter((m) => S.done[m.id] === today).length;
    // Lessons needed per day, counting today (and crediting lessons already finished today).
    const perDay = left === 0 ? 0 : learnDaysLeft > 0 ? (left + doneToday) / (learnDaysLeft + 1) : left + doneToday;
    const todayTarget = Math.ceil(perDay);
    const weekAgo = CCNA.addDays(today, -6);
    const dated = Object.values(S.done).filter((v) => typeof v === "string");
    const last7 = dated.filter((v) => v >= weekAgo).length;
    // Average over the last 7 days, or fewer if tracking started more recently (so day one isn't "behind").
    const first = dated.length ? dated.reduce((a, b) => (a < b ? a : b)) : today;
    const window = Math.max(1, Math.min(7, CCNA.daysBetween(first, today) + 1));
    const pace7 = last7 / window;
    const projected = pace7 > 0 && left > 0 ? CCNA.addDays(today, Math.ceil(left / pace7)) : null;
    let status;
    if (left === 0) status = { cls: "ok", text: "All lessons done — review phase" };
    else if (daysLeft < 0) status = { cls: "bad", text: "Exam date has passed" };
    else if (!dated.length) status = { cls: "", text: "Not started — tick off lessons to measure pace" };
    else if (projected && projected <= learnEnd) status = { cls: "ok", text: "On track" };
    else if (projected && projected <= exam) status = { cls: "warn", text: "Tight — would eat into review time" };
    else status = { cls: "bad", text: "Behind — pick up the pace" };

    // Readiness (rough estimate): coverage weighted like the exam, card retention, recent mock scores.
    const coverage = Object.entries(DOMAINS).reduce((sum, [k, d]) => { const x = domainStats(k); return sum + d.weight * (x.notes ? x.done / x.notes : 0); }, 0);
    const cards = CCNA.allCards();
    const learned = cards.filter((c) => !SRS.isNew(c.id)).length;
    const retention = cards.length ? learned / cards.length : 0;
    const recent = S.mocks.slice(-3);
    const mockAvg = recent.length ? recent.reduce((a, x) => a + x.correct / x.total, 0) / recent.length : 0;
    const readiness = Math.round(100 * (0.4 * coverage + 0.2 * retention + 0.4 * mockAvg));

    const coreTopics = CCNA.topics().filter((t) => t.weight === "core");
    const coreDone = coreTopics.filter((t) => { const g = CCNA.guideStats(t.id); return g.sections && g.understood === g.sections; }).length;
    const sub = S.drills.subnet;
    const milestones = [
      { ok: left === 0, text: `Finish all ${man.length} lessons`, sub: `${doneN}/${man.length}` },
      { ok: cards.length > 0 && learned === cards.length, text: "Learn every flashcard", sub: `${learned}/${cards.length}` },
      { ok: coreTopics.length > 0 && coreDone === coreTopics.length, text: "Work through every core-topic guide", sub: `${coreDone}/${coreTopics.length} topics` },
      { ok: !!sub && sub.attempts >= 50 && sub.correct / sub.attempts >= 0.9, text: "Subnetting drill ≥ 90% over 50+ tries", sub: sub ? `${pct(sub.correct, sub.attempts)}% of ${sub.attempts}` : "not started" },
      { ok: S.mocks.some((x) => x.total >= 50 && x.correct / x.total >= 0.85), text: "Score 85%+ on a 50+ question mock", sub: S.mocks.length ? `best ${Math.max(...S.mocks.map((x) => pct(x.correct, x.total)))}%` : "no mocks yet" },
      { ok: recent.length === 3 && recent.every((x) => x.correct / x.total >= 0.85), text: "Last 3 mocks all 85%+", sub: recent.length ? recent.map((x) => pct(x.correct, x.total) + "%").join(" · ") : "—" },
    ];

    // Streak: consecutive days with any activity, ending today (or yesterday if today is still empty).
    const active = (d) => { const a = S.activity[d]; return !!a && Object.values(a).some((n) => n > 0); };
    let streak = 0, d = active(today) ? today : CCNA.addDays(today, -1);
    while (active(d)) { streak++; d = CCNA.addDays(d, -1); }

    return { exam, isDefault: !S.settings.examDate, daysLeft, reviewDays, learnEnd, learnDaysLeft, doneN, left, total: man.length, doneToday, perDay, todayTarget, last7, projected, status, coverage, retention, mockAvg, readiness, milestones, streak, active };
  };

  function examPanel(p) {
    const today = CCNA.today();
    const late = S.settings.examDate && S.settings.examDate > CCNA.EXAM.lastDay;
    const heat = Array.from({ length: 28 }, (_, k) => {
      const day = CCNA.addDays(today, k - 27), a = S.activity[day] || {};
      const n = (a.cards || 0) + (a.questions || 0) + (a.drills || 0) + 5 * (a.lessons || 0) + 3 * (a.reading || 0);
      const lvl = n === 0 ? 0 : n < 15 ? 1 : n < 40 ? 2 : 3;
      return `<i class="h${lvl}${day === today ? " today" : ""}${day === p.exam ? " exam" : ""}" title="${CCNA.fmtDate(day)}: ${n ? `${a.lessons || 0} lessons, ${a.reading || 0} guide sections, ${a.cards || 0} cards, ${a.questions || 0} questions, ${a.drills || 0} drills` : "no study"}"></i>`;
    }).join("");
    const ring = (v, label) => `<div class="ring" style="--v:${Math.round(v * 100)}"><b>${Math.round(v * 100)}%</b><span>${label}</span></div>`;
    const learnPct = p.total ? pct(p.doneN, p.total) : 0;
    return `<section class="panel exam">
      <div class="exam-head">
        <div class="countdown ${p.daysLeft <= 14 ? "soon" : ""}">
          <b>${p.daysLeft >= 0 ? p.daysLeft : "—"}</b><span>day${p.daysLeft === 1 ? "" : "s"} to exam</span>
        </div>
        <div class="exam-when">
          <div class="muted small">${CCNA.EXAM.name}${p.isDefault ? " · last possible test date" : ""}</div>
          <div class="exam-date">${CCNA.fmtDate(p.exam)}</div>
          <label class="inline small">Exam date <input type="date" id="exam-date" value="${S.settings.examDate || ""}" max="${CCNA.EXAM.lastDay}" min="${today}"></label>
          ${p.isDefault ? `<p class="muted small">No date booked yet — planning against the v1.1 cutoff. Set your date when you book.</p>` : ""}
          ${late ? `<p class="bad-text small">That's after ${CCNA.fmtDate(CCNA.EXAM.lastDay)} — you'd be sitting ${CCNA.EXAM.nextVersion}, not v1.1.</p>` : ""}
        </div>
        <div class="readiness" title="Rough estimate: 40% lessons covered (exam-weighted) + 20% flashcards learned + 40% average of last 3 mocks">
          <b>${p.readiness}%</b><span>readiness</span>
        </div>
      </div>

      <div class="timeline">
        <div class="tl-bar"><i class="tl-learn" style="width:${learnPct}%"></i></div>
        <div class="tl-legend muted small">
          <span>Lessons ${p.doneN}/${p.total}</span>
          <span>Learning ends <b>${CCNA.fmtDate(p.learnEnd, { month: "short", day: "numeric" })}</b> (${p.learnDaysLeft} days) → ${p.reviewDays}-day review &amp; mocks → exam</span>
        </div>
      </div>

      <div class="exam-grid">
        <div>
          <h3>Pace</h3>
          <div class="status ${p.status.cls}">${p.status.text}</div>
          <ul class="facts">
            <li><b>${p.left ? p.perDay.toFixed(1) : 0}</b> lessons/day needed <span class="muted">(${p.left ? (p.perDay * 7).toFixed(0) : 0}/week)</span></li>
            <li><b>${p.last7}</b> lessons done in the last 7 days</li>
            <li>Today: <b>${p.doneToday}/${p.left || p.doneToday ? p.todayTarget : 0}</b> lessons${p.doneToday >= p.todayTarget && p.left ? ' <span class="ok-text">✓ target met</span>' : ""}</li>
            ${p.projected ? `<li>At this pace you finish lessons on <b>${CCNA.fmtDate(p.projected, { month: "short", day: "numeric" })}</b></li>` : ""}
          </ul>
          <div class="rings">${ring(p.coverage, "covered")}${ring(p.retention, "cards learned")}${ring(p.mockAvg, "mock avg")}</div>
        </div>
        <div>
          <h3>Milestones before exam day</h3>
          <ul class="milestones">${p.milestones.map((m) => `<li class="${m.ok ? "ok" : ""}"><span class="check">${m.ok ? "✓" : ""}</span>${m.text}<small class="muted">${m.sub}</small></li>`).join("")}</ul>
          <h3>Study streak: ${p.streak} day${p.streak === 1 ? "" : "s"}</h3>
          <div class="heat">${heat}</div>
          <div class="muted small">Last 4 weeks</div>
        </div>
      </div>
    </section>`;
  }

  // ---------- dashboard ----------
  function dashboard() {
    const man = CCNA.manifest();
    const due = SRS.dueCount();
    const newAvail = Math.min(SRS.newCount(), SRS.newRemainingToday());
    const builtN = man.filter((m) => CCNA.days[m.id]).length;
    const doneN = man.filter((m) => S.done[m.id]).length;
    const bestMock = S.mocks.length ? Math.max(...S.mocks.map((x) => pct(x.correct, x.total))) : null;

    const plan = examPlan();
    // Study-today suggestions
    const todo = [];
    if (plan.left && plan.doneToday < plan.todayTarget) todo.push(`<a class="todo plan" href="#/"><b>Exam plan: ${plan.todayTarget - plan.doneToday} more lesson${plan.todayTarget - plan.doneToday === 1 ? "" : "s"} today</b><span>${plan.left} left · ${plan.daysLeft} days to exam — ticking off lessons below keeps you on track.</span></a>`);
    const rDue = dueReview().length;
    if (rDue) todo.push(`<a class="todo" href="#/review"><b>Review ${rDue} missed question${rDue === 1 ? "" : "s"}</b><span>Mistakes come back until you get them right ${CCNA.REVIEW_GOAL} times in a row.</span></a>`);
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
    const ng = nextGuideSection();
    if (ng) todo.push(`<a class="todo" href="#/topics/${ng.t.id}"><b>Study guide: ${esc(ng.t.title)}</b><span>Next up: ${ng.k + 1}. ${esc(ng.sec.title)}</span></a>`);
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
      ${examPanel(plan)}
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
        if (cb.checked) { S.done[id] = CCNA.today(); CCNA.logActivity("lessons"); } else delete S.done[id];
        CCNA.touch(`done:${id}`);
        CCNA.save();
        dashboard();
      }));
    const ed = document.getElementById("exam-date");
    ed.onchange = () => { S.settings.examDate = ed.value || null; CCNA.touch("settings"); CCNA.save(); dashboard(); };
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
        for (; i < items.length; i++) { results.push({ item: items[i], chosen: new Set(), ok: false }); CCNA.recordAnswer(items[i].q.id, false, { timedOut: true }); }
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
          ${missedNote(results)}
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
          ${missedNote(results)}
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
      CCNA.logActivity("drills");
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


  // ---------- topics & study guides ----------
  const weightPill = (w) => `<span class="pill w-${w}" title="${CCNA.WEIGHTS[w].blurb}">${CCNA.WEIGHTS[w].name}</span>`;
  const lessonLinks = (t) => t.lessons.map((id) => CCNA.entry(id)).filter(Boolean);

  function topicList() {
    const groups = Object.entries(DOMAINS).map(([k, d]) => {
      const ts = CCNA.topics().filter((t) => t.domain === k);
      if (!ts.length) return "";
      const cardsHtml = ts.map((t) => {
        const g = CCNA.guideStats(t.id);
        const ls = lessonLinks(t);
        const lDone = ls.filter((m) => S.done[m.id]).length;
        return `<a class="topic-card" href="#/topics/${t.id}">
          <div class="row between"><b>${CCNA.guides[t.id] ? '<span class="guide-tick" title="Study guide written">✓</span>' : ""}${esc(t.title)}</b>${weightPill(t.weight)}</div>
          <span class="muted small">${esc(t.summary)}</span>
          <div class="bar"><i style="width:${pct(g.understood, g.sections)}%;background:${d.color}"></i></div>
          <span class="small muted">${t.guide && CCNA.guides[t.id] ? `Guide: ${g.understood}/${g.sections} sections` : "Guide not written yet"} · Lessons ${lDone}/${ls.length} · ${t.blueprint.join(", ")}</span>
        </a>`;
      }).join("");
      return `<h3><span class="dot" style="background:${d.color}"></span> ${d.name} <small class="muted">${Math.round(d.weight * 100)}%</small></h3><div class="topic-grid">${cardsHtml}</div>`;
    }).join("");
    const ready = CCNA.topics().filter((t) => CCNA.guides[t.id]).length;
    setView(`<section class="panel"><h2>Key exam topics</h2>
      <p class="muted"><span class="guide-tick">✓</span> = study guide written. The exam blueprint grouped into the topics that matter, independent of the course-day order. Each topic links its lessons and drills; topics with a study guide have in-depth material written for this app (${ready}/${CCNA.topics().length} so far).</p>
      ${groups}</section>`);
  }

  function topicPage(id) {
    const t = CCNA.topic(id);
    if (!t) return topicList();
    const d = DOMAINS[t.domain];
    const g = CCNA.guides[id];
    const prog = CCNA.guideProgress(id);
    const ls = lessonLinks(t);

    const practice = `<section class="panel" id="practice"><h2>Practice</h2>
      ${t.drills.length ? `<h3>Drills</h3><div class="row">${t.drills.map((k) => `<a class="btn" href="#/drills/${k}">${CCNA.DRILLS[k].name}</a>`).join(" ")}</div>` : ""}
      <h3>Related course lessons</h3>
      <table class="days"><tbody>${ls.map((m) => {
        const built = !!CCNA.days[m.id];
        return `<tr class="${S.done[m.id] ? "is-done" : ""}"><td class="nowrap">${S.done[m.id] ? "✓" : ""}</td><td class="nowrap">${dayLabel(m)}</td><td>${esc(m.title)} <small>${noteLinks(m)}</small></td>
          <td class="right nowrap">${built ? `<a class="btn sm" href="#/cards/${m.id}">Cards</a> <a class="btn sm" href="#/quiz/${m.id}">Quiz${S.quizBest[m.id] !== undefined ? ` ${S.quizBest[m.id]}%` : ""}</a>` : '<span class="pill">no quiz yet</span>'}</td></tr>`;
      }).join("")}</tbody></table></section>`;

    const header = `<section class="panel topic-head">
      <div class="muted small"><a href="#/topics">Topics</a> / <span class="dot" style="background:${d.color}"></span> ${d.name} · blueprint ${t.blueprint.join(", ")}</div>
      <h1>${esc(t.title)} ${weightPill(t.weight)}</h1>
      <p>${esc(t.summary)}</p>
      <div class="callout key"><div class="callout-title">What the exam expects</div><ul>${t.focus.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
      ${g ? `<div class="bar"><i id="g-bar" style="width:0%;background:${d.color}"></i></div><div class="muted small" id="g-count"></div>` : ""}
    </section>`;

    if (!g) {
      setView(`${header}<section class="panel"><p class="muted">No in-app study guide for this topic yet — use the course lessons below for now.</p></section>${practice}`);
      return;
    }

    const toc = g.sections.map((sec, k) => `<li data-toc="${sec.id}"><button type="button" data-goto="${sec.id}"><span class="check"></span>${k + 1}. ${esc(sec.title)}</button></li>`).join("");
    const body = g.sections.map((sec, k) => `<article class="guide-sec" id="sec-${sec.id}">
        <h2>${k + 1}. ${esc(sec.title)}</h2>
        <div class="md-body">${CCNA.md(sec.md)}</div>
        ${sec.checks && sec.checks.length ? `<div class="checks"><h4>Check yourself</h4>${sec.checks.map((c) => `<details><summary>${fmt(c.q)}</summary><div>${fmt(c.a)}</div></details>`).join("")}</div>` : ""}
        <div class="row end"><button class="btn" data-understood="${sec.id}"></button></div>
      </article>`).join("");

    setView(`${header}
      <div class="guide">
        <nav class="guide-toc panel"><b>Contents</b><ol>${toc}</ol><button type="button" class="btn sm" data-goto="practice">Practice ↓</button></nav>
        <div class="guide-body">${g.intro ? `<section class="panel md-body">${CCNA.md(g.intro)}</section>` : ""}<section class="panel">${body}</section>${practice}</div>
      </div>`);

    const refresh = () => {
      const st = CCNA.guideStats(id);
      document.getElementById("g-bar").style.width = pct(st.understood, st.sections) + "%";
      document.getElementById("g-count").textContent = `${st.understood}/${st.sections} sections understood`;
      g.sections.forEach((sec) => {
        const on = !!prog[sec.id];
        $main().querySelector(`[data-toc="${sec.id}"]`).classList.toggle("ok", on);
        const b = $main().querySelector(`[data-understood="${sec.id}"]`);
        b.textContent = on ? "✓ Understood — click to undo" : "Mark as understood";
        b.classList.toggle("primary", !on);
      });
    };
    $main().querySelectorAll("[data-goto]").forEach((b) => (b.onclick = () => {
      const el = document.getElementById(b.dataset.goto === "practice" ? "practice" : `sec-${b.dataset.goto}`);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    $main().querySelectorAll("[data-understood]").forEach((b) => (b.onclick = () => {
      const sid = b.dataset.understood;
      if (prog[sid]) delete prog[sid];
      else { prog[sid] = CCNA.today(); CCNA.logActivity("reading"); }
      CCNA.touch(`guide:${id}/${sid}`);
      CCNA.save(); refresh();
    }));
    refresh();
  }

  /** Next unread section across written guides, core topics first. */
  const nextGuideSection = () => {
    const order = { core: 0, important: 1, know: 2 };
    for (const t of CCNA.topics().filter((x) => CCNA.guides[x.id]).sort((a, b) => order[a.weight] - order[b.weight])) {
      const p = S.guides[t.id] || {};
      const sec = CCNA.guides[t.id].sections.find((x) => !p[x.id]);
      if (sec) return { t, sec, k: CCNA.guides[t.id].sections.indexOf(sec) };
    }
    return null;
  };


  // ---------- mistakes review ----------
  const qById = () => Object.fromEntries(CCNA.allQuestions().map((q) => [q.id, q]));
  const dueReview = () => { const m = qById(); return CCNA.reviewDue().filter((id) => m[id]); };
  const plainQ = (q) => q.q.replace(/```[\s\S]*?```/g, " [exhibit] ").replace(/[`*]/g, "").replace(/\s+/g, " ").trim();
  const whenDue = (r) => {
    if (r.due <= Date.now()) return '<span class="bad-text">due now</span>';
    const d = CCNA.daysBetween(CCNA.today(), CCNA.dateStr(new Date(r.due)));
    return d <= 1 ? "tomorrow" : `in ${d} days`;
  };
  const dots = (r) => Array.from({ length: CCNA.REVIEW_GOAL }, (_, k) => `<i class="${k < r.streak ? "on" : ""}"></i>`).join("");
  const missedNote = (results) => {
    const n = results.filter((r) => !r.ok && r.chosen.size).length;
    return n ? `<p class="center muted">${n} missed question${n === 1 ? "" : "s"} added to your <a href="#/review">mistakes review</a> — ${n === 1 ? "it comes" : "they come"} back until you get ${n === 1 ? "it" : "them"} right ${CCNA.REVIEW_GOAL} times.</p>` : "";
  };

  function review() {
    const m = qById();
    const due = dueReview();
    const queued = CCNA.reviewQueued().filter((id) => m[id]);
    const mastered = CCNA.reviewMastered().length;
    const rows = queued
      .map((id) => ({ id, r: S.review[id], q: m[id] }))
      .sort((a, b) => a.r.due - b.r.due || b.r.misses - a.r.misses)
      .map(({ r, q }) => {
        const cm = CCNA.entry(q.dayId);
        const txt = plainQ(q);
        return `<tr><td>${esc(txt.length > 110 ? txt.slice(0, 107) + "…" : txt)}</td>
          <td class="nowrap"><a href="#/quiz/${q.dayId}">${dayLabel(cm)}</a></td>
          <td class="nowrap center">${r.misses}×</td>
          <td class="nowrap"><span class="dots" title="${r.streak}/${CCNA.REVIEW_GOAL} correct in a row">${dots(r)}</span></td>
          <td class="nowrap">${whenDue(r)}</td></tr>`;
      }).join("");
    setView(`<section class="panel">
      <h2>Mistakes review</h2>
      <p class="muted">Every question you get wrong — in a quiz, mock or here — comes back until you answer it right
        <b>${CCNA.REVIEW_GOAL} times in a row</b>, spaced out: today → next day → ${CCNA.REVIEW_STEPS[1]} days later. Missing it again starts it over.</p>
      <section class="stats">
        <div class="stat"><b>${due.length}</b><span>due now</span></div>
        <div class="stat"><b>${queued.length - due.length}</b><span>waiting</span></div>
        <div class="stat"><b>${mastered}</b><span>mastered</span></div>
        <div class="stat"><b>${queued.length}</b><span>in the queue</span></div>
      </section>
      <div class="row">${due.length
        ? `<button class="btn primary" id="start-review">Review ${due.length} due question${due.length === 1 ? "" : "s"}</button>`
        : `<span class="muted">${queued.length ? "Nothing due right now — come back later." : "No mistakes to review. Get some quizzes done!"}</span>`}</div>
      ${rows ? `<h3>Queue</h3><div class="table-wrap"><table class="days review-table">
        <thead><tr><th>Question</th><th>Lesson</th><th class="center">Missed</th><th>Progress</th><th>Next</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : ""}
    </section>`);
    const b = document.getElementById("start-review");
    if (b) b.onclick = startReview;
  }

  function startReview() {
    const m = qById();
    const ids = dueReview();
    const before = new Set(CCNA.reviewMastered());
    runQuiz({
      title: "Mistakes review", questions: shuffle(ids.map((id) => m[id])), mock: false,
      onFinish: (results) => {
        const ok = results.filter((r) => r.ok).length;
        const nowMastered = CCNA.reviewMastered().filter((id) => !before.has(id)).length;
        const still = dueReview().length;
        const score = pct(ok, results.length);
        setView(`<section class="panel">
          <h2>Mistakes review</h2>
          <div class="score ${score >= 85 ? "ok-text" : score >= 70 ? "" : "bad-text"}">${ok}/${results.length}</div>
          <p class="center muted">${ok} moved forward${nowMastered ? ` (${nowMastered} mastered 🎉)` : ""} · ${results.length - ok} back to the start${still ? ` · ${still} still due` : ""}</p>
          <div class="row center">${still ? `<button class="btn primary" id="again">Go again (${still} due)</button>` : ""}
            <a class="btn" href="#/review">Review queue</a> <a class="btn" href="#/">Dashboard</a></div>
          ${reviewList(results)}</section>`);
        const again = document.getElementById("again");
        if (again) again.onclick = startReview;
        updateBadges();
      },
    });
  }

  const updateBadges = () => {
    const due = SRS.dueCount();
    document.getElementById("due-badge").textContent = due ? due : "";
    const rd = dueReview().length;
    document.getElementById("review-badge").textContent = rd ? rd : "";
  };

  // ---------- data / settings ----------
  function data() {
    setView(`<section class="panel">
      <h2>Progress data</h2>
      ${CCNA.sync.enabled
        ? `<p>Progress is <b>synced across your devices</b> through the server (and kept in this browser, so it works offline too).
             <span class="sync-pill ${CCNA.sync.status}">${{ synced: "✓ Synced", pending: "Saving…", syncing: "Syncing…", offline: "Offline — will retry", signedout: "Signed out" }[CCNA.sync.status] || ""}</span></p>
           <p class="muted small">${CCNA.sync.lastSync ? `Last synced ${new Date(CCNA.sync.lastSync).toLocaleString()}` : "Not synced yet"}. Changes upload a moment after you make them.
             <button class="btn sm" id="sync-now">Sync now</button></p>
           <p class="muted small">Import replaces the progress on <b>all</b> devices; Reset clears it everywhere (the server keeps a backup).</p>`
        : `<p class="muted">Progress is stored in this browser's localStorage (sync works on the hosted version). Export it to back it up or move it to another browser.</p>`}
      <div class="row"><button class="btn" id="exp">Export progress (JSON)</button>
        <label class="btn">Import progress<input type="file" id="imp" accept="application/json" hidden></label>
        <button class="btn danger" id="reset">Reset all progress</button></div>
      <h3>Exam plan</h3>
      <label class="inline">Exam date <input type="date" id="sdate" value="${S.settings.examDate || ""}" max="${CCNA.EXAM.lastDay}" style="width:auto"></label>
      <label class="inline">Review buffer (days) <input type="number" id="srev" min="0" max="60" value="${S.settings.reviewDays}"></label>
      <p class="muted small">Leave the date empty to plan against the last ${CCNA.EXAM.name} test date (${CCNA.fmtDate(CCNA.EXAM.lastDay)}). The review buffer is the time before the exam kept free for mocks and weak spots — new lessons should be finished before it starts.</p>
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
      f.text().then((t) => CCNA.importState(t)).then(() => { location.hash = "#/"; })
        .catch((err) => e.target.closest("section").insertAdjacentHTML("beforeend", `<p class="bad-text">Import failed: ${esc(err.message)}</p>`));
    };
    const reset = document.getElementById("reset");
    reset.onclick = () => {
      if (reset.dataset.armed) return CCNA.resetState().catch((err) => reset.insertAdjacentHTML("afterend", ` <span class="bad-text">${esc(err.message)}</span>`));
      reset.dataset.armed = "1"; reset.textContent = CCNA.sync.enabled ? "Click again to reset on ALL devices" : "Click again to confirm reset";
    };
    document.getElementById("sdate").onchange = (e) => { S.settings.examDate = e.target.value || null; CCNA.touch("settings"); CCNA.save(); };
    document.getElementById("srev").onchange = (e) => { S.settings.reviewDays = Math.max(0, Math.min(60, +e.target.value || 0)); CCNA.touch("settings"); CCNA.save(); };
    document.getElementById("npd").onchange = (e) => { S.settings.newPerDay = Math.max(0, +e.target.value || 0); CCNA.touch("settings"); CCNA.save(); };
    const syncNow = document.getElementById("sync-now");
    if (syncNow) syncNow.onclick = () => { syncNow.disabled = true; CCNA.sync.now().catch(() => {}).finally(() => data()); };
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
    ({ "": dashboard, review, topics: () => (arg ? topicPage(arg) : topicList()), cards: () => cards(arg), quiz: () => quiz(arg), mock, drills: () => (arg ? drill(arg) : drillList()), data }[view || ""] || dashboard)();
    updateBadges();
  }

  // Load content for built days, then start.
  function boot() {
    const built = CCNA.manifest().filter((m) => m.built);
    const guides = CCNA.topics().filter((t) => t.guide);
    let pending = built.length + guides.length;
    const missing = [];
    const done = async () => {
      if (missing.length) document.getElementById("warn").innerHTML = `Content file missing for: ${missing.join(", ")} — run <code>python3 tools/status.py</code>.`;
      await CCNA.sync.init();
      CCNA.onSave.push(updateBadges); // keep the nav counters current after every answer/grade
      // Another device's progress arrived: refresh views that only display state (never a running quiz/cards/drill session).
      CCNA.onRemoteChange = () => {
        const [, view, arg] = (location.hash || "#/").split("/");
        if (!view || view === "topics" || view === "data" || (view === "drills" && !arg)) route();
        else updateBadges();
      };
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
    guides.forEach((t) => {
      const s = document.createElement("script");
      s.src = `data/guides/${t.id}.js`;
      s.onload = () => { if (!CCNA.guides[t.id]) missing.push(`guide ${t.id}`); if (--pending === 0) done(); };
      s.onerror = () => { missing.push(`guide ${t.id}`); if (--pending === 0) done(); };
      document.body.appendChild(s);
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
