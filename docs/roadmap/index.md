# Roadmap

<script setup>
const isProd = import.meta.env.PROD
</script>

The roadmap provides a structured guide for participants to build eXpServer gradually. It outlines the progression of learning objectives, starting from introductory concepts and building up to advanced features and architecture.

Each stage builds upon the previous one, ensuring a systematic approach to the project. Links are provided within the stage documents for additional reference of concepts as and when necessary. There will be two types of links present throughout the documentation:

1. **Important links**: Resources under these links are meant to be read before proceeding further with the documentation.

   ::: tip NOTE
   The important links will be indicated like this.
   :::

2. **Informative links**: Resources under these links are for more information about a particular concept. The information may not be necessary at that point and you may proceed with the roadmap without visiting these links.

The eXpServer project comprises 24 stages, organized into 5 phases. Prior to the commencement of each phase, participants receive an overview detailing what to anticipate in that phase and summarizing their progress up to that point.

## Stages

<span v-if="!isProd">✅ Reviewed </span>
<span v-if="!isProd">🟡 To be reviewed </span>
<span v-if="!isProd">🟣 Working on it </span>
<span v-if="!isProd">🔴 Corrections </span>

### Phase 0: Introduction to Linux socket programming

- <span v-if="!isProd">✅</span> [Overview](phase-0/)
- <span v-if="!isProd">✅</span> [Stage 0: Setup](phase-0/stage-0)
- <span v-if="!isProd">✅</span> [Stage 1: TCP Server](phase-0/stage-1)
- <span v-if="!isProd">✅</span> [Stage 2: TCP Client](phase-0/stage-2)
- <span v-if="!isProd">🟡</span> [Stage 3: UDP with Multi-threading](phase-0/stage-3)
- <span v-if="!isProd">✅</span> [Stage 4: Linux Epoll](phase-0/stage-4)
- <span v-if="!isProd">✅</span> [Stage 5: TCP Proxy](phase-0/stage-5)

### Phase 1: Building the core of eXpServer by creating reusable modules

- <span v-if="!isProd">✅</span> [Overview](phase-1/)
- <span v-if="!isProd">✅</span> [Stage 6: Listener & Connection Modules](phase-1/stage-6)
- <span v-if="!isProd">🟡</span> [Stage 7: Core & Loop Modules](phase-1/stage-7)
- <span v-if="!isProd">🟡</span> [Stage 8: Non-Blocking Sockets](phase-1/stage-8)
- <span v-if="!isProd">🟡</span> [Stage 9: epoll Edge Triggered](phase-1/stage-9)
- <span v-if="!isProd">🟡</span> [Stage 10: Pipe Module](phase-1/stage-10)
- <span v-if="!isProd">🟡</span> [Stage 11: Upstream Module](phase-1/stage-11)
- <span v-if="!isProd">🟡</span> [Stage 12: File Module](phase-1/stage-12)
- <span v-if="!isProd">🟡</span> [Stage 13: Session Module](phase-1/stage-13)

### Phase 2: Implementing HTTP support

- <span v-if="!isProd">🟡</span> [Overview](phase-2/)
- <span v-if="!isProd">🟡</span> [Stage 14: HTTP Request Module](phase-2/stage-14)
- <span v-if="!isProd">🟡</span> [Stage 15: HTTP Response Module](phase-2/stage-15)
- [Stage 16: Config Module](phase-2/stage-16)
- [Stage 17: Directory Browsing](phase-2/stage-17)

### Phase 3: Adding features to eXpServer

- [Overview](phase-3/)
- [Stage 18: IP Whitelist/Blacklist](phase-3/stage-18)
- [Stage 19: Gzip Compression](phase-3/stage-19)
- [Stage 20: Load Balancing](phase-3/stage-20)
- [Stage 21: Request timeouts](phase-3/stage-21)

### Phase 4: Advanced features 

- [Overview](phase-4/)
- [Stage 22: Metrics](phase-4/stage-23)
- [Stage 23: Multithreading](phase-4/stage-23)
