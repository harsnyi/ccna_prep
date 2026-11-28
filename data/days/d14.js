CCNA.addDay("d14", {
  "cards": [
    {"id": "d14-c01", "front": "Split 192.168.1.0/24 into 4 equal subnets: prefix and subnet IDs?", "back": "2 borrowed bits → **/26**, block 64: .0, .64, .128, .192 (62 hosts each)."},
    {"id": "d14-c02", "front": "How many subnets does borrowing s bits create?", "back": "**2^s**. A /24 split into /27s borrows 3 bits → 8 subnets."},
    {"id": "d14-c03", "front": "How many /28 subnets fit in a /24?", "back": "2^(28 − 24) = **16** subnets of 14 usable hosts."},
    {"id": "d14-c04", "front": "How many /30 subnets fit in a /24?", "back": "2^6 = **64** subnets of 2 usable hosts."},
    {"id": "d14-c05", "front": "172.16.0.0/16 split into /20s: number of subnets, step, hosts?", "back": "**16** subnets, stepping by **16 in the 3rd octet** (172.16.0.0, .16.0, .32.0 …), **4,094** hosts each."},
    {"id": "d14-c06", "front": "What does 172.16.0.0/23 cover?", "back": "172.16.0.0 – 172.16.**1**.255 (two /24s' worth): 510 usable hosts."},
    {"id": "d14-c07", "front": "Is 172.16.0.255 a valid host in 172.16.0.0/23?", "back": "**Yes.** Its broadcast is 172.16.1.255, so .0.255 and .1.0 are ordinary hosts. A favourite trap."},
    {"id": "d14-c08", "front": "Need 50 subnets from 172.16.0.0/16 with the most hosts each: prefix?", "back": "2^6 = 64 ≥ 50 → borrow 6 → **/22** (1,022 hosts each)."},
    {"id": "d14-c09", "front": "Need 500 hosts per subnet: prefix?", "back": "2^9 − 2 = 510 ≥ 500 → **/23** (255.255.254.0)."},
    {"id": "d14-c10", "front": "How do you find the Nth subnet quickly?", "back": "Network = **(N − 1) × block size** in the interesting octet. The 10th /22 of 172.16.0.0/16 → 9 × 4 = 36 → 172.16.36.0/22."},
    {"id": "d14-c11", "front": "Are subnet zero and the last (all-ones) subnet usable?", "back": "Yes. Modern IOS allows them, and the exam counts them unless the question says otherwise."}
  ],
  "questions": [
    {"id": "d14-q01", "type": "single", "q": "192.168.5.0/24 must be split into 4 equal subnets as large as possible. Which mask?", "options": ["255.255.255.128", "255.255.255.192", "255.255.255.224", "255.255.255.240"], "answer": [1], "explain": "4 subnets → borrow 2 bits → /26 = 255.255.255.192."},
    {"id": "d14-q02", "type": "single", "q": "How many /28 subnets fit in one /24?", "options": ["8", "14", "16", "32"], "answer": [2], "explain": "2^(28 − 24) = 16."},
    {"id": "d14-q03", "type": "single", "q": "172.16.0.0/16 is split into /20 subnets. How many subnets result?", "options": ["4", "8", "16", "4094"], "answer": [2], "explain": "Borrow 4 bits: 2^4 = 16 subnets (each with 4,094 hosts)."},
    {"id": "d14-q04", "type": "single", "q": "Which is a valid host address in 172.16.4.0/22?", "options": ["172.16.4.0", "172.16.7.255", "172.16.5.255", "172.16.8.1"], "answer": [2], "explain": "The subnet runs 172.16.4.0 – 172.16.7.255, so 172.16.5.255 is an ordinary host. .4.0 is the network, .7.255 the broadcast, and .8.1 is in the next subnet."},
    {"id": "d14-q05", "type": "single", "q": "You need at least 50 subnets from 172.16.0.0/16, each as large as possible. Which prefix?", "options": ["/21", "/22", "/23", "/24"], "answer": [1], "explain": "2^6 = 64 ≥ 50 → /22. /21 gives only 32 subnets."},
    {"id": "d14-q06", "type": "single", "q": "What is the 10th subnet when 172.16.0.0/16 is split into /22s?", "options": ["172.16.36.0/22", "172.16.40.0/22", "172.16.10.0/22", "172.16.9.0/22"], "answer": [0], "explain": "Block 4 in the 3rd octet: (10 − 1) × 4 = 36."},
    {"id": "d14-q07", "type": "multi", "q": "Which two masks provide at least 500 usable hosts per subnet? (Choose two.)", "options": ["255.255.254.0", "255.255.252.0", "255.255.255.0", "255.255.255.128", "255.255.255.192"], "answer": [0, 1], "explain": "/23 = 510 and /22 = 1,022 hosts. /24 gives only 254."},
    {"id": "d14-q08", "type": "single", "q": "What is the broadcast address of 172.16.100.0/23?", "options": ["172.16.100.255", "172.16.101.255", "172.16.99.255", "172.16.102.255"], "answer": [1], "explain": "/23 → block 2 in the 3rd octet: 100–101, so the broadcast is 172.16.101.255."},
    {"id": "d14-q09", "type": "single", "q": "How many usable hosts does a /19 provide?", "options": ["4,094", "8,190", "8,192", "16,382"], "answer": [1], "explain": "2^13 − 2 = 8,190."},
    {"id": "d14-q10", "type": "multi", "q": "Which two are valid /26 subnet IDs inside 192.168.1.0/24? (Choose two.)", "options": ["192.168.1.64", "192.168.1.192", "192.168.1.32", "192.168.1.96", "192.168.1.100"], "answer": [0, 1], "explain": "/26 subnets start at multiples of 64: .0, .64, .128, .192."}
  ]
});
