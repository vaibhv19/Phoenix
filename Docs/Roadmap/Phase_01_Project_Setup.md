# Phase 1 — Project Setup Playbook

This document details the audit, retrofit strategy, and upgraded implementation playbook for establishing the containerized database and the skeleton codebases for the Phoenix system.

---

## 1. Phase Audit

During the audit of the original Phase 1 roadmap, the following gaps and discrepancies were identified:
- **Folder Names Mismatch**: The original roadmap specified directory structures like `phoenix-backend/`, `phoenix-ai/`, and `phoenix-frontend/`. The actual codebase uses simplified names: `backend/`, `ai-engine/`, and `frontend/`.
- **Database Image**: The original roadmap mentioned generic `pgvector` container details. The actual implementation uses the official `pgvector/pgvector:pg16` image on Alpine Linux.
- **Dependency Definitions**: The roadmap did not detail the exact packages and versions that must be configured in `pom.xml`, `requirements.txt`, and `package.json` for compilation to succeed.
- **Port Conflict Troubleshooting**: No operational details were provided for developers running local services that might already bind to default ports (e.g., local PostgreSQL instances on port 5432).

---

## 2. Retrofit Strategy

To convert this phase into a reliable engineering execution guide:
1. **Correct folder path references**: Change all instances of `phoenix-*` to the actual `backend/`, `ai-engine/`, and `frontend/` folders.
2. **Document exact configs**: Provide the exact `docker-compose.yml` code block and describe properties.
3. **Capture manual actions**: Formulate a step-by-step list of commands (`docker compose up`, `mvn spring-boot:run`, etc.) required to boot the skeleton environment.
4. **Create a troubleshooting checklist**: Outline how to diagnose port conflicts and verify driver bindings.

---

## 3. Upgraded Implementation Playbook

### 3.1 Phase Overview
- **Objective**: Establish the local environment database engine (PostgreSQL with pgvector) and bootstrap the Spring Boot, FastAPI, and React Vite codebases.
- **Purpose**: Creates the base communication scaffolding. Ensures database transactions and network socket calls can be made across decoupled service containers.
- **Expected Outcome**: A fully runnable Docker container hosting pgvector, and three active local servers ready to handle network traffic.
- **Dependencies**: None.

### 3.2 Prerequisites
Before starting, ensure the following software is installed on the host system:
- **Operating System**: Windows 10/11, macOS, or Linux.
- **Docker & Docker Compose**: v20.10+ (specifically supporting Docker Compose file format 3.8).
- **Java SE Development Kit (JDK)**: Version 21 (Corretto or OpenJDK recommended).
- **Python**: Version 3.11 or higher, along with `pip` and virtual environment support (`venv`).
- **Node.js & npm**: Node v20 LTS, npm v10+.
- **Build Tools**: Maven v3.9+.

### 3.3 Environment Configuration
The system uses `.env` files located in the root of each project subdirectory to manage secrets and properties.

#### Root Directory Configuration:
No root `.env` is required. The `docker-compose.yml` file defines static variables for the Postgres container.

#### Backend Directory Configuration (`backend/.env`):
Create `backend/.env` containing:
```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/phoenix
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET_KEY=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
CORS_ALLOWED_ORIGINS=http://localhost:5173
PYTHON_AI_ENGINE_URL=http://localhost:8000
UPLOAD_DIR=storage
```

#### AI Engine Directory Configuration (`ai-engine/.env`):
Create `ai-engine/.env` containing:
```env
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phoenix
LLM_PROVIDER=ollama
RERANKER_PROVIDER=flashrank
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
FLASHRANK_MODEL=ms-marco-MiniLM-L-6-v2
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

#### Frontend Directory Configuration (`frontend/.env`):
Create `frontend/.env` containing:
```env
VITE_BACKEND_URL=http://localhost:8080/api
```

### 3.4 Dependencies

#### Database:
- **Image**: `pgvector/pgvector:pg16`.
- **Purpose**: Provides a standard relational database layer combined with vector operations (HNSW indexing, cosine similarity calculations) on 384-dimensional dense vectors.

#### Backend (`pom.xml`):
- `spring-boot-starter-data-jpa`: Object-relational mapping (Hibernate).
- `spring-boot-starter-validation`: REST endpoint payload checks.
- `spring-boot-starter-web`: Tomcat container and routing.
- `spring-boot-starter-security`: JWT and password hashing middleware.
- `flyway-core` & `flyway-database-postgresql`: Schema migration automation.
- `postgresql`: JDBC Driver.
- `lombok`: Boilerplate reduction.

#### AI Engine (`requirements.txt`):
- `fastapi` & `uvicorn`: Async HTTP application server.
- `pydantic` & `pydantic-settings`: Configurations and data models.
- `sqlalchemy` & `psycopg2-binary`: Relational database operations.
- `pgvector`: Extension bindings for SQL queries.
- `pypdf`: Raw PDF reading.
- `langchain-text-splitters`: Character chunking utilities.
- `sentence-transformers`: Dense vector calculations.
- `rank-bm25`: Keyword relevance scoring.
- `flashrank`: Neural cross-encoder re-ranking.

#### Frontend (`package.json`):
- `react` & `react-dom` (v19): Component rendering UI.
- `zustand` (v5): Global state store.
- `framer-motion` (v12): Transitions and reasoning visualizations.
- `react-markdown` (v10): RAG markup renderer.
- `tailwindcss` (v3): CSS styling framework.

### 3.5 Implementation Guide

#### Step 1: Write `docker-compose.yml`
In the root directory, create a `docker-compose.yml` specifying the following service structure:
```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: phoenix-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: phoenix
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

