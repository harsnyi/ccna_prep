CCNA.addDay("d19", {
  "cards": [
    {"id": "d19-c01", "front": "What does **DTP** do?", "back": "Dynamic Trunking Protocol (Cisco): lets switch ports **negotiate** whether they become access or trunk ports. Enabled by default."},
    {"id": "d19-c02", "front": "`dynamic desirable` vs `dynamic auto`?", "back": "**Desirable** actively tries to form a trunk. **Auto** is passive and only becomes a trunk if the other side asks."},
    {"id": "d19-c03", "front": "DTP results: auto + auto, desirable + auto, desirable + desirable?", "back": "auto + auto → **access** · desirable + auto → **trunk** · desirable + desirable → **trunk**"},
    {"id": "d19-c04", "front": "DTP results with a static `trunk` or `access` end?", "back": "trunk + (trunk / desirable / auto) → trunk. access + anything dynamic → access. trunk + access → **mismatch**: never configure that."},
    {"id": "d19-c05", "front": "Default DTP mode on newer vs older switches?", "back": "Newer: **dynamic auto**. Older: dynamic desirable."},
    {"id": "d19-c06", "front": "How do you disable DTP?", "back": "Hard-code the mode: `switchport mode access`, or `switchport mode trunk` with `switchport nonegotiate`. Best practice for security."},
    {"id": "d19-c07", "front": "Does DTP form trunks with routers or PCs?", "back": "No. Those ports stay access ports."},
    {"id": "d19-c08", "front": "What does **VTP** do?", "back": "VLAN Trunking Protocol: a **server** advertises the VLAN database, and **clients** in the same domain sync to it."},
    {"id": "d19-c09", "front": "VTP modes?", "back": "**Server** (default; can create, modify and delete VLANs) · **Client** (syncs, can't edit) · **Transparent** (keeps its own VLANs and forwards VTP messages, but doesn't sync)"},
    {"id": "d19-c10", "front": "What is the VTP **revision number**?", "back": "It increases with every VLAN change on a server. Switches sync to the **highest** revision in their domain."},
    {"id": "d19-c11", "front": "Why is VTP dangerous?", "back": "Adding an old switch with a **higher revision number** and the same domain name can **overwrite all VLANs** in the network."},
    {"id": "d19-c12", "front": "How do you reset a switch's VTP revision number to 0?", "back": "Change it to a different (unused) VTP domain name, or set it to **transparent** mode, then change it back."},
    {"id": "d19-c13", "front": "VTP versions?", "back": "v1 and v2: no extended VLANs (1006–4094). **v3** supports the extended range."}
  ],
  "questions": [
    {"id": "d19-q01", "type": "single", "q": "Both ends of a link are in `dynamic auto` mode. What does the link become?", "options": ["Trunk", "Access", "Err-disabled", "Mismatch"], "answer": [1], "explain": "Neither side actively asks for a trunk."},
    {"id": "d19-q02", "type": "single", "q": "One end is `dynamic desirable` and the other `dynamic auto`. Result?", "options": ["Trunk", "Access", "Mismatch", "Shut down"], "answer": [0], "explain": "Desirable asks, auto agrees."},
    {"id": "d19-q03", "type": "single", "q": "One end is `switchport mode trunk` and the other is `dynamic desirable`. Result?", "options": ["Access", "Trunk", "Mismatch", "No link"], "answer": [1], "explain": "A static trunk still sends DTP frames, and desirable agrees."},
    {"id": "d19-q04", "type": "single", "q": "Which command stops a trunk port from sending DTP negotiation frames?", "options": ["no dtp", "switchport nonegotiate", "switchport mode dynamic", "no switchport"], "answer": [1], "explain": "Use it together with `switchport mode trunk`."},
    {"id": "d19-q05", "type": "single", "q": "Which VTP mode can't create or delete VLANs?", "options": ["Server", "Client", "Transparent", "Off"], "answer": [1], "explain": "Clients only sync from the server."},
    {"id": "d19-q06", "type": "single", "q": "What does a VTP transparent switch do?", "options": ["Syncs its VLANs from the server", "Keeps its own VLAN database and forwards VTP advertisements", "Blocks all VTP messages", "Deletes all VLANs"], "answer": [1], "explain": "It neither syncs nor advertises its own VLANs, but passes VTP messages on."},
    {"id": "d19-q07", "type": "single", "q": "An old lab switch with revision number 150 joins a production VTP domain at revision 40. What can happen?", "options": ["Nothing; lower revisions win", "The production VLAN database can be overwritten by the lab switch's VLANs", "The lab switch is put in transparent mode", "VTP is disabled"], "answer": [1], "explain": "The highest revision number wins, the classic VTP accident."},
    {"id": "d19-q08", "type": "single", "q": "Which VTP version supports extended-range VLANs (1006–4094)?", "options": ["Version 1", "Version 2", "Version 3", "All versions"], "answer": [2], "explain": "Only VTP v3."},
    {"id": "d19-q09", "type": "multi", "q": "Which two actions reset a switch's VTP revision number to 0? (Choose two.)", "options": ["Changing the VTP domain name", "Changing the mode to transparent", "Deleting VLAN 1", "Shutting down the trunk", "Running `show vtp status`"], "answer": [0, 1], "explain": "VLAN 1 can't be deleted anyway."},
    {"id": "d19-q10", "type": "multi", "q": "Which two VTP modes allow you to create VLANs locally? (Choose two.)", "options": ["Server", "Transparent", "Client", "Passive", "Desirable"], "answer": [0, 1], "explain": "Desirable is a DTP mode, not VTP."}
  ]
});
