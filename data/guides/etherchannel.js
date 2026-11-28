/*
 * Study guide: EtherChannel (blueprint 2.4; course day 23).
 * Format: see data/guides/subnetting.js (escape backticks as \` ; use ~~~ for code fences).
 */
CCNA.addGuide("etherchannel", {
  intro: `
    EtherChannel questions come down to a few things: **which mode pairs form a channel**, **what must match
    on the member ports**, how to configure Layer 2 and Layer 3 EtherChannels, and how to read
    \`show etherchannel summary\`. The blueprint item is 2.4: *configure and verify (Layer 2/Layer 3) EtherChannel (LACP)*.
  `,
  sections: [
    {
      id: "why",
      title: "Why EtherChannel",
      md: `
        Uplinks between access and distribution switches carry the traffic of many hosts. When hosts can send more than the
        uplink can carry, the uplink is **oversubscribed**. A little is normal; too much means congestion.

        Adding parallel links doesn't help by itself: **STP blocks all but one** of them, because together they form a loop.

        **EtherChannel** bundles up to **8** physical links into **one logical interface**, a *port-channel*
        (vendors also call it a LAG, link aggregation group).
        - STP sees **one** interface, so every member link forwards.
        - Bandwidth adds up, e.g. 4 × 1 Gbps = 4 Gbps.
        - If a member fails, traffic moves to the remaining members **without an STP recalculation**.
      `,
      checks: [
        { q: "Two switches are linked by three cables without EtherChannel. How many links forward traffic?", a: "One — STP blocks the other two to prevent a loop." },
        { q: "What does STP see when the three cables are bundled into an EtherChannel?", a: "A single interface (Port-channel), so all three members forward." },
      ],
    },
    {
      id: "modes",
      title: "PAgP, LACP and static: which modes form a channel",
      md: `
        | Method | Standard | Modes |
        |---|---|---|
        | **LACP** | IEEE 802.3ad (now 802.1AX), open standard | **active** (initiates), **passive** (waits) |
        | **PAgP** | Cisco-proprietary | **desirable** (initiates), **auto** (waits) |
        | **Static** | No negotiation | **on** |

        | | on | desirable | auto | active | passive |
        |---|---|---|---|---|---|
        | **on** | ✓ | ✗ | ✗ | ✗ | ✗ |
        | **desirable** | ✗ | ✓ | ✓ | ✗ | ✗ |
        | **auto** | ✗ | ✓ | ✗ | ✗ | ✗ |
        | **active** | ✗ | ✗ | ✗ | ✓ | ✓ |
        | **passive** | ✗ | ✗ | ✗ | ✓ | ✗ |

        The rule: **same protocol, and at least one side must start the negotiation**. \`on\` only works with \`on\`.

        > [!tip] Prefer LACP active
        > LACP is the open standard and the blueprint's focus. A negotiated channel also detects misconfigurations and
        > refuses to bundle them. With \`on\`, a wiring or config mistake can create a loop, because nothing is checked.
      `,
      checks: [
        { q: "SW1 is `active`, SW2 is `passive`. Does a channel form?", a: "Yes (LACP; active initiates)." },
        { q: "SW1 is `auto`, SW2 is `auto`. Does a channel form?", a: "No — both PAgP sides wait for the other." },
        { q: "SW1 is `on`, SW2 is `active`. Does a channel form?", a: "No — `on` doesn't negotiate, and `active` needs an LACP partner." },
      ],
    },
    {
      id: "requirements",
      title: "Member requirements and limits",
      md: `
        All member interfaces must match:
        - **Speed** and **duplex**
        - **Switchport mode** (access or trunk)
        - Access ports: the same **access VLAN**. Trunks: the same **allowed VLANs** and **native VLAN**

        A member that doesn't match is **suspended** (\`s\` in \`show etherchannel summary\`) and doesn't carry traffic.

        ### Limits
        - Up to **8 active** members per EtherChannel. LACP can define up to 16 (8 active + 8 **hot-standby**).
        - The **channel-group number** must be the same for the members on **one switch**. It doesn't have to match the number on the other switch.

        > [!tip] Configure the port-channel, not the members
        > After the bundle exists, put settings such as trunking and allowed VLANs on \`interface port-channel 1\`. IOS copies
        > them to the members, so they stay consistent.
      `,
      checks: [
        { q: "One member is a trunk allowing VLANs 10,20 and the others allow 10,20,30. What happens to it?", a: "It's suspended — allowed VLANs must match on all members." },
        { q: "SW1 uses `channel-group 1` and SW2 uses `channel-group 5` for the same bundle. Problem?", a: "No — the number is only locally significant." },
      ],
    },
    {
      id: "l2config",
      title: "Configuring and verifying a Layer 2 EtherChannel",
      md: `
        ~~~
        SW1(config)# interface range g0/0 - 3
        SW1(config-if-range)# channel-group 1 mode active
        Creating a port-channel interface Port-channel 1
        SW1(config-if-range)# exit
        SW1(config)# interface port-channel 1
        SW1(config-if)# switchport trunk encapsulation dot1q
        SW1(config-if)# switchport mode trunk
        ~~~
        Do the same on SW2 with \`active\` or \`passive\`.

        ~~~
        SW1# show etherchannel summary
        Flags:  D - down        P - bundled in port-channel
                I - stand-alone s - suspended
                H - Hot-standby (LACP only)
                R - Layer3      S - Layer2
                U - in use      f - failed to allocate aggregator

        Number of channel-groups in use: 1
        Number of aggregators:           1

        Group  Port-channel  Protocol    Ports
        ------+-------------+-----------+-----------------------------------------------
        1      Po1(SU)         LACP      Gi0/0(P)    Gi0/1(P)    Gi0/2(P)    Gi0/3(P)
        ~~~

        | Flag | Meaning |
        |---|---|
        | \`Po1(SU)\` | Layer 2 port-channel, in use: healthy |
        | \`Po1(RU)\` | Layer 3 port-channel, in use |
        | \`Po1(SD)\` | Layer 2 port-channel, down |
        | \`(P)\` | Member bundled |
        | \`(s)\` | Member suspended (config mismatch) |
        | \`(I)\` | Member stand-alone (no negotiation partner, e.g. the other side isn't configured or uses incompatible modes) |
        | \`(D)\` | Member down |
        | \`(H)\` | Hot-standby (LACP, beyond 8 active links) |

        Other useful commands: \`show etherchannel port-channel\` (details of the logical interface) and \`show spanning-tree\`
        (only **Po1** appears, not the members).
      `,
      checks: [
        { q: "`show etherchannel summary` shows `Po1(SD)` and all members `(I)`. Likely cause?", a: "No negotiation partner — e.g. the other switch isn't configured, or the modes are incompatible (auto/auto, passive/passive, on vs active)." },
        { q: "What does `Po2(RU)` tell you?", a: "Port-channel 2 is a Layer 3 EtherChannel and in use." },
      ],
    },
    {
      id: "loadbalance",
      title: "Load balancing",
      md: `
        EtherChannel doesn't split single frames or round-robin them. It hashes each **flow** onto one member, so all frames of a
        conversation take the same link and stay **in order**.

        ~~~
        SW1(config)# port-channel load-balance src-dst-ip
        SW1# show etherchannel load-balance
        EtherChannel Load-Balancing Configuration:
                src-dst-ip
        ~~~

        Inputs (platform dependent): \`src-mac\`, \`dst-mac\`, \`src-dst-mac\`, \`src-ip\`, \`dst-ip\`, \`src-dst-ip\`, and on some
        platforms Layer 4 ports.

        > [!example] Choosing the hash
        > All traffic from access hosts goes to the same default gateway MAC. With \`dst-mac\`, every frame hashes to the
        > **same** member and the others sit idle. \`src-dst-ip\` spreads the many host-to-server flows across all members.

        One flow never exceeds one member's speed. A single 1 Gbps file transfer over a 4 × 1 Gbps bundle still gets 1 Gbps.
      `,
      checks: [
        { q: "Why doesn't EtherChannel send frames round-robin?", a: "Frames of one flow could arrive out of order; per-flow hashing keeps each conversation on one link." },
        { q: "Which command sets the load-balancing method?", a: "`port-channel load-balance <method>` in global config." },
      ],
    },
    {
      id: "l3",
      title: "Layer 3 EtherChannel",
      md: `
        Between multilayer switches (or a switch and a router), an EtherChannel can be a **routed** link with an IP address.

        ~~~
        DSW1(config)# interface range g0/0 - 1
        DSW1(config-if-range)# no switchport
        DSW1(config-if-range)# channel-group 1 mode active
        DSW1(config-if-range)# exit
        DSW1(config)# interface port-channel 1
        DSW1(config-if)# ip address 10.0.0.1 255.255.255.252
        ~~~

        - \`no switchport\` goes on the **members first**, which makes the port-channel a routed interface.
        - The **IP address goes on the port-channel**, never on the members.
        - Verify with \`show etherchannel summary\` (\`Po1(RU)\`) and \`show ip interface brief\`.
      `,
      checks: [
        { q: "Where is the IP address configured in a Layer 3 EtherChannel?", a: "On the port-channel interface (`interface port-channel 1`)." },
        { q: "Which command must be applied to the member interfaces for a Layer 3 EtherChannel?", a: "`no switchport`" },
      ],
    },
    {
      id: "traps",
      title: "Troubleshooting and exam traps",
      md: `
        | Symptom | Likely cause |
        |---|---|
        | No channel forms, members \`(I)\` | Incompatible modes (auto/auto, passive/passive, on vs active/desirable, PAgP vs LACP) |
        | One member \`(s)\` | That member's speed, duplex, mode or VLANs differ from the others |
        | Only one link carries traffic | Poor load-balancing choice (e.g. dst-mac towards one gateway) |
        | Layer 3 channel has no IP connectivity | IP on the members instead of the port-channel, or \`no switchport\` missing |

        > [!trap] Exam favourites
        > - **active/passive = LACP**, **desirable/auto = PAgP**, **on = static**.
        > - Two passive or two auto sides **never** form a channel.
        > - \`on\` only pairs with \`on\`.
        > - Max **8 active** links; LACP adds up to 8 hot-standby.
        > - Load balancing is **per flow**, not per frame.
        > - The channel-group number is **local**.
      `,
      checks: [
        { q: "Which pair forms a channel: desirable + passive, or desirable + auto?", a: "desirable + auto (both PAgP). desirable + passive mixes PAgP and LACP." },
      ],
    },
  ],
});
