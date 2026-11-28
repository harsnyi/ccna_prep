CCNA.addDay("d07", {
  "cards": [
    {"id": "d07-c01", "front": "Main functions of Layer 3 (Network)?", "back": "Connectivity between hosts on **different networks**, **logical (IP) addressing**, and **path selection**. Routers operate here."},
    {"id": "d07-c02", "front": "Do broadcasts cross a router?", "back": "**No.** Each router interface is a separate broadcast domain. Broadcasts stay in their LAN."},
    {"id": "d07-c03", "front": "Why does each router interface need its own IP address?", "back": "Each interface connects a different network and acts as the **default gateway** for that network, e.g. G0/0 192.168.1.254/24 and G0/1 192.168.2.254/24."},
    {"id": "d07-c04", "front": "How long is an IPv4 address, and how is it written?", "back": "**32 bits** = 4 **octets** of 8 bits, written in **dotted decimal** (0–255 per octet)."},
    {"id": "d07-c05", "front": "Binary place values in an octet?", "back": "128 · 64 · 32 · 16 · 8 · 4 · 2 · 1"},
    {"id": "d07-c06", "front": "Convert `10001111` to decimal.", "back": "128 + 8 + 4 + 2 + 1 = **143**"},
    {"id": "d07-c07", "front": "Convert 221 to binary.", "back": "`11011101` (128 + 64 + 16 + 8 + 4 + 1)"},
    {"id": "d07-c08", "front": "Quick trick: 207 in binary?", "back": "255 − 207 = 48 = 32 + 16, so those two bits are 0: `11001111`."},
    {"id": "d07-c09", "front": "What does the prefix length (/x) mean?", "back": "The first **x bits** are the **network** portion; the remaining 32 − x bits are the **host** portion."},
    {"id": "d07-c10", "front": "Class A: leading bit(s), first-octet range, default mask?", "back": "Leading **0** · 1 – 126 (127 is reserved for loopback) · **/8** 255.0.0.0"},
    {"id": "d07-c11", "front": "Class B: leading bits, first-octet range, default mask?", "back": "Leading **10** · 128 – 191 · **/16** 255.255.0.0"},
    {"id": "d07-c12", "front": "Class C: leading bits, first-octet range, default mask?", "back": "Leading **110** · 192 – 223 · **/24** 255.255.255.0"},
    {"id": "d07-c13", "front": "Classes D and E?", "back": "D: leading **1110**, 224 – 239, **multicast**. E: leading **1111**, 240 – 255, **experimental/reserved**."},
    {"id": "d07-c14", "front": "What is 127.0.0.0/8 used for?", "back": "**Loopback**: testing the host's own network stack (e.g. ping 127.0.0.1)."},
    {"id": "d07-c15", "front": "What is the **network address**?", "back": "All **host bits 0**, e.g. 192.168.1.0/24. It identifies the network and **can't be assigned** to a host."},
    {"id": "d07-c16", "front": "What is the **broadcast address**?", "back": "All **host bits 1**, e.g. 192.168.1.255/24 (sent in a frame to MAC FFFF.FFFF.FFFF). It **can't be assigned** to a host."},
    {"id": "d07-c17", "front": "Usable host addresses in a /24?", "back": "2^8 − 2 = **254** (.1 – .254)"}
  ],
  "questions": [
    {"id": "d07-q01", "type": "single", "q": "Convert `11000000.10101000.00000001.11111110` to dotted decimal.", "options": ["192.168.1.254", "192.168.1.255", "192.170.1.254", "196.168.1.254"], "answer": [0], "explain": "11000000 = 192, 10101000 = 168, 00000001 = 1, 11111110 = 254."},
    {"id": "d07-q02", "type": "single", "q": "Which class is 154.78.111.32?", "options": ["Class A", "Class B", "Class C", "Class D"], "answer": [1], "explain": "A first octet of 128–191 is class B (leading bits 10)."},
    {"id": "d07-q03", "type": "single", "q": "What is the broadcast address of 192.168.1.0/24?", "options": ["192.168.1.0", "192.168.1.254", "192.168.1.255", "255.255.255.255"], "answer": [2], "explain": "All 8 host bits set to 1 gives .255."},
    {"id": "d07-q04", "type": "single", "q": "Which first-octet range is class C?", "options": ["1 – 126", "128 – 191", "192 – 223", "224 – 239"], "answer": [2], "explain": "Class C addresses start with the bits 110, so the first octet is 192–223."},
    {"id": "d07-q05", "type": "single", "q": "Which address can **not** be assigned to a host in 10.0.0.0/8?", "options": ["10.0.0.1", "10.128.0.0", "10.255.255.254", "10.255.255.255"], "answer": [3], "explain": "10.255.255.255 is the broadcast address (all 24 host bits are 1). 10.128.0.0 is a normal host address inside a /8."},
    {"id": "d07-q06", "type": "single", "q": "Why isn't 127.x.x.x used as a normal class A network?", "options": ["It's reserved for multicast", "It's reserved for loopback", "It's reserved for APIPA", "It's the class A broadcast range"], "answer": [1], "explain": "127.0.0.0/8 is loopback: traffic to it never leaves the host."},
    {"id": "d07-q07", "type": "multi", "q": "Two LANs, 192.168.1.0/24 and 192.168.2.0/24, are connected through a router. Which two statements are true? (Choose two.)", "options": ["They are separate broadcast domains", "Hosts in one LAN need the router to reach the other LAN", "They are the same subnet because both are /24", "Broadcasts from one LAN are forwarded into the other", "Hosts can communicate directly using ARP across the router"], "answer": [0, 1], "explain": "Routers separate broadcast domains and route between networks. ARP and broadcasts stay local."},
    {"id": "d07-q08", "type": "single", "q": "What is 207 in binary?", "options": ["11001111", "11011111", "11001011", "10101111"], "answer": [0], "explain": "128 + 64 + 8 + 4 + 2 + 1 = 207. Or: 255 − 207 = 48 = 32 + 16, so those two bits are 0."},
    {"id": "d07-q09", "type": "single", "q": "How many usable host addresses does a class C network have with its default mask?", "options": ["254", "255", "256", "65 534"], "answer": [0], "explain": "/24 leaves 8 host bits: 2^8 − 2 = 254 (minus the network and broadcast addresses)."},
    {"id": "d07-q10", "type": "multi", "q": "Which two statements about IPv4 classes D and E are true? (Choose two.)", "options": ["Class D (224–239) is used for multicast", "Class E (240–255) is reserved for experimental use", "Class D addresses start with the bits 110", "Class E is used for private addressing", "Class D covers 192–223"], "answer": [0, 1], "explain": "D = 1110…, 224–239, multicast. E = 1111…, 240–255, experimental. 110 / 192–223 is class C. Private ranges are RFC 1918, not class E."}
  ]
});
