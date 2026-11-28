CCNA.addDay("d22", {
  "cards": [
    {"id": "d22-c01", "front": "STP versions: IEEE vs Cisco?", "back": "802.1D STP → Cisco **PVST+** · 802.1w RSTP → Cisco **Rapid PVST+** · 802.1s **MSTP** (VLANs grouped into instances)"},
    {"id": "d22-c02", "front": "What stays the same in RSTP compared to STP?", "back": "Its purpose (block ports to prevent loops) and the **elections**: root bridge, root port and designated port rules."},
    {"id": "d22-c03", "front": "Why is RSTP faster?", "back": "It uses a **proposal/agreement handshake** between switches instead of waiting out timers, so it converges in about 1 s."},
    {"id": "d22-c04", "front": "RSTP port states?", "back": "**Discarding** (replaces disabled, blocking and listening) · **Learning** · **Forwarding**"},
    {"id": "d22-c05", "front": "RSTP port roles?", "back": "**Root** · **Designated** · **Alternate** · **Backup**"},
    {"id": "d22-c06", "front": "What is an **alternate** port?", "back": "Discarding; receives a superior BPDU from **another switch**. A ready backup for the root port that **forwards immediately** if the root port fails (UplinkFast behavior built in)."},
    {"id": "d22-c07", "front": "What is a **backup** port?", "back": "Discarding; receives a superior BPDU from **another port on the same switch**. Only happens when two ports connect to the same hub."},
    {"id": "d22-c08", "front": "BPDUs in RSTP vs STP?", "back": "STP: only the root originates BPDUs; the others relay them. RSTP: **every switch** sends its own BPDUs every hello (2 s)."},
    {"id": "d22-c09", "front": "How fast does RSTP detect a lost neighbor?", "back": "After **3 missed hellos (6 s)**; it then flushes the MACs learned on that port. Classic STP waits max age (20 s)."},
    {"id": "d22-c10", "front": "RSTP link types?", "back": "**Edge** (end host, like PortFast) · **Point-to-point** (full duplex to a switch) · **Shared** (half duplex, via a hub)"},
    {"id": "d22-c11", "front": "Commands for RSTP link types?", "back": "Edge: `spanning-tree portfast`. `spanning-tree link-type point-to-point` / `spanning-tree link-type shared` (usually detected automatically from the duplex setting)."},
    {"id": "d22-c12", "front": "Is RSTP compatible with classic STP?", "back": "Yes. Ports facing an 802.1D switch fall back to classic STP behavior and timers."},
    {"id": "d22-c13", "front": "Which STP mode do modern Cisco switches run by default?", "back": "**Rapid PVST+**. Set it with `spanning-tree mode rapid-pvst`."}
  ],
  "questions": [
    {"id": "d22-q01", "type": "single", "q": "Which IEEE standard is Rapid Spanning Tree?", "options": ["802.1D", "802.1w", "802.1s", "802.1Q"], "answer": [1], "explain": "802.1D = classic STP, 802.1s = MSTP, 802.1Q = VLAN tagging."},
    {"id": "d22-q02", "type": "single", "q": "Which RSTP state replaces classic STP's blocking and listening states?", "options": ["Learning", "Discarding", "Disabled", "Alternate"], "answer": [1], "explain": "RSTP has only discarding, learning and forwarding. Alternate is a role, not a state."},
    {"id": "d22-q03", "type": "single", "q": "Which RSTP role immediately replaces a failed root port?", "options": ["Designated", "Backup", "Alternate", "Edge"], "answer": [2], "explain": "The alternate port already has a path to the root and moves straight to forwarding."},
    {"id": "d22-q04", "type": "single", "q": "A switch has two ports connected to the same hub. One is designated; what is the other?", "options": ["Alternate", "Backup", "Root", "Edge"], "answer": [1], "explain": "A superior BPDU from the switch's own port makes it a backup port."},
    {"id": "d22-q05", "type": "single", "q": "After how long does RSTP consider a neighbor lost?", "options": ["2 s", "6 s", "20 s", "50 s"], "answer": [1], "explain": "3 missed hellos × 2 s."},
    {"id": "d22-q06", "type": "single", "q": "Which RSTP link type is a port connected to an end host?", "options": ["Shared", "Point-to-point", "Edge", "Backup"], "answer": [2], "explain": "Edge ports go straight to forwarding, the same as PortFast."},
    {"id": "d22-q07", "type": "single", "q": "What is the Cisco name for per-VLAN RSTP?", "options": ["PVST+", "Rapid PVST+", "MSTP", "CST"], "answer": [1], "explain": "It's the default mode on modern Cisco switches."},
    {"id": "d22-q08", "type": "multi", "q": "Which two are the same in RSTP as in classic STP? (Choose two.)", "options": ["The root bridge election rules", "The root port selection rules", "The number of port states", "Only the root bridge originates BPDUs", "Convergence relies on forward delay timers"], "answer": [0, 1], "explain": "The elections are identical; states, BPDU behavior and convergence differ."},
    {"id": "d22-q09", "type": "multi", "q": "Which two link types does RSTP detect automatically from the duplex setting? (Choose two.)", "options": ["Point-to-point (full duplex)", "Shared (half duplex)", "Edge", "Alternate", "Root"], "answer": [0, 1], "explain": "Edge is configured with `spanning-tree portfast`."},
    {"id": "d22-q10", "type": "single", "q": "Which switches originate BPDUs in RSTP?", "options": ["Only the root bridge", "Every switch, from its designated ports", "Only switches with alternate ports", "None; RSTP uses a handshake only"], "answer": [1], "explain": "In classic STP only the root originates them."}
  ]
});
