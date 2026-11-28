/*
 * Study guide: VLANs & Trunking (blueprint 2.1, 2.2; course days 16–19).
 * Format: see data/guides/subnetting.js (escape backticks as \` ; use ~~~ for code fences).
 */
CCNA.addGuide("vlans", {
  intro: `
    VLANs show up all over the exam: configuring access and trunk ports, reading \`show vlan brief\` and
    \`show interfaces trunk\`, the 802.1Q tag, the native VLAN, and routing between VLANs with
    router-on-a-stick or SVIs on a multilayer switch. Troubleshooting questions usually come down to
    **wrong VLAN on a port**, a **VLAN not allowed on a trunk**, or a **native VLAN mismatch**.

    The blueprint asks for VLANs on access ports (2.1) and interswitch connectivity: trunks, 802.1Q and the native VLAN (2.2).
    DTP and VTP aren't on the v1.1 blueprint, but they explain switch behavior you'll see, so they're covered briefly at the end.
  `,
  sections: [
    {
      id: "why",
      title: "What VLANs solve",
      md: `
        A **LAN is a broadcast domain**: every device that receives a frame sent to FFFF.FFFF.FFFF.
        Without VLANs, every port on a switch (and every switch connected to it) is in the same broadcast domain.

        A **VLAN** splits one physical switch into several logical Layer 2 networks, configured **per interface**.

        - **Performance**: broadcasts and unknown-unicast floods stay inside the VLAN.
        - **Security**: hosts in different VLANs can't reach each other directly at Layer 2. Traffic between
          VLANs must go through a router or firewall, where you can apply policy (e.g. ACLs).
        - **Flexibility**: grouping follows function (Engineering, HR, Voice), not physical location.

        **One VLAN = one IP subnet** is the normal design. A switch **never forwards frames between VLANs**:
        inter-VLAN traffic needs **Layer 3** (a router or a multilayer switch).
      `,
      checks: [
        { q: "PC1 in VLAN 10 and PC2 in VLAN 20 are on the same switch. Can PC1 reach PC2 without a router?", a: "No — they're in different broadcast domains. Inter-VLAN traffic must be routed (router or multilayer switch)." },
        { q: "PC1 in VLAN 10 sends a broadcast. Which devices receive it?", a: "Only devices in VLAN 10 (including over trunks that carry VLAN 10)." },
      ],
    },
    {
      id: "ranges",
      title: "VLAN IDs and default VLANs",
      md: `
        | Range | Use |
        |---|---|
        | 0, 4095 | Reserved, can't be used |
        | **1** | Default VLAN: every port starts here. Can't be deleted |
        | 2 – 1001 | Normal range |
        | **1002 – 1005** | Reserved defaults for legacy FDDI and Token Ring. Can't be deleted |
        | 1006 – 4094 | Extended range |

        Usable IDs are **1 – 4094**, because the 802.1Q VLAN ID is 12 bits (0–4095) and the two ends are reserved.
        A new switch shows **5 VLANs**: 1 and 1002–1005.

        The VLAN database is stored in **vlan.dat** in flash, not in the running-config, on most switches.
      `,
      checks: [
        { q: "Which VLANs exist on a factory-default Cisco switch?", a: "VLAN 1 and VLANs 1002–1005." },
        { q: "Why is 4094 the highest usable VLAN ID?", a: "The VID field is 12 bits (0–4095), and 0 and 4095 are reserved." },
      ],
    },
    {
      id: "access",
      title: "Access ports",
      md: `
        An **access port** belongs to exactly **one VLAN** and connects an end host. Frames on it are **untagged**.

        ~~~
        SW1(config)# vlan 10
        SW1(config-vlan)# name ENGINEERING
        SW1(config-vlan)# vlan 20
        SW1(config-vlan)# name HR
        SW1(config-vlan)# exit
        SW1(config)# interface range f0/1 - 2
        SW1(config-if-range)# switchport mode access
        SW1(config-if-range)# switchport access vlan 10
        SW1(config-if-range)# interface f0/3
        SW1(config-if)# switchport mode access
        SW1(config-if)# switchport access vlan 20
        ~~~

        - \`vlan 10\` in global config creates the VLAN (or enters it if it exists).
        - \`switchport access vlan 30\` for a VLAN that doesn't exist yet **creates it automatically**
          (\`% Access VLAN does not exist. Creating vlan 30\`).
        - \`switchport mode access\` hard-codes the port as an access port, so it never becomes a trunk.

        ~~~
        SW1# show vlan brief
        VLAN Name                             Status    Ports
        ---- -------------------------------- --------- -------------------------------
        1    default                          active    Fa0/4, Fa0/5, Gi0/2
        10   ENGINEERING                      active    Fa0/1, Fa0/2
        20   HR                               active    Fa0/3
        1002 fddi-default                     act/unsup
        1003 token-ring-default               act/unsup
        1004 fddinet-default                  act/unsup
        1005 trnet-default                    act/unsup
        ~~~

        > [!trap] Trunk ports aren't listed
        > \`show vlan brief\` only lists **access** ports. If Gi0/1 is missing from the output above, it's probably a
        > trunk. Check it with \`show interfaces trunk\`.
      `,
      checks: [
        { q: "Which two commands make Fa0/7 an access port in VLAN 30?", a: "`switchport mode access` and `switchport access vlan 30` (interface config)." },
        { q: "G0/1 appears in no VLAN in `show vlan brief`. Most likely reason?", a: "It's a trunk port — trunks aren't listed in `show vlan brief`." },
        { q: "What happens if you assign a port to VLAN 30 before creating VLAN 30?", a: "IOS creates VLAN 30 automatically." },
      ],
    },
    {
      id: "dot1q",
      title: "Trunks and the 802.1Q tag",
      md: `
        A **trunk** carries **many VLANs over one link**: between switches, or from a switch to a router or server.
        To keep the VLANs apart, the switch **tags** each frame with its VLAN.

        Two trunking protocols exist: **ISL** (Cisco-proprietary, obsolete) and **IEEE 802.1Q** ("dot1q"). The CCNA only needs 802.1Q.

        ### The 802.1Q tag: 4 bytes, inserted between the source MAC and the Type field
        | Field | Bits | Purpose |
        |---|---|---|
        | **TPID** | 16 | Always **0x8100**: "this frame is tagged" |
        | **PCP** | 3 | Priority (Class of Service, used by QoS) |
        | **DEI** | 1 | Drop Eligible Indicator: can be dropped during congestion |
        | **VID** | 12 | **VLAN ID** (0–4095) |

        PCP + DEI + VID together are the 16-bit **TCI** (Tag Control Information).
        A tagged frame can be up to **1522 bytes** (1518 + 4).
      `,
      checks: [
        { q: "How big is the 802.1Q tag, and where is it inserted?", a: "4 bytes, between the source MAC address and the Type/Length field." },
        { q: "What value does the TPID field contain?", a: "0x8100" },
        { q: "How many bits identify the VLAN in an 802.1Q tag?", a: "12 bits (the VID)." },
      ],
    },
    {
      id: "native",
      title: "The native VLAN",
      md: `
        On an 802.1Q trunk, frames of the **native VLAN are sent untagged**, and untagged frames received on the
        trunk are put into the native VLAN.

        - The default native VLAN is **VLAN 1**.
        - Both ends of a trunk **must use the same native VLAN**. On a mismatch, untagged frames end up in the wrong VLAN
          (traffic "leaks" between VLANs) and CDP logs \`%CDP-4-NATIVE_VLAN_MISMATCH\`.
        - Best practice: change the native VLAN to an **unused VLAN** (e.g. 1001), so no user traffic travels untagged.
          This also defends against VLAN-hopping by double tagging.

        ~~~
        SW1(config-if)# switchport trunk native vlan 1001
        ~~~
      `,
      checks: [
        { q: "SW1's trunk uses native VLAN 1, SW2's end uses native VLAN 99. What happens to untagged frames?", a: "Frames sent untagged from SW1's VLAN 1 arrive in SW2's VLAN 99 (and vice versa) — traffic crosses VLANs; CDP reports a native VLAN mismatch." },
        { q: "Are frames in the native VLAN tagged on an 802.1Q trunk?", a: "No — native VLAN frames are sent untagged." },
      ],
    },
    {
      id: "trunkcfg",
      title: "Configuring and verifying trunks",
      md: `
        ~~~
        SW1(config)# interface g0/1
        SW1(config-if)# switchport trunk encapsulation dot1q     ! only on switches that also support ISL
        SW1(config-if)# switchport mode trunk
        SW1(config-if)# switchport trunk allowed vlan 10,20,30
        SW1(config-if)# switchport trunk native vlan 1001
        ~~~

        - Switches that support both ISL and 802.1Q default to encapsulation **negotiate**, and refuse \`switchport mode trunk\`
          until you set \`switchport trunk encapsulation dot1q\`.
        - By default a trunk allows **all VLANs 1–4094**.

        ### Editing the allowed list
        | Command | Effect |
        |---|---|
        | \`switchport trunk allowed vlan 10,20\` | **Replaces** the list with exactly 10 and 20 |
        | \`switchport trunk allowed vlan add 30\` | Adds VLAN 30 |
        | \`switchport trunk allowed vlan remove 20\` | Removes VLAN 20 |
        | \`switchport trunk allowed vlan except 99\` | All VLANs except 99 |
        | \`switchport trunk allowed vlan all\` / \`none\` | All (the default) / none |

        > [!trap] The missing "add"
        > \`switchport trunk allowed vlan 40\` on a trunk that carried 10, 20 and 30 leaves it carrying **only 40**.
        > This is a classic exam scenario: new VLAN works, every other VLAN breaks.

        ~~~
        SW1# show interfaces trunk
        Port        Mode         Encapsulation  Status        Native vlan
        Gi0/1       on           802.1q         trunking      1001

        Port        Vlans allowed on trunk
        Gi0/1       10,20,30

        Port        Vlans allowed and active in management domain
        Gi0/1       10,20,30

        Port        Vlans in spanning tree forwarding state and not pruned
        Gi0/1       10,20,30
        ~~~

        - **Mode** \`on\` = statically configured trunk (\`switchport mode trunk\`); \`desirable\`/\`auto\` = negotiated by DTP.
        - \`show interfaces g0/1 switchport\` shows the administrative vs operational mode, the access VLAN and the native VLAN for one port.
      `,
      checks: [
        { q: "A trunk allows VLANs 10,20,30. Which command adds VLAN 40 without removing the others?", a: "`switchport trunk allowed vlan add 40`" },
        { q: "`switchport mode trunk` is rejected with 'An interface whose trunk encapsulation is Auto can not be configured to trunk mode'. Fix?", a: "First enter `switchport trunk encapsulation dot1q`." },
        { q: "Hosts in VLAN 20 on SW1 can't reach VLAN 20 hosts on SW2; VLAN 10 works. `show interfaces trunk` lists allowed VLANs 1,10. Cause?", a: "VLAN 20 isn't allowed on the trunk — add it with `switchport trunk allowed vlan add 20`." },
      ],
    },
    {
      id: "roas",
      title: "Inter-VLAN routing: router-on-a-stick",
      md: `
        **Router-on-a-stick (ROAS)** routes between VLANs using **one physical router interface** connected to a
        switch **trunk**. The router uses one **subinterface per VLAN**.

        ~~~
        R1(config)# interface g0/0
        R1(config-if)# no shutdown
        R1(config-if)# interface g0/0.10
        R1(config-subif)# encapsulation dot1q 10
        R1(config-subif)# ip address 192.168.10.62 255.255.255.192
        R1(config-subif)# interface g0/0.20
        R1(config-subif)# encapsulation dot1q 20
        R1(config-subif)# ip address 192.168.20.126 255.255.255.128
        ~~~

        - \`encapsulation dot1q 10\` ties the subinterface to VLAN 10: frames tagged 10 arrive there, and frames sent from it are tagged 10.
        - The subinterface **number** (\`.10\`) is only a label. Matching it to the VLAN is good practice, not a requirement.
        - Each subinterface's IP is the **default gateway** for that VLAN.
        - The **physical** interface needs \`no shutdown\`; the subinterfaces come up with it.
        - The switch port facing the router is a normal **trunk**.

        ### The native VLAN on the router
        Either \`encapsulation dot1q 1001 native\` on a subinterface, or put the native VLAN's IP address directly on the
        **physical** interface (no encapsulation command). Without the \`native\` keyword, the router tags that VLAN and
        doesn't match the switch's untagged frames.

        > [!note] Downsides
        > All inter-VLAN traffic crosses one link twice (in and out), which can become a bottleneck. That's why larger
        > networks route on a multilayer switch instead.
      `,
      checks: [
        { q: "Which subinterface command associates g0/0.30 with VLAN 30?", a: "`encapsulation dot1q 30`" },
        { q: "Must subinterface g0/0.30 be used for VLAN 30?", a: "No — the number is just a label; `encapsulation dot1q 30` defines the VLAN. Matching them is best practice." },
        { q: "The switch port facing a ROAS router is configured as an access port in VLAN 10. What breaks?", a: "Only VLAN 10 (untagged) reaches the router — the port must be a trunk for the other VLANs." },
      ],
    },
    {
      id: "svi",
      title: "Inter-VLAN routing: multilayer switch and SVIs",
      md: `
        A **multilayer (Layer 3) switch** can route itself. Each VLAN gets an **SVI** (Switch Virtual Interface):
        a virtual routed interface that becomes the VLAN's default gateway.

        ~~~
        SW2(config)# ip routing
        SW2(config)# interface vlan 10
        SW2(config-if)# ip address 192.168.10.62 255.255.255.192
        SW2(config-if)# no shutdown
        SW2(config-if)# interface vlan 20
        SW2(config-if)# ip address 192.168.20.126 255.255.255.128
        SW2(config-if)# no shutdown
        SW2(config-if)# interface g0/1
        SW2(config-if)# no switchport
        SW2(config-if)# ip address 192.168.1.193 255.255.255.252
        SW2(config-if)# exit
        SW2(config)# ip route 0.0.0.0 0.0.0.0 192.168.1.194
        ~~~

        - \`ip routing\` turns on IPv4 routing. **Without it the switch doesn't route**, even with SVIs configured.
        - \`no switchport\` turns a switch port into a **routed port** (a Layer 3 interface, like a router port).
        - SVIs are **shut down by default**, so use \`no shutdown\`.

        ### An SVI is up/up only when
        1. The VLAN **exists** on the switch,
        2. **at least one** access port in that VLAN **or** a trunk that allows the VLAN is **up/up**,
        3. the VLAN isn't shut down (\`shutdown\` in VLAN config), and
        4. the SVI itself isn't shut down.

        > [!trap] The empty VLAN
        > Creating \`interface vlan 40\` for a VLAN with no active ports leaves it **down/down**, even after \`no shutdown\`.
      `,
      checks: [
        { q: "SVIs are configured with IPs and `no shutdown`, but hosts in different VLANs still can't reach each other through the switch. What's likely missing?", a: "`ip routing` in global config." },
        { q: "Which command turns a multilayer switch port into a routed port?", a: "`no switchport`" },
        { q: "`interface vlan 40` stays down/down after `no shutdown`. Name a likely cause.", a: "No up/up access port in VLAN 40 and no up/up trunk allowing it (or VLAN 40 doesn't exist / is shut down)." },
      ],
    },
    {
      id: "dtp-vtp",
      title: "DTP and VTP (background)",
      md: `
        These aren't on the v1.1 blueprint, but they explain trunks forming "by themselves" and VLANs appearing or disappearing.

        ### DTP: Dynamic Trunking Protocol
        Cisco switch ports negotiate access vs trunk by default.

        | | trunk | dynamic desirable | dynamic auto | access |
        |---|---|---|---|---|
        | **trunk** | Trunk | Trunk | Trunk | Mismatch (don't) |
        | **dynamic desirable** | Trunk | Trunk | Trunk | Access |
        | **dynamic auto** | Trunk | Trunk | **Access** | Access |
        | **access** | Mismatch (don't) | Access | Access | Access |

        - **desirable** actively asks to trunk; **auto** only agrees if asked. **auto + auto = no trunk.**
        - Default on newer switches: \`dynamic auto\` (older: \`dynamic desirable\`).
        - DTP never forms a trunk with a router or PC.
        - **Best practice: disable DTP.** Hard-code \`switchport mode access\` or \`switchport mode trunk\`, and add
          \`switchport nonegotiate\` on trunks.

        ### VTP: VLAN Trunking Protocol
        Syncs the VLAN database from a **server** to **clients** in the same VTP domain.
        - Modes: **server** (default: create, modify and delete VLANs), **client** (syncs, can't edit), **transparent** (keeps its own VLANs, forwards VTP messages but doesn't sync).
        - Every change increases the **revision number**; switches sync to the highest revision in the domain.
        - Danger: adding an old switch with a **higher revision number** and the same domain can overwrite every VLAN in the network.
        - Versions 1 and 2 don't support the extended range; version 3 does. Many networks use transparent mode or turn VTP off.
      `,
      checks: [
        { q: "Both ends of a link are `dynamic auto`. What does the link become?", a: "An access link — neither side actively asks for a trunk." },
        { q: "One end is `dynamic desirable`, the other `dynamic auto`. Result?", a: "Trunk." },
        { q: "How do you stop a trunk port from sending DTP frames?", a: "`switchport nonegotiate` (with `switchport mode trunk`)." },
      ],
    },
    {
      id: "troubleshoot",
      title: "Troubleshooting and exam traps",
      md: `
        | Symptom | Check | Typical cause |
        |---|---|---|
        | One host can't reach others in its VLAN | \`show vlan brief\`, \`show interfaces status\` | Port in the wrong VLAN, port shut down |
        | A VLAN works on one switch but not across the trunk | \`show interfaces trunk\` | VLAN not in the allowed list, VLAN not created on the other switch, link not trunking |
        | Traffic appears in the wrong VLAN / CDP mismatch messages | \`show interfaces trunk\` (Native vlan column) | **Native VLAN mismatch** |
        | Port shows "inactive" in \`show interfaces switchport\` | \`show vlan brief\` | The access VLAN was deleted |
        | Inter-VLAN routing fails on ROAS | \`show run\` on the router, trunk on the switch | Wrong \`encapsulation dot1q\` VLAN, physical interface shut down, switch port not a trunk |
        | Inter-VLAN routing fails on a multilayer switch | \`show ip interface brief\` | \`ip routing\` missing, SVI down |
        | Link between two switches never becomes a trunk | \`show interfaces switchport\` | DTP auto + auto |

        > [!trap] Exam favourites
        > - A switch **doesn't route** between VLANs on its own: you need a router, or \`ip routing\` plus SVIs.
        > - \`show vlan brief\` doesn't show trunk ports.
        > - \`switchport trunk allowed vlan X\` **replaces** the list; use \`add\`.
        > - Native VLAN frames are **untagged**, and both ends must agree.
        > - Subinterface numbers are labels; \`encapsulation dot1q\` sets the VLAN.
        > - SVIs need an active port in the VLAN to come up.
      `,
      checks: [
        { q: "PC5 is in the right subnet but `show vlan brief` lists its port Fa0/5 under VLAN 1 instead of VLAN 20. Fix?", a: "`switchport access vlan 20` on Fa0/5 (and `switchport mode access`)." },
        { q: "`show interfaces trunk` on SW1 shows Native vlan 1, on SW2 Native vlan 10 for the same link. Problem and fix?", a: "Native VLAN mismatch — set the same native VLAN on both ends with `switchport trunk native vlan <id>`." },
      ],
    },
  ],
});
