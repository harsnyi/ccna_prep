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
