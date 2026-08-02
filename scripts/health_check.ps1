# Health‑check script for Phoenix development environment (PowerShell)
# --------------------------------------------------------------
# Returns a concise PASS/FAIL report for each required component.

function Write-Result($name, $passed, $details = $null) {
    if ($passed) {
        Write-Host "[PASS] $name"
    } else {
        Write-Host "[FAIL] $name"
        if ($details) { Write-Host "       Details: $details" }
    }
}

$allPass = $true

# 1. Docker containers running
Write-Host "Checking Docker containers..."
$containers = docker ps --format "{{.Names}}"
if ($containers -match "phoenix-postgres") {
    Write-Result "PostgreSQL container" $true
} else {
    Write-Result "PostgreSQL container" $false "Container not running"
    $allPass = $false
}
# 2. PostgreSQL health
Write-Host "Checking PostgreSQL health..."
$pgReady = docker exec phoenix-postgres pg_isready -U postgres -d phoenix
if ($pgReady -match "accepting connections") {
    Write-Result "PostgreSQL health" $true
} else {
    Write-Result "PostgreSQL health" $false "pg_isready failed"
    $allPass = $false
}

# 3. Ollama health
Write-Host "Checking Ollama health..."
try {
    $ollamaResp = Invoke-RestMethod -Uri http://localhost:11434/api/tags -Method Get -TimeoutSec 5
    if ($ollamaResp.models -match "mistral") {
        Write-Result "Ollama model (mistral)" $true
    } else {
        Write-Result "Ollama model (mistral)" $false "Model not found"
        $allPass = $false
    }
} catch {
    Write-Result "Ollama health" $false $_
    $allPass = $false
}

# 4. FastAPI health
Write-Host "Checking FastAPI health..."
try {
    $fastapi = Invoke-RestMethod -Uri http://localhost:8000/health -Method Get -TimeoutSec 5
    if ($fastapi.status -eq "ok") { Write-Result "FastAPI" $true } else { Write-Result "FastAPI" $false "Unexpected response"; $allPass = $false }
} catch { Write-Result "FastAPI" $false $_; $allPass = $false }

# 5. Spring Boot health
Write-Host "Checking Spring Boot health..."
try {
    $boot = Invoke-RestMethod -Uri http://localhost:8080/actuator/health -Method Get -TimeoutSec 5
    if ($boot.status -eq "UP") { Write-Result "Spring Boot" $true } else { Write-Result "Spring Boot" $false "Unexpected status"; $allPass = $false }
} catch { Write-Result "Spring Boot" $false $_; $allPass = $false }

# 6. Frontend reachable
Write-Host "Checking Frontend dev server..."
try {
    $front = Invoke-WebRequest -Uri http://localhost:5173 -Method Get -UseBasicParsing -TimeoutSec 5
    if ($front.StatusCode -eq 200) { Write-Result "Frontend (Vite)" $true } else { Write-Result "Frontend (Vite)" $false "Status $($front.StatusCode)"; $allPass = $false }
} catch { Write-Result "Frontend (Vite)" $false $_; $allPass = $false }

if ($allPass) {
    Write-Host "All health checks passed. 🎉"
    exit 0
} else {
    Write-Host "Some checks failed. Review above messages."
    exit 1
}
