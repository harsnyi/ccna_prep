CCNA.addDay("d10", {
  "cards": [
    {"id": "d10-c01", "front": "IPv4 header size: minimum and maximum?", "back": "**20 bytes** without options, up to **60 bytes** with options."},
    {"id": "d10-c02", "front": "Version field values?", "back": "4 bits: IPv4 = `0100` (4), IPv6 = `0110` (6)."},
    {"id": "d10-c03", "front": "What does **IHL** measure, and its range?", "back": "Internet Header Length, in **4-byte words**: minimum **5** (20 bytes), maximum **15** (60 bytes)."},
    {"id": "d10-c04", "front": "**DSCP** and **ECN**?", "back": "DSCP (6 bits): QoS marking, used to prioritise voice and video. ECN (2 bits): signals congestion without dropping packets (both ends and the network must support it)."},
    {"id": "d10-c05", "front": "**Total Length** field?", "back": "16 bits: header + data in bytes. Minimum **20**, maximum **65,535**."},
    {"id": "d10-c06", "front": "Which three fields handle **fragmentation**?", "back": "**Identification** (which original packet a fragment belongs to) · **Flags** · **Fragment Offset** (position in the original packet)"},
    {"id": "d10-c07", "front": "The three Flags bits?", "back": "Bit 0: reserved (always 0) · Bit 1: **DF** (Don't Fragment) · Bit 2: **MF** (More Fragments; 0 on the last fragment)"},
    {"id": "d10-c08", "front": "When are packets fragmented, and who reassembles them?", "back": "When a packet is larger than the link's **MTU** (usually **1500 bytes** on Ethernet). The **destination host** reassembles the fragments."},
    {"id": "d10-c09", "front": "What does **TTL** do?", "back": "8 bits. Each router **decrements it by 1**; at 0 the packet is dropped (and an ICMP Time Exceeded is sent back). This prevents endless loops. Recommended starting value: 64."},
    {"id": "d10-c10", "front": "Protocol field values to know?", "back": "**1** ICMP · **6** TCP · **17** UDP · **89** OSPF"},
    {"id": "d10-c11", "front": "What does the **Header Checksum** cover?", "back": "Only the **IPv4 header**, not the data. It's recalculated at every hop (because the TTL changes); a mismatch → drop. TCP/UDP check their own data."},
    {"id": "d10-c12", "front": "Source and Destination Address fields?", "back": "32 bits each: the IPv4 addresses of the original sender and the final receiver."},
    {"id": "d10-c13", "front": "When is the **Options** field present?", "back": "Only when IHL > 5 (0–40 bytes). Rarely used."},
    {"id": "d10-c14", "front": "Which IPv4 header fields does a router change when forwarding?", "back": "**TTL** (−1) and the **Header Checksum** (recalculated). The source and destination addresses stay the same (without NAT)."}
  ],
  "questions": [
    {"id": "d10-q01", "type": "single", "q": "The Protocol field of an IPv4 header contains 6. What is encapsulated?", "options": ["ICMP", "TCP", "UDP", "OSPF"], "answer": [1], "explain": "1 = ICMP, 6 = TCP, 17 = UDP, 89 = OSPF."},
    {"id": "d10-q02", "type": "single", "q": "What is the minimum size of an IPv4 header?", "options": ["8 bytes", "20 bytes", "40 bytes", "60 bytes"], "answer": [1], "explain": "20 bytes with no options (IHL = 5)."},
    {"id": "d10-q03", "type": "single", "q": "An IPv4 header has IHL = 5. What does that mean?", "options": ["The packet has 5 fragments", "The header is 20 bytes and has no options", "The TTL is 5", "The header is 5 bytes"], "answer": [1], "explain": "IHL counts 4-byte words: 5 × 4 = 20 bytes."},
    {"id": "d10-q04", "type": "single", "q": "Which IPv4 header field prevents packets from looping forever?", "options": ["Identification", "TTL", "Header Checksum", "Fragment Offset"], "answer": [1], "explain": "Each router decrements the TTL and drops the packet when it reaches 0."},
    {"id": "d10-q05", "type": "single", "q": "Which field marks packets for QoS treatment?", "options": ["ECN", "DSCP", "Protocol", "Flags"], "answer": [1], "explain": "DSCP (6 bits) carries the QoS class."},
    {"id": "d10-q06", "type": "single", "q": "What is the maximum IPv4 header length?", "options": ["20 bytes", "40 bytes", "60 bytes", "65,535 bytes"], "answer": [2], "explain": "IHL max 15 × 4 bytes = 60 bytes."},
    {"id": "d10-q07", "type": "multi", "q": "Which two fields are used to reassemble a fragmented packet? (Choose two.)", "options": ["Identification", "Fragment Offset", "TTL", "DSCP", "Protocol"], "answer": [0, 1], "explain": "Identification groups the fragments; Fragment Offset orders them. (The MF flag marks the last one.)"},
    {"id": "d10-q08", "type": "single", "q": "Which protocol uses IPv4 protocol number 89?", "options": ["EIGRP", "OSPF", "ICMP", "UDP"], "answer": [1], "explain": "OSPF runs directly over IP with protocol 89 (EIGRP is 88)."},
    {"id": "d10-q09", "type": "multi", "q": "Which two IPv4 header fields does a router modify when it forwards a packet? (Choose two.)", "options": ["TTL", "Header Checksum", "Source Address", "Destination Address", "Total Length"], "answer": [0, 1], "explain": "TTL drops by one, so the header checksum must be recalculated. The addresses don't change (unless NAT is used)."},
    {"id": "d10-q10", "type": "single", "q": "What does the IPv4 Header Checksum protect?", "options": ["The whole packet", "Only the IPv4 header", "Only the data", "The Ethernet frame"], "answer": [1], "explain": "The data is protected by the TCP/UDP checksum; Ethernet frames by the FCS."}
  ]
});
