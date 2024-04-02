# Roadmap

---

**What are we building?**

Upon completing the project, we will have crafted a fully functional web server compatible with various Linux distributions. eXpServer will possess a range of capabilities, including serving static files, reverse proxying requests, load balancing, performing gzip compression, implementing caching mechanisms, rate limiting requests, supporting TLS encryption and so on. Notably, the server will maintain high performance standards, efficiently handling numerous requests by utilising multiple CPU cores.

---

**How are we building it?**

The roadmap is structured into sequential stages to ensure the gradual development of eXpServer. Each stage builds upon the previous one, ensuring a systematic approach to the project. Links are provided within the stage documents for additional reference of concepts as and when necessary. Consistency in the development schedule is recommended for maintaining clarity and coherence throughout the process of building eXpServer.

## Stages

### Phase 0

> Introduction to Linux socket programming

- [Overview](phase-0/)
- [Stage 0: Setup](phase-0/stage-0)
- [Stage 1: TCP Server](phase-0/stage-1)
- [Stage 2: TCP Slient](phase-0/stage-2)
- [Stage 3: Linux epoll](phase-0/stage-3)
- [Stage 4: TCP Proxy](phase-0/stage-4)

### Phase 1

> Building the core of eXpServer by creating reusable modules

- [Overview](phase-1/)
- [Stage 5: Server & Client Modules](phase-1/stage-5)
- [Stage 6: Core & Loop Modules](phase-1/stage-6)
- [Stage 7: TCP Module](phase-1/stage-7)
- [Stage 8: Upstream Module](phase-1/stage-8)
- [Stage 9: File Module](phase-1/stage-9)

### Phase 2

> Implementing HTTP support

- [Overview](phase-2/)
- [Stage 10: HTTP Parser](phase-2/stage-10)
- [Stage 11: HTTP Req & Res Modules](phase-2/stage-11)
- [Stage 12: Config & Session Modules](phase-2/stage-12)
- [Stage 13: HTTP Specification](phase-2/stage-13)

### Phase 3

> Adding features to eXpServer

- [Overview](phase-3/)
- [Stage 14: IP Whitelist/Blacklist](phase-3/stage-14)
- [Stage 15: Directory Browsing](phase-3/stage-15)
- [Stage 16: Gzip Compression](phase-3/stage-16)
- [Stage 17: Load Balancing](phase-3/stage-17)
- [Stage 18: Rate Limiting & Timeout](phase-3/stage-18)

### Phase 4

> Advanced features and multiprocess architecture

- [Overview](phase-4/)
- [Stage 19: Transport Layer Security (TLS)](phase-4/stage-19)
- [Stage 20: Caching](phase-4/stage-20)
- [Stage 21: Multiprocess Architecture](phase-4/stage-21)
