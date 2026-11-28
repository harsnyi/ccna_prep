CCNA.addDay("d20", {
  "cards": [
    {"id": "d20-c01", "front": "What goes wrong in a Layer 2 network with redundant links but no STP?", "back": "**Broadcast storms** (frames loop forever, because there's no TTL at Layer 2), **MAC address flapping**, and duplicate frames."},
    {"id": "d20-c02", "front": "What does STP do?", "back": "Spanning Tree Protocol (classic: **IEEE 802.1D**) **blocks** redundant ports so there's exactly one active path. Blocked ports take over if an active path fails. It's on by default."},
    {"id": "d20-c03", "front": "What is a **BPDU**?", "back": "Bridge Protocol Data Unit: the STP message switches exchange. Hello BPDUs are sent every **2 seconds**."},
    {"id": "d20-c04", "front": "What is the **Bridge ID**?", "back": "**Priority (16 bits, including a 12-bit extended system ID = VLAN) + MAC address**. The lowest Bridge ID is best."},
    {"id": "d20-c05", "front": "Default bridge priority, and in which steps can it change?", "back": "**32768 + VLAN ID** (32769 for VLAN 1). It can only be changed in multiples of **4096** (0, 4096 … 61440)."},
    {"id": "d20-c06", "front": "How is the **root bridge** elected?", "back": "**Lowest Bridge ID**: lowest priority first, then the lowest MAC address."},
    {"id": "d20-c07", "front": "Port roles on the root bridge?", "back": "**All its ports are designated** (forwarding). The root bridge has no root port."},
    {"id": "d20-c08", "front": "How does a non-root switch choose its **root port**?", "back": "1. Lowest **root cost** · 2. Lowest **neighbor Bridge ID** · 3. Lowest **neighbor port ID**"},
    {"id": "d20-c09", "front": "How is the **designated port** chosen on each link?", "back": "The port on the switch with the lowest **root cost** to the root; tie → lowest Bridge ID. The other end becomes **non-designated** (blocking)."},
    {"id": "d20-c10", "front": "Classic STP port costs?", "back": "10 Mbps **100** · 100 Mbps **19** · 1 Gbps **4** · 10 Gbps **2**"},
    {"id": "d20-c11", "front": "How is **root cost** calculated?", "back": "Add up the costs of the ports along the path toward the root, i.e. each switch's port facing the root (root bridge = 0)."},
    {"id": "d20-c12", "front": "What is the **port ID**?", "back": "**Port priority** (default **128**) + port number, e.g. `128.1`. Lowest wins in ties."},
    {"id": "d20-c13", "front": "What does a **blocking** port do with BPDUs?", "back": "It **receives** BPDUs (to detect changes) but doesn't send them, and doesn't forward user frames or learn MACs."},
    {"id": "d20-c14", "front": "Which switch originates BPDUs in classic STP after convergence?", "back": "Only the **root bridge**. Other switches relay its BPDUs out of their designated ports."}
  ],
  "questions": [
    {"id": "d20-q01", "type": "single", "q": "Which switch becomes root? SW1: 32769 / 0011.1111.1111 · SW2: 24577 / 0022.2222.2222 · SW3: 32769 / 0000.0000.0001", "options": ["SW1", "SW2", "SW3", "None; it's a tie"], "answer": [1], "explain": "Priority is compared first: 24577 beats 32769, no matter how low SW3's MAC is."},
    {"id": "d20-q02", "type": "single", "q": "What is the default bridge priority of a switch in VLAN 10?", "options": ["32768", "32769", "32778", "4106"], "answer": [2], "explain": "32768 + extended system ID 10 = 32778."},
    {"id": "d20-q03", "type": "single", "q": "Which value is a valid configured bridge priority?", "options": ["1000", "8192", "32769", "50000"], "answer": [1], "explain": "Priorities must be multiples of 4096; 32769 is a displayed value (32768 + VLAN 1), not a configurable one."},
    {"id": "d20-q04", "type": "single", "q": "What is the classic STP cost of a 1 Gbps interface?", "options": ["1", "2", "4", "19"], "answer": [2], "explain": "10M = 100, 100M = 19, 1G = 4, 10G = 2."},
    {"id": "d20-q05", "type": "single", "q": "A non-root switch has two paths to the root with equal root cost. What decides its root port?", "options": ["Lowest local port number", "Lowest neighbor Bridge ID", "Highest bandwidth", "Lowest MAC on the local switch"], "answer": [1], "explain": "Order: root cost → neighbor Bridge ID → neighbor port ID."},
    {"id": "d20-q06", "type": "single", "q": "What happens if two switches are connected by two links and STP is disabled?", "options": ["The links load-balance", "A broadcast storm builds up as frames loop", "The switches shut one link down", "Nothing; switches drop duplicates"], "answer": [1], "explain": "Ethernet frames have no TTL, so they loop forever."},
    {"id": "d20-q07", "type": "multi", "q": "Which two values make up the Bridge ID? (Choose two.)", "options": ["Bridge priority (with extended system ID)", "MAC address", "IP address", "Port number", "Hostname"], "answer": [0, 1], "explain": "Bridge ID = priority + extended system ID + MAC."},
    {"id": "d20-q08", "type": "single", "q": "SW3 reaches the root bridge over two 1 Gbps links in a row (SW3 → SW2 → root). What is SW3's root cost?", "options": ["2", "4", "8", "19"], "answer": [2], "explain": "4 + 4 = 8."},
    {"id": "d20-q09", "type": "single", "q": "What role do the ports on the root bridge have?", "options": ["Root", "Designated", "Non-designated", "Alternate"], "answer": [1], "explain": "Every port on the root bridge is designated (forwarding)."},
    {"id": "d20-q10", "type": "multi", "q": "Which two statements about a blocking STP port are true? (Choose two.)", "options": ["It still receives BPDUs", "It doesn't forward user frames", "It sends BPDUs every 2 seconds", "It learns MAC addresses", "It forwards broadcasts"], "answer": [0, 1], "explain": "Blocking ports only listen for BPDUs, so they can react if the topology changes."}
  ]
});
