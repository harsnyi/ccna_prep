/*
 * Study guide: IPv4 Addressing & Subnetting (blueprint 1.6, 1.7).
 * Format: CCNA.addGuide(id, { intro, sections: [{ id, title, md, checks: [{q, a}] }] })
 * md = Markdown subset rendered by js/guides.js (escape backticks as \` ; use ~~~ for code fences).
 */
CCNA.addGuide("subnetting", {
  intro: `
    Subnetting is the one skill the CCNA tests **directly and indirectly** at the same time. You will get
    questions that ask for a network, broadcast or host range outright — and many more (ACLs, OSPF, routing
    tables, troubleshooting) that silently assume you can subnet in your head.

    Work through the sections in order, answer the *Check yourself* questions without looking, then go to the
    drills until a full subnet calculation takes you **under 30 seconds**.
  `,
  sections: [
    {
      id: "why",
      title: "Why subnetting decides your exam",
      md: `
        ## Where it shows up
        | Question type | What you actually have to do |
        |---|---|
        | "Which is the broadcast address / a valid host / the network of…" | Direct subnet calculation |
        | "Which mask supports 50 hosts with the most subnets?" | Hosts → prefix |
        | VLSM / addressing-plan questions | Allocate blocks without overlap |
        | ACLs and OSPF \`network\` commands | Wildcard masks = inverted subnet masks |
        | Routing-table / "which route is used" questions | Does the address fall inside this prefix? (longest match) |
        | Troubleshooting "PC1 can't reach the server" | Is the host in the same subnet as its gateway? Is the mask right? |

        ## What "good" looks like
        - You convert any mask ↔ prefix instantly (memorised, not calculated).
        - You find network / broadcast / first / last host for any octet in **< 30 s**, without binary.
        - You know the private ranges and special addresses by heart.

        > [!tip] Study order
        > Sections 2–3 are the foundation — memorise the tables. Section 5 (block-size method) is the one
        > technique you will use on almost every question. Everything after that builds on it.
      `,
      checks: [],
    },
    {
      id: "binary",
      title: "IPv4 addresses in binary",
      md: `
        An IPv4 address is **32 bits**, written as four 8-bit **octets** in dotted decimal (each 0–255).
        Every octet uses the same bit values:

        | Bit | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |
        |---|---|---|---|---|---|---|---|---|
        | Value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

        ## Decimal → binary (subtract from the left)
        Walk the values left to right; if the value fits, write 1 and subtract, otherwise write 0.

        > [!example] 172 → binary
        > 172 − 128 = 44 → **1** · 64 doesn't fit → **0** · 44 − 32 = 12 → **1** · 16 doesn't fit → **0** ·
        > 12 − 8 = 4 → **1** · 4 − 4 = 0 → **1** · then **0 0**
        >
        > 172 = \`10101100\`

        ## Binary → decimal (add the 1s)
        \`11010010\` = 128 + 64 + 16 + 2 = **210**

        ## Powers of two you need instantly
        | 2^n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 16 |
        |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
        | value | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 65536 |

        > [!tip] You rarely need full binary on the exam
        > Binary is how you *understand* subnetting; the block-size method in section 5 is how you *do* it fast.
        > Still, be able to convert one octet in a few seconds — it rescues you when you doubt an answer.
      `,
      checks: [
        { q: "Convert 201 to binary.", a: "`11001001` (128 + 64 + 8 + 1)" },
        { q: "Convert `10111000` to decimal.", a: "184 (128 + 32 + 16 + 8)" },
        { q: "How many bits are in an IPv4 address, and how many in one octet?", a: "32 bits in total, 8 bits per octet (values 0–255)." },
      ],
    },
    {
      id: "masks",
      title: "Prefix length and subnet mask",
      md: `
        The **prefix length** (/n) says how many leading bits are the **network** part; the remaining
        32 − n bits are the **host** part. The **subnet mask** is the same thing written as an address:
        n ones followed by zeros.

        \`/26\` = \`11111111.11111111.11111111.11000000\` = **255.255.255.192**

        ## The nine possible mask-octet values
        A mask octet can only be one of these (ones are always contiguous, from the left):

        | Ones in octet | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
        |---|---|---|---|---|---|---|---|---|---|
        | Octet value | 0 | 128 | 192 | 224 | 240 | 248 | 252 | 254 | 255 |
        | Block size (256 − value) | – | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

        ## Master table (memorise /17 – /32)
        | Prefix | Mask | Block size (in octet) | Usable hosts |
        |---|---|---|---|
        | /16 | 255.255.0.0 | 1 (3rd) | 65 534 |
        | /17 | 255.255.128.0 | 128 (3rd) | 32 766 |
        | /18 | 255.255.192.0 | 64 (3rd) | 16 382 |
        | /19 | 255.255.224.0 | 32 (3rd) | 8 190 |
        | /20 | 255.255.240.0 | 16 (3rd) | 4 094 |
        | /21 | 255.255.248.0 | 8 (3rd) | 2 046 |
        | /22 | 255.255.252.0 | 4 (3rd) | 1 022 |
        | /23 | 255.255.254.0 | 2 (3rd) | 510 |
        | /24 | 255.255.255.0 | 1 (3rd) | 254 |
        | /25 | 255.255.255.128 | 128 (4th) | 126 |
        | /26 | 255.255.255.192 | 64 (4th) | 62 |
        | /27 | 255.255.255.224 | 32 (4th) | 30 |
        | /28 | 255.255.255.240 | 16 (4th) | 14 |
        | /29 | 255.255.255.248 | 8 (4th) | 6 |
        | /30 | 255.255.255.252 | 4 (4th) | 2 |
        | /31 | 255.255.255.254 | 2 (4th) | 2 (point-to-point only) |
        | /32 | 255.255.255.255 | 1 (4th) | 1 (host route / loopback) |

        /8 – /15 follow exactly the same pattern in the **2nd** octet (/9 = 255.128.0.0, /12 = 255.240.0.0, …).

        > [!tip] Shortcut
        > Prefix → mask: \`prefix mod 8\` tells you how many ones are in the partial octet; the full octets before it are 255.
        > /21 → 21 = 8 + 8 + **5** → 255.255.**248**.0
      `,
      checks: [
        { q: "What is the mask for /27?", a: "255.255.255.224" },
        { q: "What prefix is 255.255.240.0?", a: "/20 (8 + 8 + 4)" },
        { q: "What is the block size of 255.255.255.248, and in which octet?", a: "8, in the 4th octet (256 − 248)." },
        { q: "Is 255.255.255.225 a valid subnet mask?", a: "No. 225 = `11100001`: the ones aren't contiguous. Valid values are 0, 128, 192, 224, 240, 248, 252, 254 and 255." },
      ],
    },
    {
      id: "ranges",
      title: "Address classes, private and special ranges",
      md: `
        Classful addressing is obsolete for routing, but the exam still expects you to recognise classes
        and default masks.

        | Class | First octet | Leading bits | Default mask | Purpose |
        |---|---|---|---|---|
        | A | 1 – 126 | 0 | /8 | Unicast |
        | B | 128 – 191 | 10 | /16 | Unicast |
        | C | 192 – 223 | 110 | /24 | Unicast |
        | D | 224 – 239 | 1110 | – | Multicast |
        | E | 240 – 255 | 1111 | – | Reserved / experimental |

        **127.0.0.0/8** is loopback (127.0.0.1 = "this host"), which is why class A stops at 126.

        ## Private addresses (RFC 1918) — not routed on the Internet, need NAT
        | Range | Prefix | Class-wise |
        |---|---|---|
        | 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | one class A |
        | 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | 16 class Bs |
        | 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 256 class Cs |

        ## Other special addresses
        - **0.0.0.0** — "this host / unspecified"; **0.0.0.0/0** is the default route.
        - **169.254.0.0/16** — APIPA / link-local: a host gives itself one when **DHCP fails**.
        - **255.255.255.255** — limited broadcast (never forwarded by routers).
        - **100.64.0.0/10** — carrier-grade NAT shared space (recognition only).

        > [!trap] Classic distractor
        > **172.32.0.1 is public.** The private block is 172.16 – 172.31 only. Likewise 192.169.x.x and 11.x.x.x are public.
      `,
      checks: [
        { q: "Is 172.31.255.1 a private address?", a: "Yes — 172.16.0.0/12 covers 172.16.0.0 to 172.31.255.255." },
        { q: "Which class is 191.10.1.1, and what is its default mask?", a: "Class B (128–191), default mask 255.255.0.0 (/16)." },
        { q: "A Windows PC shows 169.254.12.7 /16. What happened?", a: "It didn't get a DHCP lease and configured itself with an APIPA (link-local) address." },
      ],
    },
    {
      id: "blocksize",
      title: "Network, broadcast & host range — the block-size method",
      md: `
        This is the core technique. It works for any prefix, in any octet, with no binary.

        1. **Find the interesting octet** — the octet where the mask is neither 255 nor 0 (where the prefix boundary falls).
        2. **Block size** = 256 − mask value in that octet.
        3. **Network** — in the interesting octet, take the largest multiple of the block size that is ≤ the address value. Octets to the right become **0**.
        4. **Broadcast** — network value + block size − 1 in the interesting octet. Octets to the right become **255**.
        5. **Hosts** — first = network + 1, last = broadcast − 1 (in the last octet). Count = 2^h − 2.

        Octets to the *left* of the interesting octet are copied unchanged.

        > [!example] A — interesting octet is the 4th: 192.168.10.77/27
        > - Mask 255.255.255.**224** → block size **32**
        > - Multiples of 32: 0, 32, **64**, 96 … → 77 falls in 64–95
        > - Network **192.168.10.64** · Broadcast **192.168.10.95**
        > - Hosts **192.168.10.65 – 192.168.10.94** (30 usable)

        The same in binary — the first 3 bits of the last octet are network bits:

        <div class="callout"><div class="bin">77 &nbsp;= <span class="n">010</span><span class="h">01101</span><br>net = <span class="n">010</span><span class="h">00000</span> = 64 &nbsp;(host bits all 0)<br>bc &nbsp;= <span class="n">010</span><span class="h">11111</span> = 95 &nbsp;(host bits all 1)</div></div>

        > [!example] B — interesting octet is the 3rd: 172.16.45.200/20
        > - Mask 255.255.**240**.0 → block size **16** in the 3rd octet
        > - Multiples of 16: … 16, **32**, 48 … → 45 falls in 32–47
        > - Network **172.16.32.0** · Broadcast **172.16.47.255**
        > - Hosts **172.16.32.1 – 172.16.47.254** (2^12 − 2 = 4 094 usable)

        > [!example] C — interesting octet is the 2nd: 10.100.3.9/11
        > - Mask 255.**224**.0.0 → block size **32** in the 2nd octet
        > - Multiples of 32: 64, **96**, 128 → 100 falls in 96–127
        > - Network **10.96.0.0** · Broadcast **10.127.255.255**
        > - Hosts **10.96.0.1 – 10.127.255.254** (2^21 − 2 = 2 097 150 usable)

        > [!trap] Mistakes that cost points
        > - When the interesting octet is the 3rd, the network ends in **.0** and the broadcast in **.255** — not in the block value.
        > - The last usable host is broadcast − 1 **in the last octet** (172.16.47.254), not 172.16.46.255.
        > - For /8, /16, /24 there is no partial octet: just zero (network) or 255 (broadcast) the host octets.
      `,
      checks: [
        { q: "10.1.1.130/26 — network, broadcast and host range?", a: "Block 64 → 128–191. Network 10.1.1.128, broadcast 10.1.1.191, hosts 10.1.1.129 – 10.1.1.190." },
        { q: "172.20.99.14/22 — network and broadcast?", a: "Mask 255.255.252.0, block 4 in the 3rd octet → 96–99. Network 172.20.96.0, broadcast 172.20.99.255 (hosts .96.1 – .99.254)." },
        { q: "Can 192.168.5.63/26 be assigned to a host?", a: "No. Block 64 → subnet 192.168.5.0 – .63, so .63 is the broadcast address." },
        { q: "Are 192.168.1.100/25 and 192.168.1.130/25 in the same subnet?", a: "No. /25 splits the octet into 0–127 and 128–255, so they need a router between them." },
      ],
    },
    {
      id: "counting",
      title: "Counting hosts and subnets",
      md: `
        | You want | Formula | Where the bits come from |
        |---|---|---|
        | Usable hosts per subnet | **2^h − 2** | h = 32 − prefix (host bits) |
        | Number of subnets | **2^s** | s = new prefix − original prefix (borrowed bits) |

        The "− 2" removes the **network** address (host bits all 0) and the **broadcast** address (host bits all 1).

        > [!example] 192.168.1.0/24 split into /27s
        > s = 27 − 24 = 3 → **8 subnets**; h = 5 → **30 hosts** each.
        > Subnets (block 32): .0, .32, .64, .96, .128, .160, .192, .224

        > [!example] 172.16.0.0/16 split into /22s
        > s = 6 → **64 subnets**; h = 10 → **1 022 hosts** each.
        > Subnets step by 4 in the 3rd octet: 172.16.0.0, 172.16.4.0, 172.16.8.0 … 172.16.252.0

        ## Special prefixes
        - **/31** — 2 addresses and **both are usable** on point-to-point links (RFC 3021). No network/broadcast waste.
        - **/32** — a single address: loopbacks and host routes.
        - **Subnet zero** (the first subnet) and the **all-ones** subnet (the last) are usable on modern IOS (\`ip subnet-zero\` has been the default for years). On the exam, count them unless the question says otherwise.

        > [!tip] Finding the Nth subnet
        > The Nth subnet starts at (N − 1) × block size. 5th /28 of 192.168.50.0/24 → 4 × 16 = 64 → **192.168.50.64/28**.
      `,
      checks: [
        { q: "How many usable hosts does a /21 provide?", a: "2^11 − 2 = 2 046" },
        { q: "10.0.0.0/8 is split into /12 subnets. How many subnets, and how many hosts each?", a: "2^4 = 16 subnets, each with 2^20 − 2 = 1 048 574 usable hosts." },
        { q: "What is the 5th subnet when 192.168.50.0/24 is split into /28s?", a: "192.168.50.64/28 (block 16: .0, .16, .32, .48, .64)." },
        { q: "How many usable hosts does a /31 have on a router-to-router link?", a: "2. On point-to-point links both addresses are usable (RFC 3021)." },
      ],
    },
    {
      id: "sizing",
      title: "Choosing the right prefix for a requirement",
      md: `
        ## Sizing by hosts
        Pick the **smallest h** with 2^h − 2 ≥ hosts needed; prefix = 32 − h.

        | Hosts needed | ≤ 2 | ≤ 6 | ≤ 14 | ≤ 30 | ≤ 62 | ≤ 126 | ≤ 254 | ≤ 510 | ≤ 1 022 | ≤ 2 046 |
        |---|---|---|---|---|---|---|---|---|---|---|
        | Prefix | /30 | /29 | /28 | /27 | /26 | /25 | /24 | /23 | /22 | /21 |

        > [!trap] Powers of two bite
        > 64 hosts do **not** fit in a /26 (62 usable) → /25. 32 hosts need a /26, not a /27.
        > And the **router interface (default gateway) uses an address too**. Count it when the question says "hosts plus the router".

        ## Sizing by number of subnets
        Pick the **smallest s** with 2^s ≥ subnets needed; new prefix = original + s.

        > [!example] 172.16.0.0/16, need 100 subnets
        > 2^7 = 128 ≥ 100 → s = 7 → **/23**, which leaves 9 host bits = 510 hosts per subnet.

        ## Both requirements at once
        Size for one, then check the other still fits.

        > [!example] 10.20.0.0/16, need 300 subnets with at least 100 hosts each
        > Subnets: 2^9 = 512 ≥ 300 → /25. Hosts in /25 = 126 ≥ 100 ✓. Answer: **255.255.255.128**.

        Exam wording to watch: **"the most subnets"** means take the *longest* prefix that still fits the hosts;
        **"the most hosts per subnet"** means take the *shortest* prefix that still gives enough subnets.
      `,
      checks: [
        { q: "Which prefix is the smallest subnet for 120 hosts?", a: "/25 (126 usable)." },
        { q: "Which prefix for 31 hosts?", a: "/26. A /27 gives only 30 usable hosts." },
        { q: "192.168.100.0/24 must be split into 5 equal subnets that are as large as possible. Which mask?", a: "2^3 = 8 ≥ 5 → /27 (255.255.255.224), 30 hosts each." },
        { q: "Which mask on 172.16.0.0/16 gives the most subnets while still supporting 500 hosts per subnet?", a: "500 hosts need 9 host bits (510) → /23, 255.255.254.0 (128 subnets)." },
      ],
    },
    {
      id: "vlsm",
      title: "VLSM — variable-length subnet masks",
      md: `
        VLSM means using **different prefix lengths** inside one address block so each segment gets only the
        size it needs.

        ## The procedure
        1. Size every segment (section 7).
        2. Sort them **largest first**.
        3. Give each one the next free address — which is automatically aligned to its block size if you go largest first.
        4. Write down network and broadcast; next free = broadcast + 1.

        > [!example] 192.168.20.0/24 — LAN A 100 hosts, LAN B 50, LAN C 25, LAN D 10, three router-to-router links
        > Worked out in the table below.

        | Segment | Needs | Prefix | Network | Broadcast | Usable range |
        |---|---|---|---|---|---|
        | LAN A | 100 | /25 | 192.168.20.0 | .127 | .1 – .126 |
        | LAN B | 50 | /26 | 192.168.20.128 | .191 | .129 – .190 |
        | LAN C | 25 | /27 | 192.168.20.192 | .223 | .193 – .222 |
        | LAN D | 10 | /28 | 192.168.20.224 | .239 | .225 – .238 |
        | Link 1 | 2 | /30 | 192.168.20.240 | .243 | .241 – .242 |
        | Link 2 | 2 | /30 | 192.168.20.244 | .247 | .245 – .246 |
        | Link 3 | 2 | /30 | 192.168.20.248 | .251 | .249 – .250 |
        | *free* | | /30 | 192.168.20.252 | .255 | |

        ## Why largest first?
        A subnet's network address must be a multiple of its block size (a /26 can start at .0, .64, .128, .192
        — never at .96). Allocating large blocks first keeps every later, smaller block aligned with no gaps and
        no overlaps.

        > [!trap] Overlaps
        > IOS refuses an interface address that overlaps a subnet already configured on another interface
        > (\`% 192.168.20.0 overlaps with GigabitEthernet0/0\`). On the exam, an "address plan" answer with an
        > overlap is always wrong. Check that each network is aligned and starts after the previous broadcast.
      `,
      checks: [
        { q: "Allocate from 10.0.0.0/24: LAN1 60 hosts, LAN2 28 hosts, LAN3 12 hosts.", a: "LAN1 10.0.0.0/26 (.0–.63) · LAN2 10.0.0.64/27 (.64–.95) · LAN3 10.0.0.96/28 (.96–.111). The next free address is 10.0.0.112." },
        { q: "Is 172.16.1.64/26 a valid network address? What about 172.16.1.96/26?", a: "172.16.1.64/26 is valid (64 is a multiple of 64). 172.16.1.96/26 is not: .96 is a host inside 172.16.1.64/26." },
      ],
    },
    {
      id: "cli",
      title: "Configuring and verifying in IOS",
      md: `
        IOS takes the mask in **dotted decimal** on interfaces; \`show\` output usually displays the prefix.

        ~~~
        R1(config)# interface g0/0
        R1(config-if)# ip address 192.168.20.1 255.255.255.128
        R1(config-if)# no shutdown

        R1# show ip interface g0/0 | include Internet
          Internet address is 192.168.20.1/25

        R1# show ip route connected
        C   192.168.20.0/25 is directly connected, GigabitEthernet0/0
        L   192.168.20.1/32 is directly connected, GigabitEthernet0/0
        ~~~

        - **C** = the connected *subnet* (calculated from address + mask).
        - **L** = a /32 *local* route for the interface's own address.
        - \`show ip interface brief\` shows the address but **not** the mask. Use \`show ip interface\` or \`show running-config\` to see it.

        ## Troubleshooting with subnet math
        > [!example] PC 192.168.20.130/25, default gateway 192.168.20.1
        > The PC is in 192.168.20.128/25; the gateway is in 192.168.20.0/25. The PC can reach hosts in its
        > own subnet but **nothing remote**: its gateway isn't on its subnet.

        > [!example] Host with the wrong mask
        > The subnet is 10.1.1.0/25, but a PC is set to 10.1.1.20/**24**. It believes 10.1.1.200 is local, so it ARPs
        > for it directly instead of sending to the gateway, and the traffic fails.

        On a host, check with \`ipconfig\` (Windows) or \`ifconfig\` / \`ip addr\` (macOS/Linux): address, mask, default gateway.
      `,
      checks: [
        { q: "A PC is configured with 10.5.5.70 255.255.255.224, default gateway 10.5.5.62. What's wrong?", a: "/27 → block 32 → the PC is in 10.5.5.64 – .95, but the gateway .62 is in 10.5.5.32 – .63. The gateway is in a different subnet." },
        { q: "Which `show ip route` code marks the router's own interface address, and with what prefix?", a: "L (local), always /32." },
      ],
    },
    {
      id: "wildcard",
      title: "Wildcard masks & route summarization",
      md: `
        ## Wildcard masks
        ACLs and OSPF \`network\` statements use **wildcard masks**: 0 = "must match", 1 = "don't care".
        For a subnet, wildcard = **255.255.255.255 − subnet mask**.

        | Subnet mask | Wildcard |
        |---|---|
        | 255.255.255.0 (/24) | 0.0.0.255 |
        | 255.255.255.192 (/26) | 0.0.0.63 |
        | 255.255.252.0 (/22) | 0.0.3.255 |
        | 255.255.255.255 (/32) | 0.0.0.0 = keyword \`host\` |
        | 0.0.0.0 (/0) | 255.255.255.255 = keyword \`any\` |

        ~~~
        access-list 10 permit 192.168.20.0 0.0.0.127
        router ospf 1
         network 10.1.1.0 0.0.0.255 area 0
        ~~~

        ## Summarization (supernetting)
        Several contiguous networks can be advertised as **one shorter prefix**. Two quick checks:

        1. The number of networks is a power of two (2^n) → summary prefix = original − n.
        2. The first network is a multiple of that count in the interesting octet.

        > [!example] 172.16.4.0/24, 172.16.5.0/24, 172.16.6.0/24, 172.16.7.0/24
        > 4 networks = 2^2 → /22. 4 is a multiple of 4 ✓ → **172.16.4.0/22**.
        > In binary, the 3rd octets 4–7 share \`000001\` and only the last 2 bits differ.

        > [!example] Not aligned: 10.1.6.0/24 – 10.1.9.0/24
        > 6 = \`00000110\`, 9 = \`00001001\` → only the first 4 bits are common → the smallest single summary is
        > **10.1.0.0/20**, which also covers 10.1.0.0 – 10.1.15.255 (more than you have).
      `,
      checks: [
        { q: "Wildcard for 255.255.248.0?", a: "0.0.7.255" },
        { q: "Summarise 192.168.8.0/24 through 192.168.15.0/24.", a: "8 networks = 2^3, and 8 is a multiple of 8 → 192.168.8.0/21." },
        { q: "Which wildcard matches only 10.10.10.0/27?", a: "0.0.0.31" },
      ],
    },
    {
      id: "traps",
      title: "Exam speed technique & traps",
      md: `
        ## A 20-second routine
        1. Prefix/mask → **block size** and **interesting octet** (from memory).
        2. Network = round the interesting octet *down* to a multiple of the block.
        3. Broadcast = network + block − 1; the octets to the right are 0 for the network and 255 for the broadcast.
        4. Answer what was asked: network? broadcast? first/last host? count?

        > [!tip] Use the erasable note board
        > At the test centre you get an erasable board. In the first minute, write down the mask/block row
        > (128 192 224 240 248 252 254 255 / 128 64 32 16 8 4 2 1) and the hosts table. This takes no time
        > during the questions.

        ## Trap checklist
        - **"Usable hosts" ≠ addresses.** Subtract 2 (except /31 and /32).
        - **Network and broadcast addresses can't be assigned** to hosts.
        - **Answers mix notations.** A question in /26 may have answers in 255.255.255.192; convert before choosing.
        - **Exact powers of two**: 64 hosts need /25, not /26.
        - **The router interface needs an address** in the subnet too.
        - **Gateway outside the host's subnet** is a favourite troubleshooting answer.
        - **172.32.x.x is not private**; **169.254.x.x means DHCP failed**.
        - **Non-contiguous masks** (255.255.255.225, 255.0.255.0) are invalid.
        - **/31 is fine** on point-to-point links; don't reject it as "no usable hosts".

        > [!key] Next steps
        > Go to **Practice** below. Do the *Subnet calculator* drill until you have a 20+ streak under 30 s each,
        > then *Hosts → prefix* and *Wildcard masks*. Do a few rounds of the mixed drill every day until the exam.
      `,
      checks: [],
    },
  ],
});
