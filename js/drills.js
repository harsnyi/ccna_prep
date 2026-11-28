/* Procedurally generated calculation drills. Each generator returns
 * { prompt (html), fields: [{key,label,placeholder}], answers: {key: string}, check: {key: fn(input)->bool}, explain (html) } */
(function () {
  const CCNA = window.CCNA;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---- IPv4 helpers ----
  const ipToInt = (s) => {
    const p = String(s).trim().split(".");
    if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || +x > 255)) return null;
    return ((+p[0] << 24) >>> 0) + (+p[1] << 16) + (+p[2] << 8) + +p[3];
  };
  const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
  const maskInt = (p) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
  const sameIp = (expected) => (input) => ipToInt(input) === ipToInt(expected);
  const sameNum = (expected) => (input) => String(input).trim().replace(/^\//, "") === String(expected);

  // Pick the "interesting octet" for explanations.
  const blockInfo = (p) => {
    const octet = Math.min(3, Math.floor((p === 32 ? 31 : p) / 8));
    const maskOct = (maskInt(p) >>> (24 - octet * 8)) & 255;
    return { octet: octet + 1, maskOct, block: 256 - maskOct };
  };

  // ---- IPv6 helpers ----
  const hex4 = () => rnd(0, 0xffff).toString(16).padStart(4, "0");
  const v6canonical = (groups) => {
    const g = groups.map((x) => parseInt(x, 16).toString(16));
    let best = { start: -1, len: 0 };
    for (let i = 0; i < 8; ) {
      if (g[i] === "0") { let j = i; while (j < 8 && g[j] === "0") j++; if (j - i > best.len) best = { start: i, len: j - i }; i = j; }
      else i++;
    }
    if (best.len < 2) return g.join(":");
    const left = g.slice(0, best.start).join(":");
    const right = g.slice(best.start + best.len).join(":");
    return `${left}::${right}`;
  };
  const normGroups = (s) => String(s).trim().toLowerCase().split(":").map((x) => (x === "" ? "" : parseInt(x, 16).toString(16))).join(":");

  const D = (CCNA.DRILLS = {});

  D.subnet = {
    name: "Subnet calculator",
    blurb: "Network, broadcast, first/last usable host and host count.",
    gen() {
      const p = Math.random() < 0.8 ? rnd(17, 30) : rnd(8, 16);
      const first = pick([10, 172, 192, rnd(1, 223)]);
      const ip = ((first << 24) >>> 0) + (rnd(0, 255) << 16) + (rnd(0, 255) << 8) + rnd(1, 254);
      const m = maskInt(p);
      const net = (ip & m) >>> 0;
      const bc = (net | (~m >>> 0)) >>> 0;
      const hosts = Math.pow(2, 32 - p) - 2;
      const b = blockInfo(p);
      return {
        prompt: `<span class="big mono">${intToIp(ip)}/${p}</span>`,
        fields: [
          { key: "net", label: "Network address" },
          { key: "bc", label: "Broadcast address" },
          { key: "first", label: "First usable host" },
          { key: "last", label: "Last usable host" },
          { key: "hosts", label: "Usable hosts" },
        ],
        answers: { net: intToIp(net), bc: intToIp(bc), first: intToIp(net + 1), last: intToIp(bc - 1), hosts: String(hosts) },
        check: { net: sameIp(intToIp(net)), bc: sameIp(intToIp(bc)), first: sameIp(intToIp(net + 1)), last: sameIp(intToIp(bc - 1)), hosts: sameNum(hosts) },
        explain: `/${p} = ${intToIp(m)}. Interesting octet: #${b.octet} (mask ${b.maskOct}) → block size <strong>${b.block}</strong>. Hosts = 2<sup>${32 - p}</sup> − 2 = ${hosts}.`,
      };
    },
  };

  D.mask = {
    name: "Prefix ↔ mask",
    blurb: "Convert CIDR prefix lengths to dotted-decimal masks and back.",
    gen() {
      const p = rnd(8, 30);
      if (Math.random() < 0.5) {
        return {
          prompt: `Dotted-decimal mask for <span class="big mono">/${p}</span>`,
          fields: [{ key: "a", label: "Subnet mask", placeholder: "255.255.x.x" }],
          answers: { a: intToIp(maskInt(p)) }, check: { a: sameIp(intToIp(maskInt(p))) },
          explain: `${p} ones followed by ${32 - p} zeros.`,
        };
      }
      return {
        prompt: `Prefix length for <span class="big mono">${intToIp(maskInt(p))}</span>`,
        fields: [{ key: "a", label: "Prefix length", placeholder: "/xx" }],
        answers: { a: `/${p}` }, check: { a: sameNum(p) },
        explain: `Count the 1-bits: ${p}.`,
      };
    },
  };

  D.hosts = {
    name: "Hosts → prefix",
    blurb: "Smallest subnet (largest prefix) that fits N hosts — the VLSM core skill.",
    gen() {
      const n = pick([rnd(2, 30), rnd(31, 260), rnd(261, 4000)]);
      let p = 30; while (Math.pow(2, 32 - p) - 2 < n) p--;
      return {
        prompt: `A subnet needs <span class="big mono">${n}</span> usable hosts. Smallest subnet?`,
        fields: [{ key: "a", label: "Prefix length", placeholder: "/xx" }],
        answers: { a: `/${p}` }, check: { a: sameNum(p) },
        explain: `2<sup>${32 - p}</sup> − 2 = ${Math.pow(2, 32 - p) - 2} ≥ ${n}, while 2<sup>${31 - p}</sup> − 2 = ${Math.pow(2, 31 - p) - 2} is too small.`,
      };
    },
  };

  D.wildcard = {
    name: "Wildcard masks",
    blurb: "ACL / OSPF wildcard for a given network.",
    gen() {
      const p = rnd(8, 32);
      const net = (((rnd(1, 223) << 24) >>> 0) + (rnd(0, 255) << 16) + (rnd(0, 255) << 8) + rnd(0, 255)) & maskInt(p);
      const wc = intToIp(~maskInt(p) >>> 0);
      return {
        prompt: `Wildcard mask to match <span class="big mono">${intToIp(net >>> 0)}/${p}</span>`,
        fields: [{ key: "a", label: "Wildcard mask", placeholder: "0.0.x.x" }],
        answers: { a: wc }, check: { a: sameIp(wc) },
        explain: `255.255.255.255 − ${intToIp(maskInt(p))} = ${wc}.`,
      };
    },
  };

  D.binary = {
    name: "Binary ↔ decimal",
    blurb: "Octet conversions — speed here makes everything else faster.",
    gen() {
      const v = rnd(0, 255);
      const bin = v.toString(2).padStart(8, "0");
      if (Math.random() < 0.5) {
        return {
          prompt: `Convert <span class="big mono">${v}</span> to 8-bit binary`,
          fields: [{ key: "a", label: "Binary", placeholder: "00000000" }],
          answers: { a: bin }, check: { a: (s) => /^[01 ]+$/.test(s.trim()) && parseInt(s.replace(/\s/g, ""), 2) === v },
          explain: "Place values: 128 64 32 16 8 4 2 1.",
        };
      }
      return {
        prompt: `Convert <span class="big mono">${bin.slice(0, 4)} ${bin.slice(4)}</span> to decimal`,
        fields: [{ key: "a", label: "Decimal" }],
        answers: { a: String(v) }, check: { a: sameNum(v) },
        explain: "Place values: 128 64 32 16 8 4 2 1.",
      };
    },
  };

  D.ipv6 = {
    name: "IPv6 shortening",
    blurb: "Write the shortest valid form (drop leading zeros, one :: for the longest zero run).",
    gen() {
      const g = Array.from({ length: 8 }, () => (Math.random() < 0.3 ? "0" : hex4()).padStart(4, "0"));
      g[0] = pick(["2001", "2001", "fe80", "2600", "2a02"]);
      // force at least one run of zeros and some leading zeros
      const s = rnd(1, 5), l = rnd(2, 3);
      for (let i = s; i < Math.min(8, s + l); i++) g[i] = "0000";
      if (Math.random() < 0.6) g[7] = "00" + hex4().slice(2);
      const full = g.join(":");
      const ans = v6canonical(g);
      return {
        prompt: `<span class="mono v6">${full}</span>`,
        fields: [{ key: "a", label: "Shortest form" }],
        answers: { a: ans }, check: { a: (s) => s.trim().toLowerCase() === ans },
        explain: "Remove leading zeros in each group; replace the <em>longest</em> run of ≥2 all-zero groups with <code>::</code> (leftmost if tied). Lowercase hex.",
      };
    },
  };

  D.eui64 = {
    name: "EUI-64",
    blurb: "Build a modified EUI-64 interface ID from a MAC address.",
    gen() {
      const mac = Array.from({ length: 6 }, () => rnd(0, 255));
      if (Math.random() < 0.5) mac[0] &= 0xfd; // mix of U/L bit set and unset
      const b = mac.slice(); b[0] ^= 0x02;
      const bytes = [b[0], b[1], b[2], 0xff, 0xfe, b[3], b[4], b[5]];
      const groups = [0, 2, 4, 6].map((i) => ((bytes[i] << 8) | bytes[i + 1]).toString(16).padStart(4, "0"));
      const macStr = mac.map((x) => x.toString(16).padStart(2, "0")).join("").replace(/(.{4})(?=.)/g, "$1.").toUpperCase();
      const ans = groups.join(":");
      return {
        prompt: `MAC <span class="big mono">${macStr}</span><br><span class="muted">Interface ID (last 64 bits)?</span>`,
        fields: [{ key: "a", label: "Interface ID", placeholder: "xxxx:xxff:fexx:xxxx" }],
        answers: { a: ans }, check: { a: (s) => normGroups(s) === normGroups(ans) },
        explain: `Split the MAC in half, insert <code>FFFE</code>, then invert the 7th bit (first byte ${mac[0].toString(16).padStart(2, "0")} → ${b[0].toString(16).padStart(2, "0")}).`,
      };
    },
  };

  // ---- shared helpers for the exhibit drills ----
  const inNet = (ip, net, len) => ((ip & maskInt(len)) >>> 0) === net;
  const lastIp = (net, len) => (net | (~maskInt(len) >>> 0)) >>> 0;
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, Math.max(n, s.length));
  const esc = (s) => CCNA.esc(s);
  const exhibit = (lines) => `<pre class="code exhibit">${esc(lines.join("\n"))}</pre>`;

  // ---- ACL evaluation ----
  const PORTS = { tcp: [21, 22, 23, 25, 80, 110, 443], udp: [53, 67, 69, 123, 161, 514] };
  const PORT_NAME = { 21: "ftp", 23: "telnet", 25: "smtp", 53: "domain", 67: "bootps", 69: "tftp", 80: "www", 110: "pop3", 123: "ntp", 161: "snmp", 514: "syslog" };
  const SERVICE = { 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 67: "DHCP", 69: "TFTP", 80: "HTTP", 110: "POP3", 123: "NTP", 161: "SNMP", 443: "HTTPS", 514: "Syslog" };
  const portTxt = (p) => PORT_NAME[p] || String(p);

  // An address spec: {net, len} — len 32 = host, len 0 = any
  const addrTxt = (a, standard) => {
    if (a.len === 0) return "any";
    if (a.len === 32) return standard ? intToIp(a.net) : `host ${intToIp(a.net)}`;
    const wc = intToIp(~maskInt(a.len) >>> 0);
    return standard ? `${intToIp(a.net)}, wildcard bits ${wc}` : `${intToIp(a.net)} ${wc}`;
  };
  const addrRange = (a) => (a.len === 0 ? "any address" : a.len === 32 ? intToIp(a.net) : `${intToIp(a.net)} – ${intToIp(lastIp(a.net, a.len))}`);
  const portOk = (cond, p) => !cond || (cond.op === "eq" ? p === cond.a : cond.op === "gt" ? p > cond.a : cond.op === "lt" ? p < cond.a : p >= cond.a && p <= cond.b);
  const condTxt = (c) => (c.op === "range" ? `range ${portTxt(c.a)} ${portTxt(c.b)}` : `${c.op} ${portTxt(c.a)}`);

  /** First failing field of an ACE for a packet, or null if it matches. */
  const aceMiss = (l, k, standard) => {
    if (!standard && l.proto !== "ip" && l.proto !== k.proto) return `protocol (${l.proto} ≠ ${k.proto})`;
    if (!inNet(k.src, l.src.net, l.src.len)) return `source (${intToIp(k.src)} isn't in ${addrRange(l.src)})`;
    if (standard) return null;
    if (l.sport && !portOk(l.sport, k.sport)) return `source port (${k.sport} isn't ${condTxt(l.sport)} — that port is written after the <em>source</em>)`;
    if (!inNet(k.dst, l.dst.net, l.dst.len)) return `destination (${intToIp(k.dst)} isn't in ${addrRange(l.dst)})`;
    if (l.dport && !portOk(l.dport, k.dport)) return `destination port (${k.dport} isn't ${condTxt(l.dport)})`;
    return null;
  };

  D.acl = {
    name: "ACL evaluation",
    blurb: "Read an ACL and a packet: permit or deny, and which line matched?",
    gen() {
      for (let attempt = 0; attempt < 200; attempt++) {
        const standard = Math.random() < 0.25;
        const lanNet = pick([((192 << 24) | (168 << 16) | (rnd(1, 254) << 8)) >>> 0, ((10 << 24) | (rnd(1, 99) << 16) | (rnd(0, 255) << 8)) >>> 0]);
        const srvNet = ((172 << 24) | (rnd(16, 31) << 16) | (rnd(0, 255) << 8)) >>> 0;
        const srvHosts = [10, 20, 25, 50, 100].map((h) => srvNet + h);
        const proto = standard ? "tcp" : pick(["tcp", "tcp", "tcp", "udp", "udp", "icmp"]);
        const k = {
          proto,
          src: lanNet + rnd(1, 254),
          sport: rnd(49152, 65535),
          dst: Math.random() < 0.75 ? pick(srvHosts) : ipToInt(pick(["8.8.8.8", "1.1.1.1", "203.0.113.50", "198.51.100.7"])),
          dport: proto === "icmp" ? null : pick(PORTS[proto]),
        };
        const lanSub = (contains) => {
          const len = rnd(25, 28);
          const own = (k.src & maskInt(len)) >>> 0;
          if (contains) return { net: own, len };
          const flip = 1 << (32 - len + rnd(0, len - 25)); // sibling subnet inside the /24
          return { net: (own ^ flip) >>> 0, len };
        };
        const srcSpec = () => {
          const r = Math.random();
          if (r < 0.18) return { net: 0, len: 0 };
          if (r < 0.32) return { net: k.src, len: 32 };
          if (r < 0.42) return { net: lanNet + rnd(1, 254), len: 32 };
          if (r < 0.58) return { net: lanNet, len: 24 };
          return lanSub(Math.random() < 0.45);
        };
        const dstSpec = () => {
          const r = Math.random();
          if (r < 0.3) return { net: 0, len: 0 };
          if (r < 0.6) return { net: k.dst, len: 32 };
          if (r < 0.78) return { net: pick(srvHosts.filter((h) => h !== k.dst)), len: 32 };
          return { net: srvNet, len: 24 };
        };
        const n = rnd(3, 5);
        const lines = [];
        for (let i = 0; i < n; i++) {
          const l = { action: pick(["permit", "deny"]), src: srcSpec() };
          if (!standard) {
            const pr = Math.random();
            l.proto = pr < 0.45 ? k.proto : pr < 0.7 ? "ip" : pick(["tcp", "udp", "icmp"].filter((x) => x !== k.proto));
            l.dst = dstSpec();
            if (l.proto === "tcp" || l.proto === "udp") {
              const pr2 = Math.random();
              const pool = PORTS[l.proto];
              if (pr2 < 0.1 && l.proto === "tcp") l.sport = { op: "eq", a: pick([80, 443, 23]) }; // the source-port trap
              else if (pr2 < 0.65) l.dport = { op: "eq", a: l.proto === k.proto && Math.random() < 0.55 ? k.dport : pick(pool) };
              else if (pr2 < 0.75) { const a = pick([20, 21, 50, 60, 100]); l.dport = { op: "range", a, b: a + pick([5, 30, 60]) }; }
              else if (pr2 < 0.82) l.dport = { op: pick(["gt", "lt"]), a: 1023 };
            }
          }
          lines.push(l);
        }
        const tail = Math.random();
        if (tail < 0.35) lines.push(standard ? { action: "permit", src: { net: 0, len: 0 } } : { action: "permit", proto: "ip", src: { net: 0, len: 0 }, dst: { net: 0, len: 0 } });
        else if (tail < 0.45) lines.push(standard ? { action: "deny", src: { net: 0, len: 0 } } : { action: "deny", proto: "ip", src: { net: 0, len: 0 }, dst: { net: 0, len: 0 } });

        const txt = lines.map((l) => standard
          ? `${l.action} ${addrTxt(l.src, true)}`
          : [l.action, l.proto, addrTxt(l.src), l.sport && condTxt(l.sport), addrTxt(l.dst), l.dport && condTxt(l.dport)].filter(Boolean).join(" "));
        if (new Set(txt).size !== txt.length) continue;
        const hit = lines.findIndex((l) => !aceMiss(l, k, standard));
        // Interesting cases only: the answer shouldn't usually be line 10, and catch-all lines shouldn't win too often.
        if (hit === 0 && Math.random() < 0.8) continue;
        if (hit >= 0 && lines[hit].src.len === 0 && (standard || lines[hit].dst.len === 0) && Math.random() < 0.6) continue;

        const name = pick(["LAN_IN", "BRANCH_FILTER", "SERVERS", "EDGE_IN", "BLOCK_LIST"]);
        const header = standard ? `Standard IP access list ${pick([1, 5, 10, 15, 20, 99])}` : `Extended IP access list ${Math.random() < 0.5 ? name : pick([100, 101, 110, 120, 150])}`;
        const shown = [header, ...txt.map((t, i) => `    ${(i + 1) * 10} ${t.replace(/^(permit|deny) /, (m, a) => pad(a, 6) + " ")}`)];
        const pktTxt = k.proto === "icmp"
          ? `ICMP echo request  ${intToIp(k.src)} → ${intToIp(k.dst)}`
          : `${k.proto.toUpperCase()}  ${intToIp(k.src)}:${k.sport} → ${intToIp(k.dst)}:${k.dport}  (${SERVICE[k.dport]})`;
        const action = hit >= 0 ? lines[hit].action : "deny";
        const lineAns = hit >= 0 ? String((hit + 1) * 10) : "implicit";
        const walk = lines.slice(0, hit >= 0 ? hit + 1 : lines.length).map((l, i) => {
          const miss = aceMiss(l, k, standard);
          return `<li><b>${(i + 1) * 10}</b> ${miss ? `✗ ${miss}` : `✓ every field matches → <b>${l.action}</b>`}</li>`;
        }).join("");
        const names = [...new Set(txt.join(" ").match(/\b(ftp|telnet|smtp|domain|bootps|tftp|www|pop3|ntp|snmp|syslog)\b/g) || [])];
        return {
          prompt: `<p>Applied <b>inbound</b> on the LAN interface. ${standard ? "A standard ACL checks the <b>source address only</b>." : ""}</p>
            ${exhibit(shown)}
            <p>Packet: <span class="mono">${esc(pktTxt)}</span></p>`,
          fields: [
            { key: "action", label: "Permit or deny?", placeholder: "permit / deny" },
            { key: "line", label: "Matching line", placeholder: "10, 20… or implicit" },
          ],
          answers: { action, line: lineAns },
          check: {
            action: (s) => { const t = s.trim().toLowerCase(); return (/^(permit|allow|pass)/.test(t) ? "permit" : /^(deny|denied|block|drop)/.test(t) ? "deny" : "") === action; },
            line: (s) => (hit >= 0 ? String(s).trim().replace(/^line\s*/i, "") === lineAns : /^(implicit|imp|none|-|0|end)/i.test(String(s).trim())),
          },
          explain: `<ol class="walk">${walk}</ol>${hit < 0 ? "<p>No line matched, so the <b>implicit deny any</b> at the end drops it.</p>" : ""}
            ${names.length ? `<p class="small">IOS shows well-known ports by name: ${names.map((x) => `<code>${x}</code> = ${Object.keys(PORT_NAME).find((p) => PORT_NAME[p] === x)}`).join(", ")}.</p>` : ""}`,
        };
      }
      return D.acl.gen();
    },
  };

  // ---- Longest-prefix match ----
  D.lpm = {
    name: "Longest-prefix match",
    blurb: "Read <code>show ip route</code>: which route is used for a destination, and where does it go?",
    gen() {
      const B = rnd(1, 250);
      let dest = (((10 << 24) | (B << 16)) >>> 0) + (rnd(0, 255) << 8) + rnd(1, 254);
      const r = Math.random();
      const scenario = r < 0.12 ? "drop" : r < 0.27 ? "default" : "match";
      const HOPS = { O: { nh: "10.0.12.2", iface: "GigabitEthernet0/1" }, D: { nh: "10.0.13.3", iface: "GigabitEthernet0/2" }, S: [{ nh: "10.0.12.2" }, { nh: "10.0.13.3" }] };
      const routes = [];
      const add = (net, len, code) => {
        if (routes.some((x) => x.net === net && x.len === len)) return null;
        const rt = { net, len, code };
        if (code === "S") rt.nh = pick(HOPS.S).nh;
        else if (code === "O" || code === "D") { rt.nh = HOPS[code].nh; rt.iface = HOPS[code].iface; rt.metric = code === "O" ? rnd(2, 40) : rnd(28000, 160000); }
        routes.push(rt);
        return rt;
      };

      let answer = null;
      let lo = 16; // near-miss routes are generated inside 10.B.0.0/16 (or inside the answer)
      if (scenario === "match") {
        const lens = CCNA.shuffle([8, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]).slice(0, rnd(1, 3)).sort((a, b) => a - b);
        const best = lens[lens.length - 1];
        if (best >= 24 && Math.random() < 0.3) {
          // the best match is a directly connected LAN
          const net = (dest & maskInt(best)) >>> 0;
          dest = net + rnd(2, Math.pow(2, 32 - best) - 2);
          answer = add(net, best, "C");
          answer.iface = "GigabitEthernet0/3";
          add(net + 1, 32, "L").iface = "GigabitEthernet0/3";
        }
        lens.forEach((len) => { const rt = add((dest & maskInt(len)) >>> 0, len, pick(["O", "O", "D", "S"])); if (len === best && !answer) answer = rt; });
        lo = best;
      }
      // near misses: longer prefixes right next to the destination that do NOT contain it
      const missLens = CCNA.shuffle([22, 23, 24, 25, 26, 27, 28, 29, 30].filter((l) => l > lo)).slice(0, rnd(2, 3));
      missLens.forEach((len) => {
        const bit = 32 - len + rnd(0, Math.min(3, len - lo - 1));
        add((((dest & maskInt(len)) >>> 0) ^ (1 << bit)) >>> 0, len, pick(["O", "D", "S"]));
      });
      const hasDefault = scenario === "default" || (scenario === "match" && Math.random() < 0.6);
      if (hasDefault) { const d = add(0, 0, "S*"); d.nh = "203.0.113.1"; if (scenario === "default") answer = d; }
      // the router's own links
      [["10.0.12.0", 30, "GigabitEthernet0/1", "10.0.12.1"], ["10.0.13.0", 30, "GigabitEthernet0/2", "10.0.13.1"], ["203.0.113.0", 30, "GigabitEthernet0/0", "203.0.113.2"]]
        .forEach(([n, l, ifc, own]) => { add(ipToInt(n), l, "C").iface = ifc; add(ipToInt(own), 32, "L").iface = ifc; });

      routes.sort((a, b) => a.net - b.net || a.len - b.len);
      const line = (rt) => {
        const pfx = `${intToIp(rt.net)}/${rt.len}`;
        const code = pad(rt.code, rt.code === "S*" || rt.len === 0 ? 6 : 9);
        if (rt.code === "C" || rt.code === "L") return `${code}${pfx} is directly connected, ${rt.iface}`;
        if (rt.code === "S" || rt.code === "S*") return `${code}${pfx} [1/0] via ${rt.nh}`;
        return `${code}${pfx} [${rt.code === "O" ? 110 : 90}/${rt.metric}] via ${rt.nh}, 00:${String(rnd(10, 59))}:${String(rnd(10, 59))}, ${rt.iface}`;
      };
      const out = [hasDefault ? "Gateway of last resort is 203.0.113.1 to network 0.0.0.0" : "Gateway of last resort is not set", ""];
      let major = null;
      routes.forEach((rt) => {
        const m = rt.len === 0 ? null : rt.net >>> 24 === 10 ? "10.0.0.0/8" : rt.net >>> 24 === 203 ? "203.0.113.0/24" : null;
        if (m && m !== major) {
          const group = routes.filter((x) => x.len > 0 && (m === "10.0.0.0/8" ? x.net >>> 24 === 10 : x.net >>> 24 === 203));
          out.push(`      ${m} is variably subnetted, ${group.length} subnets, ${new Set(group.map((x) => x.len)).size} masks`);
        }
        major = m;
        out.push(line(rt));
      });

      const containing = routes.filter((rt) => rt.code !== "L" && rt.len > 0 && inNet(dest, rt.net, rt.len)).sort((a, b) => a.len - b.len);
      const pfxTxt = (rt) => `${intToIp(rt.net)}/${rt.len}`;
      const routeAns = answer ? pfxTxt(answer) : "none (dropped)";
      const nhAns = !answer ? "none (dropped)" : answer.code === "C" ? "directly connected" : answer.nh;
      const near = routes.filter((rt) => rt.len > (answer ? answer.len : 0) && rt.code !== "L" && !inNet(dest, rt.net, rt.len) && inNet(rt.net, (dest & maskInt(Math.min(rt.len, 24) - 2)) >>> 0, Math.min(rt.len, 24) - 2))
        .sort((a, b) => b.len - a.len)[0];
      const parsePfx = (s) => {
        const t = String(s).trim().toLowerCase();
        if (/^default/.test(t)) return { net: 0, len: 0 };
        let m = t.match(/^(\d+\.\d+\.\d+\.\d+)\s*\/\s*(\d+)$/);
        if (m) return { net: ipToInt(m[1]), len: +m[2] };
        m = t.match(/^(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)$/);
        if (m) { const mk = ipToInt(m[2]); return { net: ipToInt(m[1]), len: mk === null ? -1 : (mk.toString(2).match(/1/g) || []).length }; }
        return null;
      };
      const dropRe = /^(none|drop|dropped|no route|discard|-)/i;
      return {
        prompt: `<p>R1 receives a packet for <span class="big mono">${intToIp(dest)}</span></p>${exhibit(["R1# show ip route", ...out])}`,
        fields: [
          { key: "route", label: "Route used", placeholder: "a.b.c.d/len, or none" },
          { key: "nh", label: "Next hop", placeholder: "IP, connected, or none" },
        ],
        answers: { route: routeAns, nh: nhAns },
        check: {
          route: (s) => { if (!answer) return dropRe.test(String(s).trim()); const p = parsePfx(s); return !!p && p.net === answer.net && p.len === answer.len; },
          nh: (s) => (!answer ? dropRe.test(String(s).trim()) : answer.code === "C" ? /connect|direct/i.test(s) : ipToInt(s) === ipToInt(answer.nh)),
        },
        explain: (containing.length
          ? `Routes containing ${intToIp(dest)}: ${containing.map((rt) => `<code>${pfxTxt(rt)}</code>`).join(", ")}. The <b>longest prefix</b> wins → <b>${pfxTxt(answer)}</b>${answer.code === "C" ? " (directly connected)" : ` via ${answer.nh}`}.`
          : `No specific route contains ${intToIp(dest)}${answer ? `, so the <b>default route</b> (gateway of last resort ${answer.nh}) is used.` : " and there's <b>no gateway of last resort</b>, so the packet is <b>dropped</b> (the router sends an ICMP unreachable)."}`)
          + (near ? ` <code>${pfxTxt(near)}</code> looks close, but it only covers ${intToIp(near.net)} – ${intToIp(lastIp(near.net, near.len))}.` : "")
          + " Administrative distance and metric only matter between routes to the <em>same</em> prefix.",
      };
    },
  };

  D.ospfcost = {
    name: "OSPF cost",
    blurb: "reference bandwidth ÷ interface bandwidth (minimum 1).",
    gen() {
      const ref = pick([100, 100, 1000, 10000, 100000]);
      const bw = pick([10, 100, 1000, 10000]);
      const cost = Math.max(1, Math.floor(ref / bw));
      const label = (m) => (m >= 1000 ? `${m / 1000} Gbps` : `${m} Mbps`);
      return {
        prompt: `Reference bandwidth <span class="mono">${ref}</span> Mbps${ref === 100 ? " (default)" : ""}<br>Interface: <span class="big mono">${label(bw)}</span>`,
        fields: [{ key: "a", label: "OSPF cost" }],
        answers: { a: String(cost) }, check: { a: sameNum(cost) },
        explain: `${ref} / ${bw} = ${ref / bw}${ref / bw < 1 ? " → rounded up to the minimum of 1" : ""}. Change with <code>auto-cost reference-bandwidth</code> on all routers.`,
      };
    },
  };

})();
