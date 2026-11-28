CCNA.addDay("d18", {
  "cards": [
    {"id": "d18-c01", "front": "Two ways to configure the native VLAN on a ROAS router?", "back": "1. `encapsulation dot1q <vlan> native` on a subinterface · 2. Put the native VLAN's IP on the **physical** interface (no encapsulation command)."},
    {"id": "d18-c02", "front": "What is a **multilayer switch**?", "back": "A switch that can also **route** (Layer 3 aware): it does inter-VLAN routing itself, without an external router."},
    {"id": "d18-c03", "front": "What is an **SVI**?", "back": "Switch Virtual Interface: a virtual routed interface for a VLAN (`interface vlan 10`). Its IP is the VLAN's default gateway."},
    {"id": "d18-c04", "front": "Which command enables routing on a multilayer switch?", "back": "**`ip routing`** (global config). Without it the switch doesn't route between SVIs."},
    {"id": "d18-c05", "front": "How do you turn a switch port into a routed port?", "back": "**`no switchport`** in interface config, then give it an IP address."},
    {"id": "d18-c06", "front": "Default state of an SVI?", "back": "**Shut down**, so it needs `no shutdown`."},
    {"id": "d18-c07", "front": "When is an SVI up/up?", "back": "The VLAN exists · at least one access port in it **or** a trunk allowing it is up/up · the VLAN isn't shut down · the SVI isn't shut down."},
    {"id": "d18-c08", "front": "How does a multilayer switch reach the Internet through R1?", "back": "A default route: `ip route 0.0.0.0 0.0.0.0 <R1's IP on the routed link>`."},
    {"id": "d18-c09", "front": "How do you reset an interface to its default configuration?", "back": "`default interface g0/1` (global config)."},
    {"id": "d18-c10", "front": "How do you delete a subinterface?", "back": "`no interface g0/0.10` (global config)."},
    {"id": "d18-c11", "front": "Why use SVIs instead of router-on-a-stick?", "back": "Routing happens on the switch itself, so inter-VLAN traffic doesn't have to cross a single trunk link to an external router and back."}
  ],
  "questions": [
    {"id": "d18-q01", "type": "single", "q": "Which global command enables routing between SVIs on a multilayer switch?", "options": ["ip routing", "routing enable", "ip forward", "switchport routing"], "answer": [0], "explain": "Without `ip routing` the SVIs exist, but the switch doesn't route between them."},
    {"id": "d18-q02", "type": "single", "q": "Which command turns a multilayer switch port into a routed port?", "options": ["switchport mode routed", "no switchport", "ip routing", "switchport mode access"], "answer": [1], "explain": "`no switchport` makes it a Layer 3 interface that takes an IP address."},
    {"id": "d18-q03", "type": "single", "q": "`interface vlan 40` was created and given `no shutdown`, but stays down/down. VLAN 40 exists. What is the most likely cause?", "options": ["`ip routing` is missing", "No access port in VLAN 40 (or trunk allowing it) is up/up", "The SVI needs a MAC address", "SVIs only work for VLAN 1"], "answer": [1], "explain": "An SVI needs at least one active port in its VLAN."},
    {"id": "d18-q04", "type": "single", "q": "How do you make subinterface g0/0.10 the native VLAN 10 on a ROAS router?", "options": ["encapsulation dot1q 10", "encapsulation dot1q 10 native", "switchport trunk native vlan 10", "native vlan 10"], "answer": [1], "explain": "Without `native`, the router would tag VLAN 10 frames."},
    {"id": "d18-q05", "type": "single", "q": "Which command creates the SVI for VLAN 10?", "options": ["vlan 10", "interface vlan 10", "svi 10", "interface g0/0.10"], "answer": [1], "explain": "`interface vlan 10` creates (or enters) the SVI."},
    {"id": "d18-q06", "type": "single", "q": "What is the default state of a newly created SVI?", "options": ["up/up", "Administratively down", "err-disabled", "Up only if `ip routing` is on"], "answer": [1], "explain": "SVIs are shut down by default."},
    {"id": "d18-q07", "type": "multi", "q": "Which two conditions are needed for an SVI to be up/up? (Choose two.)", "options": ["The VLAN exists on the switch", "An access port in the VLAN, or a trunk allowing it, is up/up", "`ip routing` is enabled", "The switch is a VTP server", "DTP is enabled"], "answer": [0, 1], "explain": "`ip routing` is needed for routing, not for the SVI to come up."},
    {"id": "d18-q08", "type": "single", "q": "Hosts in VLAN 10 use a multilayer switch for routing. What should their default gateway be?", "options": ["R1's LAN address", "The VLAN 10 SVI address", "The switch's management IP in VLAN 1", "0.0.0.0"], "answer": [1], "explain": "The SVI is the gateway for its VLAN."},
    {"id": "d18-q09", "type": "single", "q": "Which command returns G0/1 to its factory default configuration?", "options": ["reset interface g0/1", "default interface g0/1", "no interface g0/1", "erase interface g0/1"], "answer": [1], "explain": "`no interface` only works for logical interfaces such as subinterfaces."},
    {"id": "d18-q10", "type": "multi", "q": "Which two are advantages of SVIs over router-on-a-stick? (Choose two.)", "options": ["Inter-VLAN traffic doesn't cross one trunk to an external router and back", "No separate router is needed for inter-VLAN routing", "`ip routing` isn't needed", "SVIs are always up", "It works on any Layer 2-only switch"], "answer": [0, 1], "explain": "SVIs need a multilayer switch and `ip routing`."}
  ]
});
