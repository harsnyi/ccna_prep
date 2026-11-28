CCNA.addDay("d15", {
  "cards": [
    {"id": "d15-c01", "front": "**FLSM** vs **VLSM**?", "back": "FLSM (Fixed-Length Subnet Masks): every subnet uses the same prefix. VLSM (Variable-Length): subnets of different sizes inside one block, so less waste."},
    {"id": "d15-c02", "front": "VLSM procedure?", "back": "1. Size each segment · 2. Sort them **largest first** · 3. Give each the next free address · 4. Next free = previous broadcast + 1."},
    {"id": "d15-c03", "front": "Why allocate the largest subnet first?", "back": "Each subnet must start on a multiple of its own block size. Going largest first keeps every later block aligned, with no gaps or overlaps."},
    {"id": "d15-c04", "front": "VLSM example 192.168.1.0/24: the 110-host LAN?", "back": "**/25**: 192.168.1.0 – .127 (hosts .1 – .126)."},
    {"id": "d15-c05", "front": "VLSM example: the 45-host LAN after the /25?", "back": "**/26**: 192.168.1.128 – .191 (hosts .129 – .190)."},
    {"id": "d15-c06", "front": "VLSM example: the 29-host LAN after that?", "back": "**/27**: 192.168.1.192 – .223 (hosts .193 – .222)."},
    {"id": "d15-c07", "front": "VLSM example: the 8-host LAN, then the point-to-point link?", "back": "**/28** 192.168.1.224 – .239, then **/30** 192.168.1.240 – .243 (hosts .241 – .242)."},
    {"id": "d15-c08", "front": "10.0.0.0/8 needs 2,000 subnets: prefix and hosts?", "back": "2^11 = 2,048 ≥ 2,000 → borrow 11 → **/19** (255.255.224.0), 2^13 − 2 = **8,190** hosts each."},
    {"id": "d15-c09", "front": "Effect of changing the prefix by one bit?", "back": "One bit shorter (e.g. /26 → /25) **doubles** the addresses; one bit longer **halves** them."},
    {"id": "d15-c10", "front": "Best prefix for a router-to-router link?", "back": "**/30** (2 usable hosts), or **/31** where supported (both addresses usable)."}
  ],
  "questions": [
    {"id": "d15-q01", "type": "single", "q": "10.0.0.0/8 must provide at least 2,000 subnets. Which prefix gives the most hosts per subnet?", "options": ["/18", "/19", "/20", "/21"], "answer": [1], "explain": "2^11 = 2,048 ≥ 2,000 → /8 + 11 = /19. /18 gives only 1,024 subnets."},
    {"id": "d15-q02", "type": "single", "q": "VLSM on 192.168.1.0/24: 192.168.1.0/25 and 192.168.1.128/26 are used. Where does a 29-host subnet go?", "options": ["192.168.1.160/27", "192.168.1.192/27", "192.168.1.192/26", "192.168.1.224/27"], "answer": [1], "explain": "29 hosts → /27 (30 usable). The next free address is .192, which is aligned to 32."},
    {"id": "d15-q03", "type": "single", "q": "Which prefix is the smallest subnet for 110 hosts?", "options": ["/24", "/25", "/26", "/27"], "answer": [1], "explain": "2^7 − 2 = 126 ≥ 110; /26 gives only 62."},
    {"id": "d15-q04", "type": "single", "q": "In which order should VLSM subnets be allocated?", "options": ["Smallest first", "Largest first", "Alphabetically by site", "In any order"], "answer": [1], "explain": "Largest first keeps every block aligned without gaps or overlaps."},
    {"id": "d15-q05", "type": "single", "q": "A LAN needs 8 hosts. Which prefix is the most efficient?", "options": ["/29", "/28", "/27", "/30"], "answer": [1], "explain": "/29 gives only 6 usable hosts; /28 gives 14."},
    {"id": "d15-q06", "type": "single", "q": "What does VLSM mean?", "options": ["All subnets use the same prefix", "Subnets of different prefix lengths inside one address block", "Using only classful masks", "Splitting VLANs across switches"], "answer": [1], "explain": "Variable-Length Subnet Masks."},
    {"id": "d15-q07", "type": "multi", "q": "Which two are valid /27 network addresses? (Choose two.)", "options": ["192.168.1.192", "192.168.1.224", "192.168.1.200", "192.168.1.208", "192.168.1.250"], "answer": [0, 1], "explain": "/27 networks start at multiples of 32: …160, 192, 224."},
    {"id": "d15-q08", "type": "single", "q": "The last allocated subnet is 192.168.1.224/28. What is the next free address?", "options": ["192.168.1.225", "192.168.1.239", "192.168.1.240", "192.168.1.256"], "answer": [2], "explain": "The /28 ends at .239 (broadcast), so the next block starts at .240."},
    {"id": "d15-q09", "type": "single", "q": "How many usable addresses does a /30 point-to-point link provide?", "options": ["1", "2", "4", "6"], "answer": [1], "explain": "4 addresses − network − broadcast = 2."},
    {"id": "d15-q10", "type": "single", "q": "Changing a subnet from /25 to /26 changes its usable hosts from 126 to:", "options": ["30", "62", "64", "254"], "answer": [1], "explain": "One bit longer halves the addresses: 64 − 2 = 62."}
  ]
});
