/*
 * Study guide: OSPFv2, single area (blueprint 3.4).
 * Format: see data/guides/subnetting.js (escape backticks as \` ; use ~~~ for code fences).
 */
CCNA.addGuide("ospf", {
  intro: `
    OSPF is **the** routing protocol of the CCNA. Expect questions on how neighbors form, who becomes DR, which
    router ID is chosen, what a route's cost will be, and how to read \`show ip ospf neighbor\` and
    \`show ip route\` output. Most of the points come from **why two routers are not neighbors**
    and **which path wins**.

    The blueprint asks for **single-area OSPFv2**: configure, verify and troubleshoot it.
    Multi-area design is only background knowledge.
  `,
  sections: [
    {
      id: "basics",
      title: "What OSPF is and how it works",
      md: `
        OSPF (Open Shortest Path First) is an open-standard **link-state** interior gateway protocol.

        1. Every router floods **LSAs** (link-state advertisements) describing its links.
        2. All routers in an area build an identical **LSDB** (link-state database) — a full map of the area.
        3. Each router runs **Dijkstra's SPF algorithm** on the LSDB to find its own lowest-cost path to every network.
        4. Those best paths go into the routing table as **O** routes.

        | | RIP | EIGRP | OSPF |
        |---|---|---|---|
        | Type | Distance vector | Advanced distance vector | Link state |
        | Metric | Hop count (max 15) | Bandwidth + delay | **Cost** (from bandwidth) |
        | Administrative distance | 120 | 90 (internal) | **110** |
        | Standard | Open | Cisco (now published) | Open (OSPFv2 = IPv4, OSPFv3 = IPv6) |

        ### Facts to memorise
        - Runs directly over IP: **IP protocol 89** (not TCP/UDP).
        - Multicast **224.0.0.5** = all OSPF routers; **224.0.0.6** = DR/BDR only.
        - Triggered updates when something changes, plus a periodic LSA refresh every 30 minutes.

        > [!tip] Why AD matters
        > If a router learns the same prefix from EIGRP (AD 90) and OSPF (AD 110), the EIGRP route is installed —
        > OSPF's cost is never compared with EIGRP's metric. AD decides between protocols; the metric decides
        > inside one protocol. And longest prefix match beats both.
      `,
      checks: [
        { q: "What is OSPF's administrative distance and metric?", a: "AD 110, metric = cost." },
        { q: "Which multicast address do all OSPF routers listen on, and which one only the DR/BDR?", a: "224.0.0.5 = all OSPF routers; 224.0.0.6 = DR and BDR." },
        { q: "A router learns 10.1.1.0/24 from OSPF with cost 2 and from RIP with 1 hop. Which is installed?", a: "The OSPF route — AD 110 beats RIP's 120. Metrics of different protocols are never compared." },
      ],
    },
    {
      id: "areas",
      title: "Areas, router roles and LSA types",
      md: `
        OSPF divides a network into **areas** to keep LSDBs small. All routers in one area share the same LSDB.
        **Area 0** is the **backbone**; in multi-area designs every other area must connect to it.

        | Router role | Meaning |
        |---|---|
        | Internal router | All interfaces in one area |
        | Backbone router | At least one interface in area 0 |
        | **ABR** (Area Border Router) | Interfaces in area 0 **and** another area |
        | **ASBR** (AS Boundary Router) | Injects external routes into OSPF (redistribution, default route) |

        | LSA type | Name | Created by |
        |---|---|---|
        | 1 | Router LSA | Every router (its links in the area) |
        | 2 | Network LSA | The **DR** of a multi-access segment |
        | 3 | Summary LSA | ABRs (networks from other areas) |
        | 5 | AS External LSA | ASBRs (external routes) |

        For the CCNA, **single-area** OSPF (everything in area 0) is what you configure. Know the multi-area
        terms for recognition questions.

        > [!note] Design facts that show up
        > Areas should be contiguous; an area 0 must exist in multi-area OSPF; interfaces on the same subnet must be in the same area.
      `,
      checks: [
        { q: "What is an ABR?", a: "A router with interfaces in the backbone (area 0) and at least one other area." },
        { q: "Which router creates the type 2 (Network) LSA?", a: "The DR of a multi-access (broadcast) segment." },
      ],
    },
    {
      id: "rid",
      title: "The router ID",
      md: `
        Every OSPF router needs a unique 32-bit **router ID (RID)**, written like an IPv4 address. It is chosen in this order:

        1. Manually configured: \`router-id 1.1.1.1\` under \`router ospf\`.
        2. Otherwise, the **highest IP address on a loopback** interface (that is up).
        3. Otherwise, the **highest IP address on an up physical** interface.

        > [!trap] A new RID doesn't apply by itself
        > The RID is fixed when the process starts. After changing \`router-id\` (or adding a loopback), run
        > \`clear ip ospf process\` — or reload — for it to take effect. It resets all adjacencies.

        > [!example] Which RID?
        > Interfaces: G0/0 10.0.12.1, G0/1 192.168.1.1, Loopback0 2.2.2.2, Loopback1 1.1.1.1, no \`router-id\` command.
        > → **2.2.2.2** — the highest *loopback* wins even though 192.168.1.1 is numerically higher.

        Two routers with the **same RID** can't form an adjacency (IOS logs a "Duplicate Router ID" message).
      `,
      checks: [
        { q: "No router-id is configured. Loopbacks: 10.10.10.10 and 3.3.3.3. Physical: 172.31.1.1. Which RID?", a: "10.10.10.10 — the highest loopback address is preferred over any physical interface." },
        { q: "You configure `router-id 9.9.9.9` on a running router but `show ip protocols` still shows the old RID. Why?", a: "The RID only changes when the OSPF process restarts: use `clear ip ospf process` (or reload)." },
      ],
    },
    {
      id: "neighbors",
      title: "Neighbors, adjacency and OSPF states",
      md: `
        Routers discover each other with **Hello** packets (to 224.0.0.5) on OSPF-enabled interfaces.

        | Network type | Hello | Dead |
        |---|---|---|
        | Broadcast (Ethernet), point-to-point | **10 s** | **40 s** |
        | NBMA | 30 s | 120 s |

        ### Neighbor states
        | State | What is happening |
        |---|---|
        | Down | No Hellos received |
        | Init | Hello received, but my RID isn't in it yet |
        | **2-Way** | Each sees its RID in the other's Hello — **neighbors**. DR/BDR elected here |
        | ExStart | Master/slave chosen (higher RID = master) for the exchange |
        | Exchange | **DBD** packets summarise each LSDB |
        | Loading | **LSR** requests for missing LSAs, answered with **LSU** |
        | **Full** | LSDBs synchronised — **fully adjacent** |

        ### The five OSPF packet types
        1. Hello · 2. DBD (Database Description) · 3. LSR (Link-State Request) · 4. LSU (Link-State Update) · 5. LSAck

        ### What must match to become neighbors
        - **Area ID** and **subnet** (same network and mask on the link)
        - **Hello and dead timers**
        - **Authentication** settings
        - **Stub area** flag
        - **MTU** (a mismatch lets them see each other but they get **stuck in ExStart/Exchange**)
        - Router IDs must be **unique**, and the interface must **not be passive**

        Does **not** need to match: the **process ID**, interface **cost**, or **priority**.
      `,
      checks: [
        { q: "R1 uses `router ospf 1`, R2 uses `router ospf 2`. Can they become neighbors?", a: "Yes — the process ID is only locally significant." },
        { q: "Two routers are stuck in EXSTART. What's the most likely cause?", a: "An MTU mismatch on the link." },
        { q: "R1 has hello 10/dead 40, R2 has hello 5/dead 20 on the same link. Result?", a: "No adjacency — hello and dead timers must match." },
        { q: "In which state are routers neighbors but not yet fully adjacent?", a: "2-Way." },
      ],
    },
    {
      id: "dr",
      title: "Network types and DR/BDR election",
      md: `
        On **multi-access** segments (Ethernet), a full mesh of adjacencies would flood the same LSAs many times.
        OSPF elects a **DR** (designated router) and a **BDR** (backup) instead:

        - Every router forms a **Full** adjacency only with the DR and BDR.
        - Two **DROthers** stay in **2-Way** with each other — that is **normal**, not a fault.
        - DROthers send updates to **224.0.0.6** (DR/BDR); the DR re-floods them to **224.0.0.5**.

        ### Election rules
        1. Highest **interface priority** wins (\`ip ospf priority\`, 0–255, **default 1**).
        2. Tie → highest **router ID**.
        3. Priority **0** = never DR or BDR.
        4. The election is **non-preemptive**: a better router joining later does *not* take over. The DR keeps
           its role until it fails (then the BDR is promoted and a new BDR is elected) or OSPF is reset.

        ### Network types
        | Type | Default on | DR/BDR? | Hello/Dead |
        |---|---|---|---|
        | **Broadcast** | Ethernet | Yes | 10/40 |
        | **Point-to-point** | Serial (HDLC, PPP) | No | 10/40 |
        | NBMA | Frame Relay (legacy) | Yes | 30/120 |

        Between exactly two routers on an Ethernet link, \`ip ospf network point-to-point\` removes the
        pointless DR election and speeds up convergence.

        ~~~
        R1# show ip ospf neighbor
        Neighbor ID     Pri   State           Dead Time   Address         Interface
        2.2.2.2           1   FULL/DR         00:00:35    10.0.0.2        GigabitEthernet0/0
        3.3.3.3           1   FULL/BDR        00:00:33    10.0.0.3        GigabitEthernet0/0
        4.4.4.4           1   2WAY/DROTHER    00:00:38    10.0.0.4        GigabitEthernet0/0
        ~~~

        Reading it: the **State** column shows the *neighbor's* role. R1 is Full with the DR and BDR and 2-Way with
        4.4.4.4 — so R1 itself must be a **DROther**.
      `,
      checks: [
        { q: "Four routers on one Ethernet segment, all priority 1, RIDs 1.1.1.1–4.4.4.4, all booted at the same time. Who is DR and BDR?", a: "DR = 4.4.4.4, BDR = 3.3.3.3 (highest RIDs, since priorities tie)." },
        { q: "A router with priority 255 joins a segment where a DR is already elected. Does it become DR?", a: "No — the election is non-preemptive. It only takes over after the current DR/BDR fail or OSPF is reset." },
        { q: "Two DROthers show `2WAY/DROTHER` for each other. Is something wrong?", a: "No. DROthers only become Full with the DR and BDR." },
        { q: "How do you guarantee a router never becomes DR or BDR?", a: "`ip ospf priority 0` on that interface." },
      ],
    },
    {
      id: "cost",
      title: "Cost and path selection",
      md: `
        **Interface cost = reference bandwidth ÷ interface bandwidth**, rounded down, minimum 1.
        The default reference bandwidth is **100 Mbps**.

        | Interface | Cost (ref 100 Mbps, default) | Cost (ref 100 000 Mbps) |
        |---|---|---|
        | 10 Mbps Ethernet | 10 | 10 000 |
        | 100 Mbps FastEthernet | 1 | 1 000 |
        | 1 Gbps GigabitEthernet | **1** | 100 |
        | 10 Gbps | **1** | 10 |

        > [!trap] The default can't tell fast links apart
        > With the default reference, FastEthernet, Gigabit and 10-Gig all cost **1**. Fix it with
        > \`auto-cost reference-bandwidth 100000\` (value in **Mbps**) under \`router ospf\` — on **all** routers,
        > so costs stay consistent.

        ### Three ways to change a cost
        - \`auto-cost reference-bandwidth <Mbps>\` — changes the formula for every interface.
        - \`ip ospf cost <1–65535>\` — sets one interface's cost directly (overrides the formula).
        - \`bandwidth <kbps>\` — changes the bandwidth value used in the formula; it does **not** change the real link speed.

        ### Route cost
        A route's cost is the **sum of the outgoing interface costs** along the path, including the interface
        of the last router that connects to the destination network.

        > [!example] R1 —(1 Gbps)— R2 —(100 Mbps LAN 192.168.2.0/24)
        > Default reference: 1 (R1 G0/0) + 1 (R2's LAN interface) = **2** → \`[110/2]\`.
        > With reference 100 000: 100 + 1 000 = **1 100**.

        **Equal-cost paths:** OSPF load-balances across up to **4** equal-cost paths by default (\`maximum-paths\` changes this).
      `,
      checks: [
        { q: "Default reference bandwidth. What is the OSPF cost of a 10 Mbps interface?", a: "100 / 10 = 10." },
        { q: "Reference bandwidth 10 000 Mbps. Cost of a GigabitEthernet interface?", a: "10 000 / 1 000 = 10." },
        { q: "Which command changes the reference bandwidth, and in which unit?", a: "`auto-cost reference-bandwidth <value>` under `router ospf`, in Mbps." },
        { q: "Path A: three Gigabit hops. Path B: one 100 Mbps hop. Default reference bandwidth. Which path wins?", a: "Path B: cost 1 vs 3 — every hop of 100 Mbps or faster costs 1 by default, so fewer hops wins. (With a higher reference bandwidth, path A would win: 3 × 100 = 300 vs 1 000.)" },
      ],
    },
    {
      id: "config",
      title: "Configuration",
      md: `
        ~~~
        R1(config)# interface loopback0
        R1(config-if)# ip address 1.1.1.1 255.255.255.255
        R1(config-if)# exit
        R1(config)# router ospf 1
        R1(config-router)# router-id 1.1.1.1
        R1(config-router)# network 10.0.12.0 0.0.0.3 area 0
        R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
        R1(config-router)# network 1.1.1.1 0.0.0.0 area 0
        R1(config-router)# passive-interface g0/1
        R1(config-router)# auto-cost reference-bandwidth 100000
        R1(config-router)# default-information originate
        ~~~

        ### What the \`network\` command really does
        It does **not** advertise "the network you typed". It **enables OSPF on every interface whose IP address
        matches** the address + wildcard. OSPF then advertises those interfaces' subnets using their **own masks**.

        - \`network 10.0.12.0 0.0.0.3 area 0\` → matches an interface with 10.0.12.1/30.
        - \`network 1.1.1.1 0.0.0.0 area 0\` → exactly one interface.
        - \`network 0.0.0.0 255.255.255.255 area 0\` → every interface.

        ### Interface method (alternative)
        ~~~
        R1(config)# interface g0/0
        R1(config-if)# ip ospf 1 area 0
        ~~~

        ### Passive interfaces
        \`passive-interface g0/1\` stops sending Hellos out that interface (no neighbors can form there) but its
        subnet **is still advertised**. Use it on LAN interfaces facing only end hosts.
        \`passive-interface default\` makes all interfaces passive; then \`no passive-interface g0/0\` re-enables the ones toward routers.

        ### Advertising a default route
        \`default-information originate\` makes the router (an ASBR) advertise its default route into OSPF.
        It needs a default route in its own routing table (e.g. \`ip route 0.0.0.0 0.0.0.0 203.0.113.1\`), unless
        you add the \`always\` keyword. Other routers see it as \`O*E2 0.0.0.0/0\`.

        > [!note] Loopbacks
        > OSPF advertises a loopback as a **/32** host route by default, whatever mask you configure.
        > \`ip ospf network point-to-point\` on the loopback makes OSPF advertise the configured mask instead.
      `,
      checks: [
        { q: "R1 G0/0 is 172.16.5.9/29. Which wildcard in `network 172.16.5.8 ___ area 0` matches exactly that subnet?", a: "0.0.0.7" },
        { q: "What happens to a subnet on an interface made passive?", a: "It's still advertised into OSPF, but no Hellos are sent so no neighbor can form on that interface." },
        { q: "R1 has `default-information originate` but no default route in its table. Do other routers learn a default?", a: "No — unless the command uses `always`, a default route must exist in R1's routing table first." },
        { q: "Which interface-level command enables OSPF process 1 in area 0?", a: "`ip ospf 1 area 0`" },
      ],
    },
    {
      id: "verify",
      title: "Verification",
      md: `
        | Command | Shows |
        |---|---|
        | \`show ip ospf neighbor\` | Neighbors, their state and DR/BDR role |
        | \`show ip ospf interface brief\` | Which interfaces run OSPF, area, cost, state, neighbor count |
        | \`show ip ospf interface g0/0\` | Network type, timers, priority, DR/BDR, cost |
        | \`show ip protocols\` | RID, \`network\` statements, passive interfaces, reference bandwidth, AD |
        | \`show ip route ospf\` | OSPF routes in the routing table |
        | \`show ip ospf database\` | The LSDB (LSAs) |

        ~~~
        R1# show ip ospf interface brief
        Interface    PID   Area     IP Address/Mask    Cost  State Nbrs F/C
        Lo0          1     0        1.1.1.1/32         1     LOOP  0/0
        Gi0/1        1     0        192.168.1.1/24     1     DR    0/0
        Gi0/0        1     0        10.0.12.1/30       1     BDR   1/1

        R1# show ip route ospf
        O     2.2.2.2/32 [110/2] via 10.0.12.2, 00:05:12, GigabitEthernet0/0
        O     192.168.2.0/24 [110/2] via 10.0.12.2, 00:05:12, GigabitEthernet0/0
        O*E2  0.0.0.0/0 [110/1] via 10.0.12.2, 00:05:12, GigabitEthernet0/0
        ~~~

        - \`[110/2]\` = **[administrative distance / metric (cost)]**.
        - **via** = next-hop IP; the interface at the end is the exit interface.
        - **F/C** in the brief output = Full adjacencies / neighbor count.
        - Gi0/0 is Ethernet, so it defaults to the broadcast type: R1 (RID 1.1.1.1) is **BDR** because R2 (2.2.2.2) has the higher RID.
          Gi0/1 is passive, so R1 is DR there with no neighbors.
        - An external default route shows as \`O*E2\`; its cost stays 1 however far it travels (E2 behavior).
      `,
      checks: [
        { q: "What do the two numbers in `[110/20]` mean?", a: "Administrative distance 110 (OSPF) and route cost 20." },
        { q: "Which command shows the router ID and the reference bandwidth?", a: "`show ip protocols` (the RID also appears in `show ip ospf`)." },
        { q: "Which command quickly shows the cost of each OSPF interface?", a: "`show ip ospf interface brief`" },
      ],
    },
    {
      id: "troubleshoot",
      title: "Troubleshooting and exam traps",
      md: `
        | Symptom | Likely cause |
        |---|---|
        | No neighbor at all | Area, subnet/mask, hello/dead or authentication mismatch; interface passive; no \`network\` statement matching it; ACL blocking OSPF (protocol 89) |
        | Stuck in **ExStart/Exchange** | **MTU mismatch** |
        | **2-Way** between two routers | Normal if both are DROthers on a multi-access segment |
        | Neighbor flaps every ~40 s | Hellos lost or dead timer too short |
        | Route missing although neighbor is Full | The subnet's interface isn't in OSPF (\`network\` statement doesn't match it) |
        | Suboptimal path chosen | Default reference bandwidth: Fast/Gig/10G all cost 1 |
        | "Duplicate router ID" | Two routers share a RID |

        > [!trap] Exam favourites
        > - Process IDs don't have to match; **areas do**.
        > - \`network\` uses a **wildcard** mask, not a subnet mask.
        > - The DR election is **non-preemptive**, and priority **0** never becomes DR.
        > - A new \`router-id\` needs \`clear ip ospf process\`.
        > - \`passive-interface\` still **advertises** the subnet.
        > - Changing \`bandwidth\` changes the cost, **not** the real speed.
        > - An inbound ACL ending in the implicit deny drops OSPF Hellos unless OSPF is permitted.

        > [!key] Practice
        > Use the **OSPF cost** drill below, then read real \`show ip ospf neighbor\` and \`show ip route\`
        > outputs in the Day 26–28 quizzes.
      `,
      checks: [
        { q: "R1 G0/0 is 10.1.1.1/24 in area 0, R2 G0/0 is 10.1.1.2/24 in area 1. Will they form an adjacency?", a: "No — area IDs must match on a link." },
        { q: "R1 is 10.1.1.1/24 and R2 is 10.1.1.2/25 on the same link. Neighbors?", a: "No — on broadcast networks the subnet mask must match too." },
      ],
    },
  ],
});
