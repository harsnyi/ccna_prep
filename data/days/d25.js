CCNA.addDay("d25", {
  "cards": [
    {"id": "d25-c01", "front": "RIP basics?", "back": "Distance vector IGP, industry standard. Metric: **hop count** (max **15**; 16 = unreachable). AD **120**."},
    {"id": "d25-c02", "front": "RIP timers?", "back": "Updates every **30 s** · invalid 180 s · holddown 180 s · flush 240 s"},
    {"id": "d25-c03", "front": "RIPv1 vs RIPv2?", "back": "v1: **classful** (no subnet mask in updates), broadcast to 255.255.255.255. v2: **classless** (VLSM/CIDR, sends masks), multicast to **224.0.0.9**. RIPng is for IPv6."},
    {"id": "d25-c04", "front": "What does RIP's `network 172.16.0.0` command do?", "back": "It's **classful**: RIP is enabled on every interface inside 172.16.0.0/16, and each interface's **own subnet** is advertised."},
    {"id": "d25-c05", "front": "RIP configuration commands?", "back": "`router rip` · `version 2` · `no auto-summary` · `network 10.0.0.0` · `passive-interface g0/2` · `default-information originate`"},
    {"id": "d25-c06", "front": "EIGRP basics?", "back": "Advanced distance vector (hybrid), originally Cisco-proprietary. Multicast **224.0.0.10**. AD **90** internal, **170** external. No hop limit."},
    {"id": "d25-c07", "front": "EIGRP metric (default K values)?", "back": "K1 = 1 (bandwidth), K3 = 1 (delay), others 0 → it uses the **slowest bandwidth** on the path plus the **sum of delays**."},
    {"id": "d25-c08", "front": "What must match for EIGRP neighbors?", "back": "The **AS number** (`router eigrp 100`), the K values, and the subnet (also authentication)."},
    {"id": "d25-c09", "front": "EIGRP `network` command?", "back": "Uses an optional **wildcard mask**: `network 10.0.0.0 0.0.0.255`. Without a wildcard it's classful."},
    {"id": "d25-c10", "front": "**Feasible distance** vs **reported distance**?", "back": "FD: **this** router's metric to the destination. RD (advertised distance): the **neighbor's** metric to it."},
    {"id": "d25-c11", "front": "**Successor** vs **feasible successor**?", "back": "Successor: the best route. Feasible successor: a backup whose **RD < the successor's FD** (the feasibility condition), so it's guaranteed loop-free."},
    {"id": "d25-c12", "front": "EIGRP unequal-cost load balancing?", "back": "Only EIGRP can do it: `variance 2` lets feasible successors with an FD up to 2× the successor's FD share traffic. The default is variance 1 (ECMP only, up to 4 paths)."},
    {"id": "d25-c13", "front": "EIGRP router ID order?", "back": "Manually configured → highest loopback IP → highest physical interface IP."}
  ],
  "questions": [
    {"id": "d25-q01", "type": "single", "q": "What is the maximum hop count of a reachable RIP route?", "options": ["10", "15", "16", "255"], "answer": [1], "explain": "16 hops = unreachable."},
    {"id": "d25-q02", "type": "single", "q": "Which multicast address does RIPv2 use?", "options": ["224.0.0.5", "224.0.0.9", "224.0.0.10", "255.255.255.255"], "answer": [1], "explain": "224.0.0.5 = OSPF, 224.0.0.10 = EIGRP; RIPv1 broadcasts."},
    {"id": "d25-q03", "type": "single", "q": "Why can't RIPv1 support VLSM?", "options": ["It uses hop count", "It doesn't include subnet masks in updates", "It only supports /8 networks", "It uses multicast"], "answer": [1], "explain": "RIPv1 is classful."},
    {"id": "d25-q04", "type": "single", "q": "Which multicast address does EIGRP use?", "options": ["224.0.0.5", "224.0.0.6", "224.0.0.9", "224.0.0.10"], "answer": [3], "explain": "224.0.0.10."},
    {"id": "d25-q05", "type": "single", "q": "R1 runs `router eigrp 100` and R2 runs `router eigrp 200` on the same link. Result?", "options": ["They form an adjacency", "No adjacency: the AS numbers must match", "They form an adjacency but exchange no routes", "R2 changes its AS automatically"], "answer": [1], "explain": "Unlike the OSPF process ID, the EIGRP AS number must match."},
    {"id": "d25-q06", "type": "single", "q": "Successor FD = 30. Route B has RD = 25 and FD = 40. Is route B a feasible successor?", "options": ["Yes, because RD 25 < successor FD 30", "No, because its FD 40 > 30", "No, because its RD isn't lower than its own FD", "Only if variance is 2"], "answer": [0], "explain": "The feasibility condition compares the backup's RD with the successor's FD."},
    {"id": "d25-q07", "type": "single", "q": "Which command lets EIGRP load-balance across feasible successors whose FD is up to twice the best FD?", "options": ["maximum-paths 2", "variance 2", "metric weights 2", "load-balance 2"], "answer": [1], "explain": "Only feasible successors qualify."},
    {"id": "d25-q08", "type": "single", "q": "What is RIP's default update interval?", "options": ["10 s", "30 s", "60 s", "90 s"], "answer": [1], "explain": "Full routing updates every 30 seconds."},
    {"id": "d25-q09", "type": "multi", "q": "Which two values does the EIGRP metric use with default K values? (Choose two.)", "options": ["Bandwidth (slowest link)", "Delay (sum along the path)", "Hop count", "Load", "Reliability"], "answer": [0, 1], "explain": "K1 (bandwidth) and K3 (delay) are 1; K2, K4 and K5 are 0."},
    {"id": "d25-q10", "type": "multi", "q": "Which two statements about EIGRP are true? (Choose two.)", "options": ["Internal routes have AD 90", "It supports unequal-cost load balancing", "It uses hop count with a limit of 15", "It is a link-state protocol", "Its AS number doesn't need to match between neighbors"], "answer": [0, 1], "explain": "EIGRP is advanced distance vector, with no hop limit, and its AS numbers must match."}
  ]
});
