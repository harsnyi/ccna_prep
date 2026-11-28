/*
 * Study guide: Spanning Tree & Rapid STP (blueprint 2.5; course days 20–22).
 * Format: see data/guides/subnetting.js (escape backticks as \` ; use ~~~ for code fences).
 */
CCNA.addGuide("stp", {
  intro: `
    STP questions are mostly **elections on a diagram**: which switch is root, which port is the root port, which
    port blocks. Then come RSTP roles and states, the timers, and PortFast/BPDU Guard. If you can work through the
    three-step election reliably, every STP question becomes mechanical.

    The blueprint (2.5) asks for **Rapid PVST+**: root port, root bridge (primary/secondary) and other port roles,
    port states, and PortFast. BPDU Guard is listed under Layer 2 security, and it's covered here too.
  `,
  sections: [
    {
      id: "why",
      title: "Why Layer 2 loops are so dangerous",
      md: `
        Redundant links between switches are good design, but Ethernet has no TTL. A frame caught in a loop
        circulates **forever**.

        - **Broadcast storms**: every broadcast (e.g. an ARP request) is flooded around the loop and multiplies until links and CPUs saturate.
        - **MAC address flapping**: the same source MAC keeps arriving on different ports, so the MAC table is rewritten constantly.
        - **Duplicate frames** reach hosts.

        **STP (IEEE 802.1D)** fixes this by putting redundant ports into a **blocking** state, so only one active
        path remains, a loop-free *tree*. If an active link fails, a blocked port takes over.
        STP runs on Cisco switches by default.
      `,
      checks: [
        { q: "Why can a Layer 2 loop run forever when a Layer 3 loop can't?", a: "Ethernet frames have no TTL field; IP packets do (it's decremented until 0)." },
        { q: "What is MAC address flapping?", a: "The same MAC is learned on different ports in quick succession because looping frames arrive from several directions." },
      ],
    },
    {
      id: "bid",
      title: "BPDUs and the Bridge ID",
      md: `
        Switches ("bridges" in STP) exchange **BPDUs** (Bridge Protocol Data Units). Hello BPDUs go out every **2 seconds**.
        PCs and routers don't send BPDUs, so a BPDU on a port means another switch is there.

        ### Bridge ID = priority + MAC address
        | Part | Size | Notes |
        |---|---|---|
        | Bridge priority | 4 bits | Configurable in multiples of **4096** (0 – 61440). Default **32768** |
        | Extended system ID | 12 bits | The **VLAN ID** (Cisco runs one STP instance per VLAN) |
        | MAC address | 48 bits | The switch's base MAC |

        The displayed priority = configured priority + VLAN, so the default for VLAN 1 is **32769**, and for VLAN 10 it's **32778**.

        **Lower is better** for every STP comparison: Bridge IDs, root costs, port IDs.

        BPDU destination MACs: IEEE STP **0180.c200.0000**; Cisco PVST+ **0100.0ccc.cccd**.
      `,
      checks: [
        { q: "What does `show spanning-tree vlan 20` display as the default bridge priority?", a: "32788 (32768 + 20)." },
        { q: "Can you configure a bridge priority of 30000?", a: "No — it must be a multiple of 4096 (e.g. 28672 or 32768)." },
      ],
    },
    {
      id: "election",
      title: "The election in three steps",
      md: `
        | Step | Who | Winner | Tie-breakers, in order |
        |---|---|---|---|
        | **1. Root bridge** | One per VLAN | Lowest **Bridge ID** | priority → MAC |
        | **2. Root port** | One on every **non-root** switch | Best path to the root | lowest **root cost** → lowest **neighbor Bridge ID** → lowest **neighbor port ID** |
        | **3. Designated port** | One on every **link** | Port on the switch closer to the root | lowest **root cost** of the switch → lowest **Bridge ID** |

        Everything else is **non-designated** and **blocks** (in RSTP: alternate or backup).

        ### Rules that save time
        - Every switch starts out thinking it's the root and sends BPDUs. A **superior** (lower) BPDU makes it give that up.
        - **All ports on the root bridge are designated.**
        - The port at the other end of a **root port** is always **designated**.
        - Each link has exactly **one designated port**. If neither end is a root port, one end is designated and the other blocks.
        - Only one end of a link can block. Blocking always happens on the switch **farther** from the root (or with the higher Bridge ID on a tie).
      `,
      checks: [
        { q: "On a link between SW2 and SW3, SW2's port is a root port. What is SW3's port?", a: "Designated — the far end of a root port is always designated." },
        { q: "Two switches on a link both have root cost 8. Which port becomes designated?", a: "The port on the switch with the lower Bridge ID." },
        { q: "How many root ports does the root bridge have?", a: "None — all its ports are designated." },
      ],
    },
    {
      id: "cost",
      title: "Port costs, root cost and port ID",
      md: `
        | Speed | Classic STP cost (short) | RSTP / 802.1t cost (long) |
        |---|---|---|
        | 10 Mbps | **100** | 2,000,000 |
        | 100 Mbps | **19** | 200,000 |
        | 1 Gbps | **4** | 20,000 |
        | 10 Gbps | **2** | 2,000 |

        Cisco switches use the **short** values by default, even when running Rapid PVST+, unless you configure
        \`spanning-tree pathcost method long\`. Exam questions almost always use 100 / 19 / 4 / 2.

        ### Root cost
        A switch's **root cost** is the sum of the costs of the ports on the path to the root, each one being the
        port that **faces the root** (where the root's BPDUs arrive). The root bridge's root cost is **0**.

        > [!example] SW3 → SW2 → Root over two Gigabit links
        > SW3's root cost through SW2 = 4 + 4 = **8**. A direct FastEthernet link from SW3 to the root would cost **19**, so the
        > path through SW2 wins even though it has more hops.

        ### Port ID
        Port ID = **port priority** (default **128**, configurable 0–240 in steps of 16) + port number, shown as \`128.1\`.
        It only matters as the last tie-breaker, typically when two switches are connected by **two parallel links**.
        The **neighbor's** port ID decides which local port becomes the root port.
      `,
      checks: [
        { q: "Classic STP cost of a 100 Mbps link?", a: "19" },
        { q: "SW4 reaches the root via FastEthernet then Gigabit (SW4 Fa → SW2, SW2 Gi → root). Root cost?", a: "19 + 4 = 23." },
        { q: "SW2 has two parallel links to the root bridge: its Gi0/1 connects to the root's Gi0/2, its Gi0/2 to the root's Gi0/1. Which SW2 port is the root port?", a: "SW2 Gi0/2 — same cost and same neighbor Bridge ID, so the lower *neighbor* port ID (the root's Gi0/1) decides." },
      ],
    },
    {
      id: "example",
      title: "Worked example",
      md: `
        Three switches in a triangle, all links **1 Gbps** (cost 4), all priorities default (32769):

        | Switch | MAC | Links |
        |---|---|---|
        | SW1 | 0011.1111.1111 | G0/1 → SW2 G0/1 · G0/2 → SW3 G0/1 |
        | SW2 | 0022.2222.2222 | G0/1 → SW1 · G0/2 → SW3 G0/2 |
        | SW3 | 0033.3333.3333 | G0/1 → SW1 · G0/2 → SW2 |

        1. **Root bridge**: priorities tie, so the lowest MAC wins → **SW1**. SW1 G0/1 and G0/2 are **designated**.
        2. **Root ports**: SW2 can reach SW1 directly (cost 4) or via SW3 (4 + 4 = 8) → **SW2 G0/1**. Likewise **SW3 G0/1**.
        3. **Designated ports**: SW1's links are done (root bridge). On the **SW2–SW3** link, both switches have root cost 4,
           so it's a tie → lower Bridge ID → **SW2 G0/2 is designated**, and **SW3 G0/2 is non-designated: it blocks**
           (RSTP role: **alternate**).

        > [!example] What if you run \`spanning-tree vlan 1 priority 4096\` on SW3?
        > SW3 becomes root. Its ports become designated, SW1 G0/2 and SW2 G0/2 become root ports, and on the SW1–SW2 link
        > (both root cost 4) SW1 has the lower Bridge ID, so **SW2 G0/1 blocks**.
      `,
      checks: [
        { q: "In the original example, what happens when the SW1–SW3 link fails?", a: "SW3 G0/2 (via SW2) becomes SW3's root port with root cost 8 and moves to forwarding — with RSTP immediately, since it was the alternate port." },
      ],
    },
    {
      id: "states",
      title: "Classic STP states and timers",
      md: `
        | State | Stable? | Forwards frames | Learns MACs | BPDUs |
        |---|---|---|---|---|
        | **Blocking** | Stable | No | No | Receives only |
        | **Listening** | Transitional (15 s) | No | No | Sends and receives |
        | **Learning** | Transitional (15 s) | No | **Yes** | Sends and receives |
        | **Forwarding** | Stable | Yes | Yes | Sends and receives |
        | Disabled | — | No | No | No (port is shut down) |

        | Timer | Default | Meaning |
        |---|---|---|
        | **Hello** | 2 s | How often the root sends BPDUs |
        | **Forward delay** | 15 s | Time spent in listening, and again in learning |
        | **Max age** | 20 s | How long to keep the last BPDU before acting on its loss (10 missed hellos) |

        - Root and designated ports go **blocking → listening → learning → forwarding**: 30 s.
        - After an indirect failure, a blocked port first waits out **max age**: 20 + 15 + 15 = **50 s**.
        - A forwarding port can go straight to blocking, but a blocking port can **never** jump straight to forwarding.
        - The **root bridge's timers** apply to the whole network.
      `,
      checks: [
        { q: "In which classic STP state does a port start learning MAC addresses but still not forward frames?", a: "Learning." },
        { q: "Worst-case classic STP convergence after an indirect link failure?", a: "50 seconds (max age 20 + listening 15 + learning 15)." },
      ],
    },
    {
      id: "rstp",
      title: "Rapid STP (802.1w) and the STP versions",
      md: `
        | Standard | Cisco version | Instances |
        |---|---|---|
        | 802.1D STP | **PVST+** | One per VLAN |
        | 802.1w RSTP | **Rapid PVST+** (default on modern switches) | One per VLAN |
        | 802.1s MSTP | — | VLANs grouped into instances (large networks) |

        RSTP keeps the **same elections** (root bridge, root port, designated port) but converges in about a second, using a
        **proposal/agreement handshake** instead of waiting out timers.

        ### States: 3 instead of 5
        **Discarding** (replaces disabled, blocking and listening) → **Learning** → **Forwarding**

        ### Roles
        | Role | Meaning |
        |---|---|
        | Root | Best path to the root (same as STP) |
        | Designated | Best port on a link (same as STP) |
        | **Alternate** | Discarding; receives a superior BPDU **from another switch**: a ready **backup for the root port** that takes over immediately |
        | **Backup** | Discarding; receives a superior BPDU **from another port on the same switch** (only with a hub) |

        ### Other differences
        - **Every switch** sends its own BPDUs every hello (2 s), not just the root.
        - A neighbor is declared lost after **3 missed hellos (6 s)**, instead of max age 20 s.
        - UplinkFast and BackboneFast behavior is built in.
        - **Link types**: **edge** (to an end host, goes straight to forwarding like PortFast), **point-to-point** (full duplex to a switch),
          **shared** (half duplex, a hub). Point-to-point and shared are detected from the duplex setting.
        - RSTP is backward compatible: ports facing an 802.1D switch fall back to classic behavior.
      `,
      checks: [
        { q: "Which RSTP role is a discarding port that would immediately replace a failed root port?", a: "Alternate." },
        { q: "Which three port states does RSTP use?", a: "Discarding, learning, forwarding." },
        { q: "What is Cisco's default STP mode on modern switches?", a: "Rapid PVST+." },
      ],
    },
    {
      id: "portfast",
      title: "PortFast, BPDU Guard and other protections",
      md: `
        ### PortFast
        Access ports to **end hosts** go straight to **forwarding**, skipping listening and learning. Without it a PC
        would wait 30 s for its link (DHCP can time out). In RSTP terms it makes the port an **edge** port.
        ~~~
        SW1(config-if)# spanning-tree portfast                      ! one port
        SW1(config)# spanning-tree portfast default                  ! all access ports (not trunks)
        ~~~

        > [!trap] Never on switch links
        > PortFast toward another switch can create a temporary loop. That's what BPDU Guard prevents.

        ### BPDU Guard
        If a port with BPDU Guard receives **any BPDU**, it's **err-disabled** (shut down).
        ~~~
        SW1(config-if)# spanning-tree bpduguard enable               ! one port
        SW1(config)# spanning-tree portfast bpduguard default        ! all PortFast ports
        ~~~
        Recover it with \`shutdown\` / \`no shutdown\` after removing the cause, or automatically with
        \`errdisable recovery cause bpduguard\`.

        ### Good to recognise
        - **Root Guard** (\`spanning-tree guard root\`): if a **superior** BPDU arrives, the port goes *root-inconsistent*. It stops
          a switch on that port from becoming root.
        - **Loop Guard** (\`spanning-tree guard loop\`): if BPDUs **stop** arriving on a non-designated port, it goes *loop-inconsistent*
          instead of forwarding. This protects against one-way links.
      `,
      checks: [
        { q: "A user plugs a small switch into a PortFast port with BPDU Guard. What happens?", a: "The port receives BPDUs from that switch and is err-disabled." },
        { q: "Which global command enables PortFast on all access ports?", a: "`spanning-tree portfast default`" },
        { q: "Which feature stops a newly connected switch with priority 0 from taking over as root on that port?", a: "Root Guard." },
      ],
    },
    {
      id: "config",
      title: "Configuration and verification",
      md: `
        ~~~
        SW1(config)# spanning-tree mode rapid-pvst
        SW1(config)# spanning-tree vlan 10 root primary        ! priority 24576, or 4096 below the current root
        SW2(config)# spanning-tree vlan 10 root secondary      ! priority 28672
        SW3(config)# spanning-tree vlan 20 priority 4096       ! set it directly
        SW3(config)# interface g0/2
        SW3(config-if)# spanning-tree vlan 10 cost 10           ! override the port cost
        SW3(config-if)# spanning-tree vlan 10 port-priority 64  ! multiples of 16
        ~~~

        Everything is **per VLAN**, so different VLANs can have different roots, which load-balances traffic across links.

        ~~~
        SW3# show spanning-tree vlan 1

        VLAN0001
          Spanning tree enabled protocol rstp
          Root ID    Priority    32769
                     Address     0011.1111.1111
                     Cost        4
                     Port        1 (GigabitEthernet0/1)
                     Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

          Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
                     Address     0033.3333.3333
                     Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

        Interface           Role Sts Cost      Prio.Nbr Type
        ------------------- ---- --- --------- -------- ----------------
        Gi0/1               Root FWD 4         128.1    P2p
        Gi0/2               Altn BLK 4         128.2    P2p
        Gi0/3               Desg FWD 4         128.3    P2p Edge
        ~~~

        - **Root ID**: the root bridge, plus *this* switch's root cost and root port. On the root itself it says "This bridge is the root".
        - **Bridge ID**: this switch.
        - **Role**: Root / Desg / Altn / Back. **Sts**: FWD, BLK (discarding), LRN.
        - **Type**: P2p, Shr (shared), Edge (PortFast).
      `,
      checks: [
        { q: "The current root has priority 16384. What priority does `spanning-tree vlan 1 root primary` set?", a: "12288 — 4096 below the current root (24576 wouldn't win)." },
        { q: "In the exhibit, what is SW3's root cost and which port is its root port?", a: "Cost 4, root port Gi0/1." },
        { q: "In the exhibit, why does Gi0/3 show 'Edge'?", a: "PortFast is enabled — it's an edge port to an end host." },
      ],
    },
    {
      id: "traps",
      title: "Exam traps",
      md: `
        - **Priority first, MAC second.** A lower MAC never beats a lower priority.
        - Displayed priority includes the VLAN (32769 for VLAN 1); configured values are multiples of **4096**.
        - Root port tie-breakers use the **neighbor's** Bridge ID and port ID, not the local ones.
        - **Every port on the root bridge is designated**; the far end of a root port is designated.
        - Blocking happens on the switch **farther from the root**, or with the higher Bridge ID on a tie.
        - Root cost sums the ports **facing the root**; the root bridge advertises 0.
        - Classic convergence **30–50 s**; RSTP about 1 s. RSTP has 3 states and adds **alternate** and **backup** roles.
        - **PortFast** only on host-facing access ports; **BPDU Guard** err-disables on any BPDU.
        - \`root primary\` sets 24576 **or** 4096 below the existing root.

        > [!key] Practice
        > Draw two or three switches with different priorities, MACs and link speeds, and run the three-step election until it's
        > automatic. Then do the Day 20–22 quizzes.
      `,
      checks: [
        { q: "SW1: priority 32769, MAC 0000.0000.0001. SW2: priority 28673, MAC ffff.ffff.ffff. Which is root?", a: "SW2 — lower priority wins before MACs are compared." },
      ],
    },
  ],
});
