CCNA.addDay("d02", {
  "cards": [
    {"id": "d02-c01", "front": "Which IEEE standard defines Ethernet?", "back": "**IEEE 802.3** (since 1983)."},
    {"id": "d02-c02", "front": "1 Gbps = how many bits per second? 1 byte = ?", "back": "1 Gbps = 1,000,000,000 bps (decimal units: K = 10^3, M = 10^6, G = 10^9). 1 byte = **8 bits**."},
    {"id": "d02-c03", "front": "10BASE-T: speed, common name, IEEE standard?", "back": "10 Mbps · Ethernet · **802.3i**"},
    {"id": "d02-c04", "front": "100BASE-T: speed, common name, IEEE standard?", "back": "100 Mbps · Fast Ethernet · **802.3u**"},
    {"id": "d02-c05", "front": "1000BASE-T: speed, common name, IEEE standard?", "back": "1 Gbps · Gigabit Ethernet · **802.3ab**"},
    {"id": "d02-c06", "front": "10GBASE-T: speed, common name, IEEE standard?", "back": "10 Gbps · 10 Gigabit Ethernet · **802.3an**"},
    {"id": "d02-c07", "front": "Maximum distance for copper (UTP) Ethernet?", "back": "**100 m** for all the BASE-T standards."},
    {"id": "d02-c08", "front": "What do **BASE** and **T** mean in 1000BASE-T?", "back": "BASE = **baseband** signaling. T = **twisted pair**."},
    {"id": "d02-c09", "front": "What is UTP, and why are the wires twisted?", "back": "**Unshielded twisted pair**: no metallic shield. The twisting protects against **EMI** (electromagnetic interference)."},
    {"id": "d02-c10", "front": "How many wire pairs do 10/100BASE-T use? 1000BASE-T and 10GBASE-T?", "back": "10BASE-T and 100BASE-T use **2 pairs**. 1000BASE-T and 10GBASE-T use **all 4 pairs**, each bidirectional."},
    {"id": "d02-c11", "front": "PC / router / firewall: which RJ-45 pins transmit and which receive?", "back": "Transmit on **1, 2**. Receive on **3, 6**."},
    {"id": "d02-c12", "front": "Switch: which RJ-45 pins transmit and which receive?", "back": "Transmit on **3, 6**. Receive on **1, 2** (the reverse of PCs and routers)."},
    {"id": "d02-c13", "front": "Straight-through vs crossover cable: when do you use each?", "back": "Straight-through: **unlike** devices (PC/router/firewall ↔ switch). Crossover: **like** devices (switch ↔ switch, PC ↔ PC, router ↔ router, **router ↔ PC**)."},
    {"id": "d02-c14", "front": "Crossover cable pin mapping?", "back": "1 ↔ 3 and 2 ↔ 6"},
    {"id": "d02-c15", "front": "What does **Auto MDI-X** do?", "back": "Detects which pins the neighbor transmits on and adjusts automatically, so either cable type works. On by default on most modern devices."},
    {"id": "d02-c16", "front": "What is an **SFP**?", "back": "Small Form-Factor Pluggable **transceiver**: a module that lets a switch or router port take a fiber (or other) cable."},
    {"id": "d02-c17", "front": "Single-mode vs multimode fiber?", "back": "Single-mode: **narrow** core, one light path, **laser** transmitter, **longest** distance, more expensive. Multimode: **wider** core, multiple paths, **LED** transmitter, shorter distance (still longer than UTP), cheaper."},
    {"id": "d02-c18", "front": "10GBASE-SR / -LR / -ER: fiber type and maximum distance?", "back": "SR: multimode, **400 m**. LR: single-mode, **10 km**. ER: single-mode, **30 km**. (All IEEE 802.3ae.)"},
    {"id": "d02-c19", "front": "1000BASE-LX: standard and distances?", "back": "**802.3z**, 1 Gbps. Up to **550 m** on multimode, **5 km** on single-mode."},
    {"id": "d02-c20", "front": "UTP vs fiber: key differences?", "back": "UTP: cheaper, ~100 m, **vulnerable to EMI**, its signal can leak and be copied. Fiber: costlier, much longer distance, **immune to EMI**, no signal leakage. Fiber uses separate TX and RX strands."}
  ],
  "questions": [
    {"id": "d02-q01", "type": "single", "q": "Auto MDI-X is disabled. Which cable connects a PC to a switch?", "options": ["Crossover", "Straight-through", "Rollover", "Single-mode fiber"], "answer": [1], "explain": "The PC transmits on 1,2 and the switch receives on 1,2, so the pins map straight across."},
    {"id": "d02-q02", "type": "single", "q": "Auto MDI-X is disabled. Which cable connects a router's Ethernet port directly to a PC's NIC?", "options": ["Straight-through", "Crossover", "Rollover", "Either works without Auto MDI-X"], "answer": [1], "explain": "Router and PC both transmit on pins 1,2, so the pairs must be crossed (1↔3, 2↔6)."},
    {"id": "d02-q03", "type": "single", "q": "What is the maximum cable length for 1000BASE-T?", "options": ["55 m", "100 m", "185 m", "550 m"], "answer": [1], "explain": "All twisted-pair BASE-T standards (10/100/1000/10G) are limited to 100 m."},
    {"id": "d02-q04", "type": "single", "q": "Which fiber type uses a laser-based transmitter and supports the longest distances?", "options": ["Multimode", "Single-mode", "UTP Cat6", "Shielded twisted pair"], "answer": [1], "explain": "Single-mode has a narrow core and one light path, so it reaches the furthest. It needs more expensive laser SFPs."},
    {"id": "d02-q05", "type": "single", "q": "Which standard runs 10 Gbps over **multimode** fiber up to 400 m?", "options": ["10GBASE-SR", "10GBASE-LR", "10GBASE-ER", "10GBASE-T"], "answer": [0], "explain": "SR (short range) is multimode, 400 m. LR (10 km) and ER (30 km) are single-mode. 10GBASE-T is copper."},
    {"id": "d02-q06", "type": "multi", "q": "Which two are advantages of fiber over UTP? (Choose two.)", "options": ["Immune to electromagnetic interference", "Supports much longer distances", "Lower cost of cables and ports", "Uses standard RJ-45 connectors", "Uses a single strand for both transmit and receive"], "answer": [0, 1], "explain": "Fiber is immune to EMI and reaches far further, but cables and SFP ports cost more. It uses separate TX and RX strands."},
    {"id": "d02-q07", "type": "single", "q": "Which IEEE standard defines Gigabit Ethernet over copper twisted pair (1000BASE-T)?", "options": ["802.3i", "802.3u", "802.3ab", "802.3an"], "answer": [2], "explain": "802.3i = 10BASE-T, 802.3u = 100BASE-T, 802.3ab = 1000BASE-T, 802.3an = 10GBASE-T."},
    {"id": "d02-q08", "type": "multi", "q": "Which two standards use all four wire pairs of a UTP cable? (Choose two.)", "options": ["10BASE-T", "100BASE-T", "1000BASE-T", "10GBASE-T"], "answer": [2, 3], "explain": "10 and 100 Mbps use only 2 pairs (one TX, one RX). Gigabit and 10G use all 4 pairs, each bidirectional."},
    {"id": "d02-q09", "type": "single", "q": "On a switch's copper Ethernet port, which pins does the switch **transmit** on?", "options": ["1 and 2", "3 and 6", "4 and 5", "7 and 8"], "answer": [1], "explain": "Switches transmit on 3,6 and receive on 1,2, the opposite of PCs, routers and firewalls."},
    {"id": "d02-q10", "type": "single", "q": "What is the purpose of twisting the wire pairs in UTP cable?", "options": ["To increase the maximum distance to 1 km", "To protect against electromagnetic interference", "To allow power over Ethernet", "To encrypt the signal"], "answer": [1], "explain": "Twisting cancels out EMI. UTP has no metallic shield, so the twists are its only protection."}
  ]
});
