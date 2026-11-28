CCNA.addDay("d27", {
  "cards": [
    {"id": "d27-c01", "front": "OSPF cost formula?", "back": "**Reference bandwidth ÷ interface bandwidth**. Default reference = **100 Mbps**; anything below 1 becomes **1**."},
    {"id": "d27-c02", "front": "Default OSPF costs?", "back": "10 Mbps = **10** · 100 Mbps = **1** · 1 Gbps = **1** · 10 Gbps = **1** · Loopback = 1"},
    {"id": "d27-c03", "front": "How do you make OSPF tell fast links apart?", "back": "`auto-cost reference-bandwidth 100000` (in **Mbps**, router config) on **all** OSPF routers. Then FastEthernet = 1000, Gigabit = 100."},
    {"id": "d27-c04", "front": "Three ways to change OSPF cost?", "back": "1. `auto-cost reference-bandwidth` (router config) · 2. `ip ospf cost <n>` (**interface** config, overrides the formula) · 3. `bandwidth <kbps>` (**interface** config; not recommended, other protocols use it too)"},
    {"id": "d27-c05", "front": "Does `bandwidth` change an interface's speed?", "back": "**No.** It only changes the value used in metric calculations (in **kbps**). `speed` changes the actual speed."},
    {"id": "d27-c06", "front": "How is an OSPF route's cost calculated?", "back": "The **sum of the outgoing interface costs** along the path to the destination."},
    {"id": "d27-c07", "front": "OSPF Hello: destination, interval, dead interval?", "back": "To **224.0.0.5**; hello **10 s**, dead **40 s** on Ethernet. OSPF is IP protocol **89**."},
    {"id": "d27-c08", "front": "OSPF neighbor states in order?", "back": "Down → Init → **2-Way** → ExStart → Exchange → Loading → **Full**"},
    {"id": "d27-c09", "front": "What happens in Init and 2-Way?", "back": "Init: a Hello was received, but it doesn't list my router ID yet. 2-Way: both see their own RID in the other's Hello, so they're neighbors (DR/BDR elected here)."},
    {"id": "d27-c10", "front": "What happens in ExStart, Exchange and Loading?", "back": "ExStart: higher RID = **master**. Exchange: **DBD** packets list LSA headers. Loading: **LSR** asks for missing LSAs, **LSU** sends them, **LSAck** confirms."},
    {"id": "d27-c11", "front": "How do you enable OSPF directly on an interface?", "back": "`ip ospf 1 area 0` (interface config). It shows in `show ip protocols` as \"Routing on Interfaces Configured Explicitly\"."},
    {"id": "d27-c12", "front": "How do you make all interfaces passive except one?", "back": "`passive-interface default` then `no passive-interface g0/0` (router config)."}
  ],
  "questions": [
    {"id": "d27-q01", "type": "single", "q": "With the default reference bandwidth, what is the OSPF cost of a 10 Mbps interface?", "options": ["1", "10", "100", "19"], "answer": [1], "explain": "100 / 10 = 10."},
    {"id": "d27-q02", "type": "single", "q": "With the default reference bandwidth, what are the costs of FastEthernet and GigabitEthernet?", "options": ["1 and 1", "19 and 4", "10 and 1", "1000 and 100"], "answer": [0], "explain": "Both are ≥ 100 Mbps, so both are rounded to 1. That's why the reference bandwidth should be raised."},
    {"id": "d27-q03", "type": "single", "q": "After `auto-cost reference-bandwidth 100000`, what is the cost of a GigabitEthernet interface?", "options": ["1", "10", "100", "1000"], "answer": [2], "explain": "100,000 Mbps / 1,000 Mbps = 100."},
    {"id": "d27-q04", "type": "single", "q": "In which mode is `ip ospf cost 50` configured?", "options": ["Router config", "Interface config", "Global config", "Privileged EXEC"], "answer": [1], "explain": "It overrides the calculated cost of that interface only."},
    {"id": "d27-q05", "type": "single", "q": "What does the `bandwidth 10000` interface command change?", "options": ["The interface speed to 10 Mbps", "The bandwidth value (10 Mbps, in kbps) used for metric calculations", "The OSPF reference bandwidth", "The duplex setting"], "answer": [1], "explain": "It doesn't affect the real link speed."},
    {"id": "d27-q06", "type": "single", "q": "Which OSPF neighbor state means both routers see their own router ID in each other's Hellos?", "options": ["Init", "2-Way", "ExStart", "Full"], "answer": [1], "explain": "In Init only one side has seen the other."},
    {"id": "d27-q07", "type": "single", "q": "In which OSPF state do routers exchange DBD packets listing LSA headers?", "options": ["Init", "ExStart", "Exchange", "Loading"], "answer": [2], "explain": "ExStart picks master/slave; Exchange sends the DBDs; Loading requests the missing LSAs."},
    {"id": "d27-q08", "type": "multi", "q": "Which two are default OSPF timers on Ethernet? (Choose two.)", "options": ["Hello 10 seconds", "Dead 40 seconds", "Hello 30 seconds", "Dead 120 seconds", "Hello 5 seconds"], "answer": [0, 1], "explain": "30/120 are the NBMA defaults; 5 s is EIGRP's hello."},
    {"id": "d27-q09", "type": "single", "q": "R1 → R2 over a 1 Gbps link, then R2 → R3's LAN over 100 Mbps, with reference bandwidth 100000. What is R1's cost to R3's LAN?", "options": ["2", "101", "1100", "200"], "answer": [2], "explain": "100 (Gigabit) + 1000 (FastEthernet) = 1100."},
    {"id": "d27-q10", "type": "multi", "q": "Which two commands make G0/1 the only non-passive OSPF interface? (Choose two.)", "options": ["passive-interface default", "no passive-interface g0/1", "passive-interface g0/1", "ip ospf passive", "no ip ospf 1 area 0"], "answer": [0, 1], "explain": "Make everything passive, then re-enable the one interface facing a neighbor."}
  ]
});