#### Step 2: Bootstrap Spring Boot Backend
1. Generate the initial Maven structure inside `/backend` using JDK 21.
2. Setup the `pom.xml` dependency configurations matching Section 3.4.
3. Configure `application.yml` to bind to variables:
```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
```

#### Step 3: Bootstrap Python FastAPI AI Engine
1. Inside `/ai-engine`, create a virtual environment:
   ```bash
   python -m venv .venv
   ```
2. Activate the environment:
   - On Windows: `.venv\Scripts\activate`
   - On Unix/macOS: `source .venv/bin/activate`
3. Write `requirements.txt` and install:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `app/main.py` with a simple health check endpoint:
   ```python
   from fastapi import FastAPI
   app = FastAPI()
   
   @app.get("/health")
   def health():
       return {"status": "ok"}
   ```

#### Step 4: Bootstrap React Client
1. Inside the root directory, run Vite creation:
   ```bash
   npm create vite@latest frontend -- --template react
   ```
2. Change directory into `/frontend` and run:
   ```bash
   npm install
   npm install zustand framer-motion react-markdown
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. Configure `vite.config.js` to enable proxy routing for api calls:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 5173,
       proxy: {
         '/api': {
           target: 'http://localhost:8080',
           changeOrigin: true
         }
       }
     }
   })
   ```

### 3.6 Manual Engineering Work
The developer must manually:
1. Create the root directory `Phoenix`.
2. Run `docker compose up -d` in the root.
3. Add environmental variables to `/backend/.env` and `/ai-engine/.env` files.
4. Verify that the upload storage directory is created in `/backend/storage`.

### 3.7 Integration Steps
Verify proxy handoffs between services:
- Running `npm run dev` in `/frontend` configures routing such that a browser request to `http://localhost:5173/api/` forwards the request back to the Spring Boot instance on port `8080`.

### 3.8 Verification
1. **Postgres Check**: Run `docker ps` to verify that `phoenix-postgres` is up and active. Connect via a PostgreSQL IDE or `psql -h localhost -U postgres -d phoenix` and run `SELECT 1;`.
2. **Backend Check**: Boot the backend with `mvn spring-boot:run`. The console should print `Tomcat started on port 8080 (http)`.
3. **AI Engine Check**: Boot the AI service with `uvicorn app.main:app --port 8000`. Navigate to `http://localhost:8000/health` and verify the JSON response is `{"status":"ok"}`.
4. **Frontend Check**: Start the UI with `npm run dev` and navigate to `http://localhost:5173/`. Verify that the React page renders.

```mermaid
sequenceDiagram
    participant Browser
    participant Frontend
    participant Backend
    participant AIEngine
    participant Database

    Browser->>Frontend: Request Page (port 5173)
    Frontend-->>Browser: React Skeleton Loaded
    Browser->>Frontend: Call /api/auth (proxied)
    Frontend->>Backend: Forward to 8080
    Backend->>Database: Test DB Connectivity (5432)
    Database-->>Backend: Connection Successful
    Backend->>AIEngine: Call /health (8000)
    AIEngine-->>Backend: Status OK
    Backend-->>Browser: HTTP 200 Setup Completed
```

### 3.9 Troubleshooting

#### Issue 1: Port 5432 Already In Use
- **Symptoms**: Docker container fails to start, throwing `bind: address already in use`.
- **Root Cause**: A local PostgreSQL instance is running on the host system.
- **Diagnosis**: Run `netstat -ano | findstr 5432` on Windows or `lsof -i :5432` on Unix to find the conflicting process ID.
- **Resolution**: Stop the local postgres service (e.g. `pg_ctl stop` or disable the Windows Service), or edit `docker-compose.yml` to map host port `5433:5432` and update env files accordingly.

#### Issue 2: Python virtual environment script execution disabled
- **Symptoms**: Executing `activate` on PowerShell throws: `script execution is disabled on this system`.
- **Root Cause**: PowerShell Execution Policy restricts running scripts.
- **Resolution**: Open PowerShell as administrator and run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`.

### 3.10 Completion Checklist
- [x] Docker Postgres container is running on port 5432.
- [x] Database `phoenix` responds to SQL queries.
- [x] Spring Boot application launches and binds to port 8080.
- [x] FastAPI server starts and returns status OK on `/health` (port 8000).
- [x] Vite server renders React landing page on port 5173.

### 3.11 Lessons Learned
- **Standardizing Folder Paths**: Documenting custom directories early avoids path resolution confusion when configuring endpoints between services. Standardizing on `backend/`, `ai-engine/`, and `frontend/` instead of prefixing `phoenix-` simplifies command executions.

---

## 4. Engineering Review

The configurations, files, and setup instructions mapped above have been checked against the local workspace directory structure. A developer starting from an empty workspace can successfully initialize, secure, and run the foundation of the Phoenix system using this document.

---

## 5. Remaining Recommendations

- **Environment Template**: Keep `.env.example` configurations updated whenever new database credentials or external URL boundaries change.
