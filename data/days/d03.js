CCNA.addDay("d03", {
  "cards": [
    {"id": "d03-c01", "front": "What does OSI stand for, and which organization created it?", "back": "Open Systems Interconnection model, created by the **ISO** (International Organization for Standardization)."},
    {"id": "d03-c02", "front": "List the 7 OSI layers from top (7) to bottom (1).", "back": "7 Application · 6 Presentation · 5 Session · 4 Transport · 3 Network · 2 Data Link · 1 Physical"},
    {"id": "d03-c03", "front": "What is **encapsulation** vs **de-encapsulation**?", "back": "Encapsulation: data moves **down** the layers, each adding its header (and L2 trailer). De-encapsulation: data moves **up** at the receiver, headers are stripped."},
    {"id": "d03-c04", "front": "PDU name at Layer 4?", "back": "**Segment** (data + L4 header)"},
    {"id": "d03-c05", "front": "PDU name at Layer 3?", "back": "**Packet** (segment + L3 header)"},
    {"id": "d03-c06", "front": "PDU name at Layer 2?", "back": "**Frame** (packet + L2 header **and** L2 trailer)"},
    {"id": "d03-c07", "front": "PDU name at Layer 1? At Layers 5–7?", "back": "Layer 1: **bits**. Layers 5–7: **data**."},
    {"id": "d03-c08", "front": "Which OSI layer do routers operate at? Switches?", "back": "Routers: **Layer 3** (Network). Switches: **Layer 2** (Data Link)."},
    {"id": "d03-c09", "front": "Which layer provides **logical addressing** and **path selection**?", "back": "**Layer 3 – Network** (IP addresses, connectivity between different networks)."},
    {"id": "d03-c10", "front": "Which layer provides **node-to-node** connectivity, and which provides **host-to-host** (end-to-end)?", "back": "Node-to-node: **Layer 2** (Data Link). Host-to-host: **Layer 4** (Transport)."},
    {"id": "d03-c11", "front": "What does the Transport layer do with data?", "back": "**Segments** data into smaller pieces and reassembles it at the destination; provides host-to-host communication."},
    {"id": "d03-c12", "front": "What does the Presentation layer do?", "back": "Translates data between application format and network format (e.g. encryption, encoding)."},
    {"id": "d03-c13", "front": "What does the Session layer do?", "back": "Controls dialogues (sessions) between hosts: establishes, manages and terminates connections."},
    {"id": "d03-c14", "front": "What does Layer 1 (Physical) define?", "back": "Physical characteristics of the medium: voltage levels, max distances, connectors, cable specs. Converts bits into electrical/radio signals."},
    {"id": "d03-c15", "front": "Name the 4 layers of the TCP/IP suite and how they map to OSI.", "back": "**Application** (OSI 5–7) · **Transport** (4) · **Internet** (3) · **Link / Network Access** (1–2)"},
    {"id": "d03-c16", "front": "Who developed the TCP/IP suite?", "back": "The US Department of Defense through **DARPA**."},
    {"id": "d03-c17", "front": "**Adjacent-layer** vs **same-layer** interaction?", "back": "Adjacent-layer: between different layers on the **same host** (L7→L4). Same-layer: the same layer on **different hosts** (browser ↔ web server at L7)."},
    {"id": "d03-c18", "front": "Which layer detects (and possibly corrects) Physical layer errors?", "back": "**Layer 2 – Data Link** (via the frame trailer / FCS)."}
  ],
  "questions": [
    {"id": "d03-q01", "type": "single", "q": "A PDU that contains an L4 header and an L3 header, but no L2 header, is called a:", "options": ["Frame", "Packet", "Segment", "Bit"], "answer": [1], "explain": "Segment + L3 header = **packet**. A frame would additionally have the L2 header and trailer."},
    {"id": "d03-q02", "type": "single", "q": "Which OSI layer is responsible for logical addressing and path selection between networks?", "options": ["Data Link", "Transport", "Network", "Session"], "answer": [2], "explain": "Layer 3 (Network) provides IP addressing and path selection; routers operate here."},
    {"id": "d03-q03", "type": "multi", "q": "Which TWO are added to a packet when it is encapsulated at Layer 2? (Choose two.)", "options": ["L2 header", "L4 header", "L2 trailer", "L3 header", "Session ID"], "answer": [0, 2], "explain": "The Data Link layer adds **both** a header and a trailer, creating a frame."},
    {"id": "d03-q04", "type": "single", "q": "A user's browser communicates with a web server's HTTP service. This is an example of:", "options": ["Adjacent-layer interaction", "Same-layer interaction", "De-encapsulation", "Node-to-node communication"], "answer": [1], "explain": "Same-layer interaction: the Application layer on one host talks to the Application layer on another host."},
    {"id": "d03-q05", "type": "single", "q": "Which TCP/IP model layer corresponds to OSI Layers 5, 6 and 7?", "options": ["Transport", "Internet", "Application", "Link"], "answer": [2], "explain": "The TCP/IP Application layer covers OSI Application, Presentation and Session."},
    {"id": "d03-q06", "type": "single", "q": "Which layer provides **node-to-node** data transfer such as PC-to-switch or switch-to-router?", "options": ["Physical", "Data Link", "Network", "Transport"], "answer": [1], "explain": "Layer 2 provides node-to-node (hop-by-hop) delivery. Layer 4 provides host-to-host (end-to-end)."},
    {"id": "d03-q07", "type": "single", "q": "Voltage levels, connector types and maximum cable distances are defined at which OSI layer?", "options": ["Layer 1", "Layer 2", "Layer 3", "Layer 4"], "answer": [0], "explain": "These are physical characteristics of the medium — Layer 1."},
    {"id": "d03-q08", "type": "single", "q": "Which statement about the OSI and TCP/IP models is correct?", "options": ["OSI is the model used by modern networks; TCP/IP is only conceptual", "TCP/IP is the model in actual use; OSI still influences how engineers describe networks", "Both models have 7 layers", "TCP/IP was created by the ISO"], "answer": [1], "explain": "TCP/IP (DARPA) is what runs real networks; the 7-layer OSI model (ISO) is the vocabulary engineers still use (\"a Layer 2 problem\")."},
    {"id": "d03-q09", "type": "single", "q": "Which layer breaks large data into smaller pieces and reassembles them at the destination host?", "options": ["Presentation", "Session", "Transport", "Network"], "answer": [2], "explain": "The Transport layer segments and reassembles data and provides host-to-host communication."},
    {"id": "d03-q10", "type": "multi", "q": "Which TWO devices or protocols are correctly matched to their OSI layer? (Choose two.)", "options": ["Switch – Layer 2", "Router – Layer 2", "HTTP – Layer 7", "HTTPS – Layer 4", "IP address – Layer 2"], "answer": [0, 2], "explain": "Switches are L2, routers L3, HTTP/HTTPS are L7, IP addresses are L3 (MAC addresses are L2)."}
  ]
});
