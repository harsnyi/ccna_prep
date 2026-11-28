/*
 * Study guide: Access Control Lists (blueprint 5.6).
 * Format: see data/guides/subnetting.js (escape backticks as \` ; use ~~~ for code fences).
 */
CCNA.addGuide("acls", {
  intro: `
    ACL questions are mostly **logic puzzles**: here is an ACL and a packet — permitted or denied? Which line
    matches? Where should this ACL be applied, and in which direction? Get the processing rules and wildcard
    masks automatic, and these become easy points.

    Wildcard masks come straight from subnetting — if they still feel slow, revisit the
    [Subnetting guide](#/topics/subnetting) first.
  `,
  sections: [
    {
      id: "rules",
      title: "How an ACL is processed",
      md: `
        An ACL is an ordered list of **ACEs** (access control entries), each **permit** or **deny**.
        Applied to an interface, it filters packets entering (**in**) or leaving (**out**) that interface.

        1. Entries are checked **top-down**, in sequence-number order.
        2. The **first match wins** — the action is taken and no further entries are checked.
        3. If nothing matches, the **implicit "deny any"** at the end drops the packet. It's invisible in the config.

        ### Rules for applying them
        - **One ACL per interface, per direction, per protocol** (one IPv4 in + one IPv4 out).
        - **Inbound**: checked *before* the routing decision. **Outbound**: checked *after* routing, as the packet leaves.
        - An outbound ACL does **not** filter packets the router **generates itself** (e.g. its own pings or OSPF Hellos).
        - Applying an ACL number that has **no entries** permits everything; as soon as it has one entry, the implicit deny applies.

        > [!trap] Order is everything
        > ~~~
        > access-list 1 permit any
        > access-list 1 deny host 10.1.1.5
        > ~~~
        > Line 2 never matches — line 1 already permitted everything. Put **specific entries first**, general ones last.

        ACLs aren't only for filtering: the same match logic selects traffic for **NAT**, QoS, VTY access
        (\`access-class\`) and route filtering.
      `,
      checks: [
        { q: "An ACL contains a single entry: `deny host 10.1.1.5`. It's applied inbound. What happens to traffic from 10.1.1.6?", a: "It's denied by the implicit deny any — nothing permits it." },
        { q: "How many IPv4 ACLs can be applied to one interface?", a: "Two: one inbound and one outbound." },
        { q: "Does an outbound ACL on G0/0 filter a ping sent by the router itself out of G0/0?", a: "No — outbound ACLs don't filter traffic originated by the router." },
      ],
    },
    {
      id: "types",
      title: "Standard, extended, numbered and named",
      md: `
        | | Standard | Extended |
        |---|---|---|
        | Matches on | **Source IP only** | Protocol, **source and destination IP**, source/destination **ports**, and more |
        | Numbers | **1–99**, 1300–1999 | **100–199**, 2000–2699 |
        | Placement | As close to the **destination** as possible | As close to the **source** as possible |

        Both can also be **named** (\`ip access-list standard NAME\` / \`ip access-list extended NAME\`).
        Named ACLs are easier to read and to edit with sequence numbers.

        ### Why the placement rule?
        - A **standard** ACL only sees the source. Placed near the source, \`deny 192.168.1.0/24\` would block that
          LAN from **everything** behind the router, not just the one destination you meant.
        - An **extended** ACL identifies the exact flow, so you drop it **early** and save bandwidth on the way.
      `,
      checks: [
        { q: "Which ACL number ranges are extended?", a: "100–199 and 2000–2699." },
        { q: "Is `access-list 150 permit 10.0.0.0 0.255.255.255` valid?", a: "No — 150 is an extended number, so it needs a protocol and a destination: e.g. `access-list 150 permit ip 10.0.0.0 0.255.255.255 any`." },
        { q: "Why should a standard ACL go close to the destination?", a: "It matches only the source, so near the source it would block that source from every destination." },
      ],
    },
    {
      id: "wildcards",
      title: "Matching addresses with wildcard masks",
      md: `
        A wildcard mask tells the ACL which bits must match: **0 = must match, 1 = ignore**.
        For a subnet: **wildcard = 255.255.255.255 − subnet mask**.

        | To match | Address + wildcard | Keyword form |
        |---|---|---|
        | One host 10.1.1.5 | 10.1.1.5 0.0.0.0 | \`host 10.1.1.5\` |
        | 192.168.1.0/24 | 192.168.1.0 0.0.0.255 | |
        | 192.168.1.0/25 (.0–.127) | 192.168.1.0 0.0.0.127 | |
        | 172.16.32.0/20 | 172.16.32.0 0.0.15.255 | |
        | Everything | 0.0.0.0 255.255.255.255 | \`any\` |

        > [!example] Does 172.16.45.9 match 172.16.32.0 0.0.15.255?
        > The wildcard covers a /20 → block 16 in the 3rd octet → 172.16.32.0 – 172.16.47.255. 45 is inside → **match**.

        In a **standard** ACL, a single address with no wildcard is treated as a host:
        \`access-list 1 permit 10.1.1.5\` = \`permit host 10.1.1.5\`.

        > [!note] Host bits in the address
        > If you type \`permit 10.1.1.77 0.0.0.255\`, IOS stores it as \`10.1.1.0 0.0.0.255\` — the "ignored" bits don't matter.
      `,
      checks: [
        { q: "Which wildcard matches 10.20.0.0/14?", a: "0.3.255.255 (255.255.255.255 − 255.252.0.0)." },
        { q: "Does 192.168.1.130 match `192.168.1.0 0.0.0.127`?", a: "No — that range is .0 – .127." },
        { q: "Write an entry that matches only host 10.0.0.1 in two different ways.", a: "`host 10.0.0.1` or `10.0.0.1 0.0.0.0`." },
      ],
    },
    {
      id: "standard",
      title: "Configuring standard ACLs",
      md: `
        ### Numbered
        ~~~
        R1(config)# access-list 1 remark Block PC LAN from the server LAN
        R1(config)# access-list 1 deny 192.168.1.0 0.0.0.255
        R1(config)# access-list 1 permit any
        R1(config)# interface g0/2
        R1(config-if)# ip access-group 1 out
        ~~~

        ### Named (same result)
        ~~~
        R1(config)# ip access-list standard BLOCK_PCS
        R1(config-std-nacl)# deny 192.168.1.0 0.0.0.255
        R1(config-std-nacl)# permit any
        R1(config)# interface g0/2
        R1(config-if)# ip access-group BLOCK_PCS out
        ~~~

        > [!trap] Forgetting "permit any"
        > Without the final \`permit any\`, the implicit deny would block **all** traffic out of G0/2, not just the PC LAN.

        ### Restricting SSH/Telnet access to the router
        A standard ACL applied to the VTY lines with **\`access-class\`** (not \`ip access-group\`):
        ~~~
        R1(config)# access-list 10 permit host 192.168.1.10
        R1(config)# line vty 0 15
        R1(config-line)# access-class 10 in
        ~~~
        Only 192.168.1.10 can now open remote management sessions to R1.
      `,
      checks: [
        { q: "Which command applies ACL 5 to the VTY lines?", a: "`access-class 5 in` under `line vty 0 15`." },
        { q: "Which command applies ACL 5 to traffic arriving on G0/0?", a: "`ip access-group 5 in` under `interface g0/0`." },
      ],
    },
    {
      id: "extended",
      title: "Configuring extended ACLs",
      md: `
        ~~~
        access-list <100-199> {permit|deny} <protocol> <source> <src-wildcard> [<op> <port>]
                                            <destination> <dst-wildcard> [<op> <port>]
        ~~~

        - **Protocol**: \`ip\` (any IP packet), \`tcp\`, \`udp\`, \`icmp\`, \`ospf\`, \`eigrp\`…
        - **Port operators** (TCP/UDP only): \`eq\`, \`neq\`, \`gt\`, \`lt\`, \`range\`.
        - A port written **after the source** is the **source port**; after the destination it's the **destination port**.

        ~~~
        R1(config)# ip access-list extended PC_TO_SERVER
        R1(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.100 eq 443
        R1(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.100 eq 80
        R1(config-ext-nacl)# deny ip 192.168.1.0 0.0.0.255 host 10.0.0.100
        R1(config-ext-nacl)# permit ip any any
        R1(config)# interface g0/1
        R1(config-if)# ip access-group PC_TO_SERVER in
        ~~~
        G0/1 faces the PC LAN, so the ACL drops unwanted traffic as soon as it enters R1 (close to the source).

        ### Ports you must know
        | Port | Protocol | Transport |
        |---|---|---|
        | 20, 21 | FTP data, control | TCP |
        | 22 | SSH | TCP |
        | 23 | Telnet | TCP |
        | 25 | SMTP | TCP |
        | 53 | DNS | UDP and TCP |
        | 67, 68 | DHCP server, client | UDP |
        | 69 | TFTP | UDP |
        | 80 | HTTP | TCP |
        | 110 | POP3 | TCP |
        | 123 | NTP | UDP |
        | 161, 162 | SNMP, SNMP traps | UDP |
        | 443 | HTTPS | TCP |
        | 514 | Syslog | UDP |

        > [!trap] Source port vs destination port
        > \`permit tcp any eq 80 host 10.1.1.1\` matches packets **from** port 80 (web server replies) going to
        > 10.1.1.1 — not web requests **to** 10.1.1.1. A request to a web server is \`permit tcp any host 10.1.1.1 eq 80\`.
      `,
      checks: [
        { q: "Write an entry that permits any host to reach DNS on 8.8.8.8 over UDP.", a: "`permit udp any host 8.8.8.8 eq 53`" },
        { q: "Can you write `permit ip any any eq 80`?", a: "No — port operators only work with `tcp` or `udp`." },
        { q: "Which entry blocks Telnet from 10.0.0.0/8 to any destination?", a: "`deny tcp 10.0.0.0 0.255.255.255 any eq 23`" },
      ],
    },
    {
      id: "editing",
      title: "Editing ACLs with sequence numbers",
      md: `
        Every entry gets a **sequence number** (10, 20, 30… by default). In named-ACL configuration mode you can
        insert and delete individual lines. This also works for numbered ACLs: \`ip access-list standard 1\`.

        ~~~
        R1# show access-lists
        Standard IP access list 1
            10 deny   192.168.1.0, wildcard bits 0.0.0.255 (12 matches)
            20 permit any (85 matches)

        R1(config)# ip access-list standard 1
        R1(config-std-nacl)# 15 deny host 192.168.2.50
        R1(config-std-nacl)# no 10
        ~~~

        - \`15 deny …\` inserts a line between 10 and 20.
        - \`no 10\` deletes only line 10.
        - \`ip access-list resequence 1 10 10\` renumbers from 10 in steps of 10.

        > [!trap] Deleting the whole list
        > \`no access-list 1\` in global config deletes the **entire** numbered ACL — not one line.
        > Typing \`access-list 1 deny …\` again in global config always **appends to the end**.

        Add **remarks** (\`remark …\` or \`access-list 1 remark …\`) to document intent — they're ignored when matching.
      `,
      checks: [
        { q: "ACL 1 has lines 10 and 20. How do you add a line that's checked between them?", a: "Enter `ip access-list standard 1` and add the line with a sequence number in between, e.g. `15 deny host 10.1.1.1`." },
        { q: "What does `no access-list 101` do?", a: "Deletes the whole ACL 101." },
      ],
    },
    {
      id: "evaluate",
      title: "Evaluating packets step by step",
      md: `
        Work every packet down the list: **protocol → source → source port → destination → destination port**.
        The first line where *everything* matches decides. If none match → implicit deny.

        ~~~
        ip access-list extended LAN_IN        ! applied inbound on G0/1, LAN 192.168.10.0/24
         10 deny   tcp  192.168.10.0 0.0.0.255 any eq 23
         20 permit tcp  192.168.10.0 0.0.0.255 host 10.1.1.10 eq 443
         30 deny   ip   192.168.10.0 0.0.0.127 any
         40 permit icmp any any
        ~~~

        | Packet | Result | Why |
        |---|---|---|
        | 192.168.10.50 → 10.1.1.10, TCP 443 | **Permit (20)** | Not port 23; line 20 matches all fields |
        | 192.168.10.50 → 10.1.1.20, TCP 443 | **Deny (30)** | Line 20 needs host 10.1.1.10; .50 is inside .0–.127 |
        | 192.168.10.200 → 10.1.1.20, ICMP echo | **Permit (40)** | .200 is outside .0–.127, so line 30 misses |
        | 192.168.10.200 → 8.8.8.8, UDP 53 | **Deny (implicit)** | UDP matches no line |
        | 192.168.10.200 → 10.1.1.20, TCP 23 | **Deny (10)** | Telnet from the LAN |

        > [!tip] On the exam
        > Write the line numbers down the side of your note board and tick off each field. Most mistakes come
        > from stopping at a line that matches the source but not the destination or port.
      `,
      checks: [
        { q: "Using LAN_IN above: 192.168.10.60 pings 8.8.8.8. Result?", a: "Denied by line 30 — .60 is in .0–.127 and line 30 matches any IP protocol, before ICMP is permitted on line 40." },
        { q: "Using LAN_IN above: 192.168.10.130 browses to 10.1.1.10 over HTTPS. Result?", a: "Permitted by line 20." },
        { q: "Using LAN_IN above: 192.168.10.130 sends DHCP (UDP 67) to 10.1.1.10. Result?", a: "Denied by the implicit deny — no line matches UDP from .130." },
      ],
    },
    {
      id: "verify",
      title: "Verification",
      md: `
        | Command | Shows |
        |---|---|
        | \`show access-lists\` | All ACLs with sequence numbers and **match counters** |
        | \`show ip access-lists [name]\` | IPv4 ACLs only |
        | \`show ip interface g0/1\` | Which ACL is applied in and out on that interface |
        | \`show running-config\` | ACL entries and \`ip access-group\` / \`access-class\` lines |

        ~~~
        R1# show ip interface g0/1 | include access list
          Outgoing access list is not set
          Inbound  access list is LAN_IN
        ~~~

        - **Match counters** show which lines are actually being hit; \`clear access-list counters\` resets them.
        - The implicit deny has **no counter**. To count denied traffic, add an explicit \`deny ip any any\` (optionally with \`log\`).
      `,
      checks: [
        { q: "Which command shows whether an interface has an ACL applied, and in which direction?", a: "`show ip interface <interface>`" },
        { q: "How can you see how many packets the final deny dropped?", a: "Add an explicit `deny ip any any` at the end — the implicit deny has no counter." },
      ],
    },
    {
      id: "traps",
      title: "Exam traps",
      md: `
        - **Implicit deny**: an ACL without a \`permit\` entry blocks everything.
        - **Order**: a general permit or deny above a specific line makes the specific line useless.
        - **Direction**: inbound means traffic **entering** the router on that interface. Picture the packet's path through the router.
        - **Placement**: standard near the destination; extended near the source.
        - **Ports**: a port after the source address is the *source* port.
        - **Routing protocols**: an inbound ACL that only permits, say, TCP will drop **OSPF Hellos** (IP protocol 89) and break adjacencies. Permit them explicitly (\`permit ospf any any\`).
        - **VTY lines**: \`access-class\`, not \`ip access-group\`.
        - **Deleting**: \`no access-list N\` removes the whole numbered ACL.
        - **Numbers**: 1–99 / 1300–1999 standard, 100–199 / 2000–2699 extended.

        > [!key] Practice
        > Do the **ACL evaluation** drill below: it generates an ACL and a packet every round, and the
        > explanation walks through each line. Keep the **Wildcard masks** drill going until it's instant, then do the Day 34–35 quizzes.
      `,
      checks: [
        { q: "An inbound ACL on R1's G0/0 is `permit tcp any any eq 22`. R1 runs OSPF out of G0/0. What breaks?", a: "The OSPF adjacency on G0/0 — Hellos (IP protocol 89) arriving inbound hit the implicit deny. All non-SSH traffic is dropped too." },
        { q: "You want to stop host 10.1.1.5 reaching server 10.2.2.2 only, using a standard ACL. Where do you apply it?", a: "Outbound on the router interface facing the server's LAN (close to the destination), with `deny host 10.1.1.5` followed by `permit any`." },
      ],
    },
  ],
});
