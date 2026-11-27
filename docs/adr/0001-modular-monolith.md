# ADR 0001: Modular monolith for STB-first deployment

Status: proposed / accepted design direction, pending compatibility validation.

Context: HG680P/B860H with limited RAM and network resources; Windows secondary; up to 100 enrolled PCs; long-term refactoring required.

Decision: static browser UI, one MeshWall backend with typed feature modules, isolated MeshCentral/Tailscale/OS adapters and a narrowly scoped privileged helper. MeshCentral remains separate upstream engine. No mandatory Docker or server video transcoding.

Alternatives: microservices increase process and operations overhead; fork native dashboard creates difficult upstream merge/security burden; rewrite protocol is high risk. Keep native interface restricted for recovery.

Consequences: simpler resource profile and deployment; enforce boundaries with contracts, tests and dependency checks. Scale by measurement; extract module only with evidence. Revisit after actual ARM compatibility and 100-stream benchmarks.
