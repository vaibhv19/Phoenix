# Phoenix Systems Documentation Index

This directory serves as the canonical technical specifications and design repository for **Phoenix**. It is organized into planning documents, engineering specs, architectural logs, and a living knowledge wiki.

---

## 1. Documentation Map & Navigation

Use the directory map below to navigate the system documentation:

| Document | Category / Phase | Target Description / Specification |
|:---|:---|:---|
| **[PRD.md](PRD.md)** | Product Planning | Core requirements, target personas, and scope boundaries. |
| **[Feature_List.md](Feature_List.md)** | System Features | Detailed capabilities of the Gateway, AI Engine, and Client. |
| **[Tech Stack.md](Tech%20Stack.md)** | Technology Stack | Software dependencies, versions, and justifications. |
| **[AppFlow.md](AppFlow.md)** | Execution Flow | Sequence diagrams and fallback decision flowcharts. |
| **[Design.md](Design.md)** | Visual Design | Color palettes, UI component styling, and CSS classes. |
| **[RAG_Architecture.md](RAG_Architecture.md)** | Retrieval Logic | Mathematical models for hybrid search and state routing. |
| **[API_Specification.md](API_Specification.md)** | REST API Contract | Endpoint routing parameters and DTO payload schemas. |
| **[DB_Schema.md](DB_Schema.md)** | Relational Schema | Shared PostgreSQL structures, data tables, and constraints. |
| **[Security.md](Security.md)** | Security Framework | JWT filters, cryptographies, and attack mitigations. |
| **[Provider_Strategy.md](Provider_Strategy.md)** | Providers Configurations| Setup parameters for Ollama, models, and file paths. |
| **[WebSocket_Architecture.md](WebSocket_Architecture.md)**| Real-time Spec | STOMP SockJS connection streaming specifications (planned). |
| **[Error_Handling.md](Error_Handling.md)** | Resiliency | Exception translation tables, timeouts, and JSON error shapes. |
| **[Testing_Strategy.md](Testing_Strategy.md)** | Verification | Automated integration flows and hit-rate benchmarks. |
| **[Engineering_Knowledge_Base.md](Engineering_Knowledge_Base.md)** | Knowledge Wiki | Master documentation for architectures and troubleshooting. |
| **[Release_Notes.md](Release_Notes.md)** | Release Info | Implementation milestones, limitation logs, and roadmaps. |

---

## 2. Documentation Subdirectories

* **[Learning/](Learning/README.md)**: Deep-dive study notes and conceptual guides on confidence calculations, tokenizers, project tenants isolation, and indexing pipelines.
* **[Roadmap/](Roadmap/README.md)**: Detailed phase-by-phase execution milestones mapping the complete history of the implementation.
