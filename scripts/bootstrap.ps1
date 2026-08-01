# Bootstrap script for Phoenix development environment (PowerShell)
# --------------------------------------------------------------
# Generates .env files, JWT secret, pulls Ollama models, starts Docker and services.
# Assumes PowerShell 5+ on Windows.

# Helper function to write .env from .env.example
function Copy-EnvFile($component) {
    $examplePath = Join-Path $PSScriptRoot "..\\$component\\.env.example"
    $destPath    = Join-Path $PSScriptRoot "..\\$component\\.env"
    if (Test-Path $destPath) {
        Write-Host "$component .env already exists, skipping copy."
    } else {
        Copy-Item $examplePath $destPath
        Write-Host "Copied $component/.env.example to .env"
    }
}

# 1. Create .env files for each component
Copy-EnvFile "backend"
Copy-EnvFile "ai-engine"
Copy-EnvFile "frontend"

# 2. Generate JWT secret if not set
$jwtEnv = Join-Path $PSScriptRoot "..\\backend\\.env"
$content = Get-Content $jwtEnv
if (-not ($content -match "JWT_SECRET_KEY")) {
    $secret = [System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    Add-Content $jwtEnv "JWT_SECRET_KEY=$secret"
    Write-Host "Generated JWT_SECRET_KEY in backend/.env"
} else { Write-Host "JWT_SECRET_KEY already present" }

# 3. Start Docker Compose (includes PostgreSQL and Ollama after modification)
Write-Host "Starting Docker Compose..."
docker compose up -d
# Wait for PostgreSQL health
Write-Host "Waiting for PostgreSQL to be ready..."
& docker exec phoenix-postgres pg_isready -U postgres -d phoenix

# 4. Pull Ollama models (requires Ollama container running)
Write-Host "Pulling Ollama models..."
$models = @("mistral", "ms-marco-MiniLM-L-6-v2")
foreach ($model in $models) {
    $attempt = 0
    while ($attempt -lt 3) {
        try {
            ollama pull $model
            Write-Host "Pulled $model"
            break
        } catch {
            $attempt++
            Write-Host "Retry $attempt for $model"
            Start-Sleep -Seconds 5
        }
    }
}

# 5. Install backend dependencies
Write-Host "Building backend with Maven..."
Push-Location ..\\backend
mvn clean install -DskipTests
Pop-Location

# 6. Setup Python AI engine
Write-Host "Setting up Python AI engine..."
Push-Location ..\\ai-engine
if (-not (Test-Path ".venv")) { python -m venv .venv }
. .venv\\Scripts\\activate
pip install -r requirements.txt
Pop-Location

# 7. Install frontend dependencies
Write-Host "Installing frontend packages..."
Push-Location ..\\frontend
npm install
Pop-Location

# 8. Start services in background
Write-Host "Launching Spring Boot backend..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd ..\\backend ^& mvn spring-boot:run" -NoNewWindow
Write-Host "Launching FastAPI engine..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd ..\\ai-engine ^& .venv\\Scripts\\activate ^& uvicorn app.main:app --port 8000 --reload" -NoNewWindow
Write-Host "Launching React dev server..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd ..\\frontend ^& npm run dev" -NoNewWindow

# 9. Run health check
Write-Host "Running health checks..."
& "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\\health_check.ps1"

Write-Host "Bootstrap completed. Visit http://localhost:5173 to view the UI."
