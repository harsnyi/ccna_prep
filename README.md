# CCNA Prep

Local study app built on top of [`../CCNA_Course_Notes`](../CCNA_Course_Notes) (Jeremy's IT Lab CCNA 200-301, Days 1–63).

**Run it:** open `index.html` in a browser. No build step, no server, works offline.
(Optional: `python3 -m http.server` in this folder, then open http://localhost:8000.)
Progress is saved in the browser's localStorage — use **Data → Export** to back it up.

## What's inside

| View | What it does |
|---|---|
| **Exam plan** (top of dashboard) | Countdown to your exam date (defaults to Feb 2, 2027, the last day to sit 200-301 v1.1). Shows lessons/day needed to finish before a review buffer, your actual 7-day pace and the finish date it projects, an on-track status, a rough readiness %, milestones to hit before exam day, and a study streak with a 4-week activity grid. Set the date and buffer on the dashboard or under **Data**. |
| **Topics** | The exam blueprint as 24 key topics (Core / Important / Know it), each with what the exam expects, related lessons and drills. Topics with an **in-app study guide** (so far: Subnetting) have in-depth sections with worked examples, *Check yourself* questions and per-section "understood" tracking. |
| **Dashboard** | Study-today suggestions, progress per exam domain (weighted like the real exam), and all 66 lessons with done-checkbox, content status and mastery. |
| **Flashcards** | Spaced repetition (SM-2 style: Again / Hard / Good / Easy). Due reviews first, then up to N new cards/day. Keys: `Space` flip, `1–4` grade. |
| **Quiz** (per day) | Exam-style single/multi-choice with immediate explanation + link back to the note. Keys: `A–E` select, `Enter` next. Best score is tracked. |
| **Mock exam** | Draws from all built days using blueprint weights, timed (1.2 min/question), no feedback until the end, no going back. Per-domain breakdown. |
| **Drills** | Generated, endless: subnet calculator, prefix↔mask, hosts→prefix, wildcard masks, binary↔decimal, IPv6 shortening, EUI-64, OSPF cost. Tracks accuracy, streaks and fastest time. |

## Content build tracking

Practice content is written day by day. **`data/manifest.js` is the source of truth** — each lesson has `"built": true|false`.

```bash
python3 tools/status.py          # full table + totals + validation
python3 tools/status.py --todo   # only lessons still to build
```

The script also validates content files (ids, answer indexes, manifest ↔ file consistency) and exits non-zero on problems. The dashboard shows the same status in its "Content" column.

### Adding a day

1. Read the note: `../CCNA_Course_Notes/Course_Notes/<file>.md`
2. Create `data/days/<id>.js` (copy `d26.js` as a template). Contents must be **strict JSON** inside `CCNA.addDay("<id>", { ... });`
3. Set `"built": true` for that id in `data/manifest.js`
4. Run `python3 tools/status.py`

Format:

```js
CCNA.addDay("d27", {
  "cards": [
    {"id": "d27-c01", "front": "Question side", "back": "Answer side"}
  ],
  "questions": [
    {"id": "d27-q01", "type": "single",            // or "multi" ("Choose two.")
     "q": "Question text",
     "options": ["A", "B", "C", "D"],
     "answer": [2],                                // 0-based indexes into options
     "explain": "Why — shown after answering"}
  ]
});
```

Text fields support `` `code` ``, `**bold**` and `\n` newlines. For exhibits (`show` output, configs), wrap the lines in triple backticks inside the string: `"Exhibit:\n```\nSW1# show mac address-table\n...\n```\nWhat does SW1 do?"`. Spacing is preserved, so columns line up.

- Text supports `` `code` ``, `**bold**` and `\n` newlines.
- **Never renumber existing ids** — flashcard schedules and answer history are keyed by id. Append new ones.
- Aim for ~15–20 cards and ~10 questions per lesson; prefer exam-style traps (defaults, AD values, command syntax, "which TWO").
- Ids with a letter suffix (`d11a`, `d54b`) are lessons that share a day number.

### Adding a topic study guide

Key topics live in **`data/topics.js`** (strict JSON; `"guide": true|false`). Guides are independent of the course days. They are written for this app and go deeper than the notes.

1. Create `data/guides/<topic-id>.js` (copy `subnetting.js` as a template):
   `CCNA.addGuide("<id>", { intro, sections: [{ id, title, md, checks: [{ q, a }] }] })`
2. `md` is a Markdown subset (headings, lists, tables, `~~~` code fences, `> [!tip|trap|example|key] Title` callouts, raw HTML lines). Inside the template literal, escape backticks as `` \` `` and never write `${`.
3. Set `"guide": true` for the topic in `data/topics.js`, then run `python3 tools/status.py`.
