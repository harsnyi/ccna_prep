/* Topic study guides: registry + a small Markdown renderer for guide content. */
(function () {
  const CCNA = window.CCNA;

  CCNA.topics = () => window.CCNA_TOPICS || [];
  CCNA.topic = (id) => CCNA.topics().find((t) => t.id === id);
  CCNA.WEIGHTS = {
    core: { name: "Core", blurb: "Asked constantly — config, verification and troubleshooting." },
    important: { name: "Important", blurb: "Regular exam questions." },
    know: { name: "Know it", blurb: "Recognition level: definitions and comparisons." },
  };

  // ---- registry (filled by data/guides/*.js) ----
  CCNA.guides = {};
  CCNA.addGuide = function (id, data) {
    CCNA.guides[id] = data;
  };

  /** Sections of a topic marked understood: {sectionId: "yyyy-mm-dd"}. */
  CCNA.guideProgress = (id) => (CCNA.state.guides[id] = CCNA.state.guides[id] || {});
  CCNA.guideStats = (id) => {
    const g = CCNA.guides[id];
    if (!g) return { sections: 0, understood: 0 };
    const p = CCNA.state.guides[id] || {};
    return { sections: g.sections.length, understood: g.sections.filter((s) => p[s.id]).length };
  };

  // ---- Markdown subset ----
  // Blocks: #/##/### headings, paragraphs, - and 1. lists, | tables |, ``` or ~~~ code fences,
  // > [!tip|trap|example|note|key] Title  callouts (body lines start with "> "), and raw HTML blocks (line starts with "<").
  // Inline: `code`, **bold**, *italic*, [text](url), 2^n superscripts.
  const inline = (s) =>
    CCNA.esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
      .replace(/(\d)\^(\w+)/g, "$1<sup>$2</sup>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) =>
        `<a href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`);

  const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  CCNA.md = function md(src) {
    const lines = src.replace(/\r/g, "").split("\n");
    // Strip the common indentation so guides can be indented inside JS template literals.
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    const L = lines.map((l) => l.slice(indent));
    const out = [];
    let i = 0;
    while (i < L.length) {
      const line = L[i];
      if (!line.trim()) { i++; continue; }
      let m;
      if (/^(```|~~~)/.test(line)) {
        const fence = line.slice(0, 3);
        const buf = []; i++;
        while (i < L.length && !L[i].startsWith(fence)) buf.push(L[i++]);
        i++;
        out.push(`<pre class="code">${CCNA.esc(buf.join("\n"))}</pre>`);
      } else if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
        const lvl = m[1].length === 3 ? 4 : 3; // # and ## -> h3, ### -> h4
        out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); i++;
      } else if (line.startsWith(">")) {
        const buf = [];
        while (i < L.length && L[i].startsWith(">")) buf.push(L[i++].replace(/^>\s?/, ""));
        const head = buf[0].match(/^\[!(\w+)\]\s*(.*)/);
        const kind = head ? head[1].toLowerCase() : "note";
        const title = head ? head[2] : "";
        const body = head ? buf.slice(1) : buf;
        out.push(`<div class="callout ${kind}">${title ? `<div class="callout-title">${inline(title)}</div>` : ""}${md(body.join("\n"))}</div>`);
      } else if (line.startsWith("<")) {
        const buf = [];
        while (i < L.length && L[i].trim()) buf.push(L[i++]);
        out.push(buf.join("\n"));
      } else if (line.trim().startsWith("|")) {
        const rows = [];
        while (i < L.length && L[i].trim().startsWith("|")) rows.push(L[i++]);
        const hasHead = rows[1] && /^\|?\s*:?-{2,}/.test(rows[1].trim());
        const head = hasHead ? `<thead><tr>${cells(rows[0]).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` : "";
        const body = (hasHead ? rows.slice(2) : rows).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
        out.push(`<div class="table-wrap"><table class="md">${head}<tbody>${body}</tbody></table></div>`);
      } else if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
        const ordered = /^\s*\d+\./.test(line);
        const items = [];
        while (i < L.length && L[i].trim()) {
          const lm = L[i].match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
          if (lm) items.push(lm[1]);
          else items[items.length - 1] += " " + L[i].trim(); // continuation line
          i++;
        }
        const tag = ordered ? "ol" : "ul";
        out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
      } else {
        const buf = [];
        while (i < L.length && L[i].trim() && !/^(#{1,3}\s|>|```|~~~|<|\s*\||\s*([-*]|\d+\.)\s)/.test(L[i])) buf.push(L[i++].trim());
        out.push(`<p>${inline(buf.join(" "))}</p>`);
      }
    }
    return out.join("\n");
  };
})();
