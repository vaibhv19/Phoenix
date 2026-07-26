# Phase 1 — Project Setup

## 1. Module Overview: Project Workspace Initializer

### Purpose
To establish the physical directories, repository configurations, build configurations, and external Dockerized services (PostgreSQL + `pgvector`) necessary for local development of the complete **Phoenix** stack.

### Dependencies
- None (This is the starting bootstrapper).

### Outputs
- Decoupled code structures for three distinct projects.
- Runnable Docker Compose file local database.
- Functional dependency configuration managers (`pom.xml`, `requirements.txt`, `package.json`).

---

## 2. Directory Layouts

The single master directory structure will organize the individual repositories independently:

```text
phoenix/
├── docker-compose.yml              # Multi-container orchestration (local PG database)
├── phoenix-backend/                # Spring Boot App
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/resume/phoenix/
│           │   ├── config/         # System Configurations
│           │   ├── exception/      # Global Handler & Exceptions
│           │   └── PhoenixApplication.java
│           └── resources/
│               └── application.yml
├── phoenix-ai/                     # Python AI Engine
│   ├── requirements.txt
│   ├── .venv/
│   └── app/
│       ├── main.py                 # FastAPI Application Entrance
│       └── config.py               # Settings & Environment bindings
└── phoenix-frontend/               # React Vite Client
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        └── store/                  # Zustand Store Skeleton
```

---

## 3. Configuration & Utilities

### Database Local Service Configuration (`docker-compose.yml`)
- PostgreSQL Version: `16-alpine`.
- Extension: `pgvector` container wrapper image (e.g., `pgvector/pgvector:pg16`).
- Exposed Port: `5432`.
- Environment Variables: `POSTGRES_DB=phoenix`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`.

### Spring Boot Configuration (`application.yml`)
- Profiles: `dev`.
- Server Port: `8080`.
- Spring DataSource: URL `jdbc:postgresql://localhost:5432/phoenix`, Username/Password.
- Spring JPA: Hibernate DDL auto-setting `validate` (Liquibase/Flyway migrations to follow).

### FastAPI Settings (`config.py`)
- Framework Settings: `pydantic-settings` to bind environment parameters.
- Server Port: `8000`.
- Database URLs: URI for PostgreSQL/pgvector connection.

### Client Config (`vite.config.js`)
- Server Port: `5173`.
- Proxy Rules: Proxy `/api` prefixes to backend at `http://localhost:8080`.

---

## 4. Atomic Implementation Task List

### Task 1.1: Create Root Workspace Directory & Docker Compose
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: None
- **Description**: Initialize the master project directory and write `docker-compose.yml` to spin up PostgreSQL with the `pgvector` extension enabled.
- **Definition of Done**: File `docker-compose.yml` created, run `docker compose up -d` executes successfully, Postgres port 5432 responds to query connections.

### Task 1.2: Initialize Spring Boot Skeleton
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 1.1
- **Description**: Bootstrap the Maven Spring Boot skeleton using Java 21 and Spring Boot 3.3.1. Add dependencies: `Spring Web`, `Spring Data JPA`, `PostgreSQL Driver`, `Lombok`, and `Validation`.
- **Definition of Done**: Repository skeleton created, `mvn clean compile` succeeds, application boots up with `mvn spring-boot:run` locally.

### Task 1.3: Configure Spring Boot local application.yml
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 1.2
- **Description**: Configure development properties in `application.yml` for connection pooling, Postgres credentials, and basic logging properties.
- **Definition of Done**: Connection test to local Docker Postgres succeeds when starting the Spring Boot service.

### Task 1.4: Initialize Python FastAPI Engine
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 1.1
- **Description**: Set up python environment under `phoenix-ai/`. Create `.venv` virtual environment, write `requirements.txt` containing `fastapi`, `uvicorn`, `pydantic-settings`, and initialize a dummy `/health` endpoint.
- **Definition of Done**: Virtual environment active, running `uvicorn app.main:app --port 8000` launches a service that returns `{"status": "ok"}` on `/health`.

### Task 1.5: Initialize React Frontend Client
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: None
- **Description**: Create React Vite scaffold using JavaScript/JSX under `phoenix-frontend/`. Configure Tailwind CSS utilities, install `zustand`, `framer-motion`, and `react-markdown`.
- **Definition of Done**: Frontend app created, `npm install` runs without errors, `npm run dev` opens local preview on port 5173.
