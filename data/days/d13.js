CCNA.addDay("d13", {
  "cards": [
    {"id": "d13-c01", "front": "Why was **CIDR** introduced, and when?", "back": "**1993**, by the IETF. It replaced fixed class sizes (/8, /16, /24), which wasted addresses. Networks can now be split into subnets of any size."},
    {"id": "d13-c02", "front": "Classful waste example?", "back": "A company needing ~5,000 addresses got a class B (65,534 hosts), leaving ~60,000 unused."},
    {"id": "d13-c03", "front": "Usable hosts formula?", "back": "**2^n − 2**, where n = host bits (32 − prefix)."},
    {"id": "d13-c04", "front": "203.0.113.0/25: mask and usable hosts?", "back": "255.255.255.**128**, 2^7 − 2 = **126**"},
    {"id": "d13-c05", "front": "203.0.113.0/28: mask, block size and usable hosts?", "back": "255.255.255.**240**, block **16**, **14** usable"},
    {"id": "d13-c06", "front": "Block sizes for /25 – /32 (4th octet)?", "back": "/25 128 · /26 64 · /27 32 · /28 16 · /29 8 · /30 4 · /31 2 · /32 1. Mask octet = 256 − block size."},
    {"id": "d13-c07", "front": "What are /31 and /32 used for?", "back": "/31: **point-to-point** links (both addresses usable). /32: a single host (loopbacks, host routes)."},
    {"id": "d13-c08", "front": "Block-size method in one line?", "back": "Step through multiples of the block size in the interesting octet. The last multiple ≤ the address is the **network**; the next multiple − 1 is the **broadcast**."},
    {"id": "d13-c09", "front": "10.4.77.188/19: network and broadcast?", "back": "Mask 255.255.**224**.0, block 32 in the 3rd octet → 64 ≤ 77 < 96 → **10.4.64.0** / **10.4.95.255** (8,192 addresses)."},
    {"id": "d13-c10", "front": "154.219.154.180/20: network and broadcast?", "back": "Block 16 in the 3rd octet → 144 ≤ 154 < 160 → **154.219.144.0** / **154.219.159.255**, 4,094 usable."},
    {"id": "d13-c11", "front": "84.75.21.6/10: network and broadcast?", "back": "Mask 255.**192**.0.0, block 64 in the 2nd octet → **84.64.0.0** / **84.127.255.255**, 4,194,302 usable."},
    {"id": "d13-c12", "front": "How many subnets do you get by borrowing s bits?", "back": "**2^s**, e.g. splitting a /24 into /26s borrows 2 bits → 4 subnets."}
  ],
  "questions": [
    {"id": "d13-q01", "type": "single", "q": "How many usable host addresses does 203.0.113.0/25 have?", "options": ["62", "126", "128", "254"], "answer": [1], "explain": "7 host bits: 2^7 − 2 = 126."},
    {"id": "d13-q02", "type": "single", "q": "What is the network address of 10.4.77.188/19?", "options": ["10.4.0.0", "10.4.64.0", "10.4.72.0", "10.4.77.0"], "answer": [1], "explain": "/19 = 255.255.224.0, block 32 in the 3rd octet: 64 ≤ 77 < 96."},
    {"id": "d13-q03", "type": "single", "q": "What is the broadcast address of 154.219.154.180/20?", "options": ["154.219.154.255", "154.219.159.255", "154.219.144.255", "154.219.255.255"], "answer": [1], "explain": "Block 16 in the 3rd octet: network 154.219.144.0, broadcast 144 + 16 − 1 = 159 → 154.219.159.255."},
    {"id": "d13-q04", "type": "single", "q": "What is the subnet mask for /28?", "options": ["255.255.255.224", "255.255.255.240", "255.255.255.248", "255.255.240.0"], "answer": [1], "explain": "/28 = 28 ones; 4th octet 11110000 = 240."},
    {"id": "d13-q05", "type": "single", "q": "What is the network address of 84.75.21.6/10?", "options": ["84.0.0.0", "84.64.0.0", "84.72.0.0", "84.75.0.0"], "answer": [1], "explain": "/10 = 255.192.0.0, block 64 in the 2nd octet: 64 ≤ 75 < 128."},
    {"id": "d13-q06", "type": "single", "q": "How many usable host addresses does a /30 provide?", "options": ["1", "2", "4", "6"], "answer": [1], "explain": "2^2 − 2 = 2, the classic point-to-point size (/31 is the even tighter option)."},
    {"id": "d13-q07", "type": "multi", "q": "Which two are valid host addresses in 192.168.10.64/27? (Choose two.)", "options": ["192.168.10.65", "192.168.10.94", "192.168.10.64", "192.168.10.95", "192.168.10.96"], "answer": [0, 1], "explain": "Range .64–.95: .64 is the network, .95 the broadcast, and .96 starts the next subnet."},
    {"id": "d13-q08", "type": "single", "q": "Why did the IETF introduce CIDR?", "options": ["To add more address classes", "To stop wasting addresses with fixed classful network sizes", "To replace IPv4 with IPv6", "To make addresses 64 bits long"], "answer": [1], "explain": "CIDR lets networks be any prefix length instead of only /8, /16 or /24."},
    {"id": "d13-q09", "type": "single", "q": "What is the block size of a /21 in the 3rd octet?", "options": ["4", "8", "16", "32"], "answer": [1], "explain": "/21 → 3rd octet mask 248 → 256 − 248 = 8."},
    {"id": "d13-q10", "type": "multi", "q": "Which two addresses are in the same subnet as 172.16.37.20/20? (Choose two.)", "options": ["172.16.32.1", "172.16.47.254", "172.16.48.1", "172.16.31.255", "172.16.16.0"], "answer": [0, 1], "explain": "/20 → block 16 in the 3rd octet: the subnet is 172.16.32.0 – 172.16.47.255."}
  ]
});
