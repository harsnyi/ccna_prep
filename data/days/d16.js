CCNA.addDay("d16", {
  "cards": [
    {"id": "d16-c01", "front": "What defines a **LAN** in VLAN terms?", "back": "A single **broadcast domain**: every device that receives a frame sent to FFFF.FFFF.FFFF."},
    {"id": "d16-c02", "front": "Problems with one big broadcast domain?", "back": "Lots of broadcast traffic (worse performance), and hosts reach each other directly at Layer 2, which **bypasses** router and firewall security policies."},
    {"id": "d16-c03", "front": "What is a **VLAN**?", "back": "A logical Layer 2 network on a switch, configured **per interface**. Each VLAN is its own broadcast domain."},
    {"id": "d16-c04", "front": "Benefits of VLANs?", "back": "Smaller broadcast domains (**performance**), traffic between groups must go through a router or firewall (**security**), and grouping by function rather than location."},
    {"id": "d16-c05", "front": "Can a switch forward frames between VLANs?", "back": "**No.** Inter-VLAN traffic must be routed by a router or a multilayer switch."},
    {"id": "d16-c06", "front": "Which VLANs exist by default and can't be deleted?", "back": "**VLAN 1** and **1002–1005** (5 VLANs)."},
    {"id": "d16-c07", "front": "How do you create VLAN 10 named ENGINEERING?", "back": "`vlan 10` (global config) → `name ENGINEERING` (VLAN config)."},
    {"id": "d16-c08", "front": "How do you make a port an access port in VLAN 10?", "back": "`switchport mode access` and `switchport access vlan 10` (interface config)."},
    {"id": "d16-c09", "front": "Which command lists VLANs and their access ports?", "back": "`show vlan brief`. **Trunk ports aren't listed.**"},
    {"id": "d16-c10", "front": "What does an **access port** carry?", "back": "Exactly **one VLAN**, untagged. It normally connects an end host."},
    {"id": "d16-c11", "front": "Typical VLAN ↔ subnet relationship?", "back": "**One VLAN = one IP subnet.**"}
  ],
  "questions": [
    {"id": "d16-q01", "type": "single", "q": "PC1 in VLAN 10 sends a broadcast on a switch with VLANs 10 and 20. Who receives it?", "options": ["Every device on the switch", "Only devices in VLAN 10", "Only devices in VLAN 20", "Only the default gateway"], "answer": [1], "explain": "Each VLAN is a separate broadcast domain."},
    {"id": "d16-q02", "type": "single", "q": "Which VLANs exist by default on a Cisco switch?", "options": ["1 only", "1 and 1002–1005", "1–1005", "1–4094"], "answer": [1], "explain": "VLAN 1 plus the four legacy FDDI/Token Ring VLANs 1002–1005."},
    {"id": "d16-q03", "type": "single", "q": "Which command assigns access port Fa0/5 to VLAN 10?", "options": ["vlan 10", "switchport access vlan 10", "switchport trunk vlan 10", "access-vlan 10"], "answer": [1], "explain": "In interface config mode, together with `switchport mode access`."},
    {"id": "d16-q04", "type": "single", "q": "Exhibit:\n```\nSW1# show vlan brief\nVLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Fa0/4, Fa0/5, Gi0/2\n10   ENGINEERING                      active    Fa0/1, Fa0/2\n20   HR                               active    Fa0/3\n```\nWhich VLAN is Fa0/3 in?", "options": ["1", "10", "20", "It's a trunk"], "answer": [2], "explain": "Fa0/3 is listed under VLAN 20 (HR)."},
    {"id": "d16-q05", "type": "single", "q": "Can a Layer 2 switch forward traffic between VLAN 10 and VLAN 20 by itself?", "options": ["Yes, switches forward between all VLANs", "No, inter-VLAN traffic must be routed", "Only if they're on the same switch", "Only for broadcasts"], "answer": [1], "explain": "Switches keep VLANs separate; routing needs a router or a multilayer switch."},
    {"id": "d16-q06", "type": "single", "q": "Which commands create VLAN 20 and name it HR?", "options": ["vlan 20 / name HR", "create vlan 20 HR", "switchport vlan 20 name HR", "vlan name 20 HR"], "answer": [0], "explain": "`vlan 20` in global config enters VLAN config mode, where `name HR` sets the name."},
    {"id": "d16-q07", "type": "multi", "q": "Which two are benefits of VLANs? (Choose two.)", "options": ["Smaller broadcast domains", "Better security by separating groups at Layer 2", "More collision domains per port", "Automatic routing between VLANs", "Larger MAC address tables"], "answer": [0, 1], "explain": "Each port is already its own collision domain; VLANs don't route by themselves."},
    {"id": "d16-q08", "type": "single", "q": "Which default VLANs can't be deleted?", "options": ["None", "Only VLAN 1", "VLAN 1 and 1002–1005", "Every VLAN below 1006"], "answer": [2], "explain": "These five always exist."},
    {"id": "d16-q09", "type": "single", "q": "How many VLANs can an access port carry?", "options": ["One, untagged", "Two, one tagged and one untagged", "Up to 4094, tagged", "None until a trunk is configured"], "answer": [0], "explain": "Carrying several VLANs needs a trunk (802.1Q tags)."},
    {"id": "d16-q10", "type": "multi", "q": "PC1 (VLAN 10) and PC2 (VLAN 20) must communicate. Which two solutions work? (Choose two.)", "options": ["Router-on-a-stick with subinterfaces", "A multilayer switch with SVIs and `ip routing`", "A trunk between PC1 and PC2", "Enabling PortFast", "Increasing the MAC address table size"], "answer": [0, 1], "explain": "Inter-VLAN communication requires Layer 3 routing."}
  ]
});
