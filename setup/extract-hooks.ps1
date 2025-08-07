# Extract Claude Code hooks from Docker container to local project (Windows)
# ==========================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetPath,
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectName,
    
    [switch]$Help
)

if ($Help) {
    Write-Host "Extract Claude Code hooks from Docker container (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\extract-hooks.ps1 -TargetPath <path> [-ProjectName <name>]" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -TargetPath   Path to your project directory (required)"
    Write-Host "  -ProjectName  Name for this project (optional)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host '  .\extract-hooks.ps1 -TargetPath "C:\work\my-api-server"'
    Write-Host '  .\extract-hooks.ps1 -TargetPath "C:\work\my-api-server" -ProjectName "My API Server"'
    Write-Host ""
    Write-Host "Prerequisites:" -ForegroundColor Yellow
    Write-Host "  - Docker container 'claude-observability' must be running"
    Write-Host "  - Target directory must exist"
    exit 0
}

# Set defaults
if (-not $ProjectName) {
    $ProjectName = Split-Path $TargetPath -Leaf
}

$ContainerName = "claude-observability"

# Colors
function Write-ColorText($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

# Validate target directory
if (!(Test-Path $TargetPath)) {
    Write-ColorText "❌ Error: Target directory '$TargetPath' does not exist" Red
    exit 1
}

# Check if Docker container exists and is running
try {
    $containerStatus = docker ps --format "table {{.Names}}" | Select-String "^$ContainerName$"
    if (!$containerStatus) {
        Write-ColorText "❌ Error: Docker container '$ContainerName' is not running" Red
        Write-ColorText "Start it with: docker-compose up -d" Yellow
        exit 1
    }
}
catch {
    Write-ColorText "❌ Error: Docker command failed. Is Docker Desktop running?" Red
    exit 1
}

Write-ColorText "🪝 Extracting hooks for: $ProjectName" Blue
Write-ColorText "   Target: $TargetPath" Blue
Write-Host ""

# Extract hooks from container
Write-ColorText "📁 Copying .claude directory from container..." Blue
try {
    $claudePath = Join-Path $TargetPath ".claude"
    docker cp "${ContainerName}:/app/hooks" $claudePath
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✅ Copied .claude directory" Green
    } else {
        Write-ColorText "❌ Failed to copy hooks from container" Red
        exit 1
    }
}
catch {
    Write-ColorText "❌ Failed to copy hooks from container: $($_.Exception.Message)" Red
    exit 1
}

# Update settings.json with project name
$settingsFile = Join-Path $claudePath "settings.json"
if (Test-Path $settingsFile) {
    Write-ColorText "⚙️ Configuring hooks for '$ProjectName'..." Blue
    
    try {
        $content = Get-Content $settingsFile -Raw
        $content = $content -replace "cc-hooks-observability", $ProjectName
        $content | Out-File $settingsFile -Encoding UTF8
        
        Write-ColorText "✅ Updated hooks configuration" Green
    }
    catch {
        Write-ColorText "⚠️ Failed to update settings file: $($_.Exception.Message)" Yellow
    }
} else {
    Write-ColorText "⚠️ Settings file not found in extracted hooks" Yellow
}

# Check Python dependencies
Write-ColorText "🐍 Checking Python dependencies..." Blue
$hooksPath = Join-Path $claudePath "hooks"

if (Test-Path $hooksPath) {
    Push-Location $hooksPath
    
    $pyprojectFile = "pyproject.toml"
    if (!(Test-Path $pyprojectFile)) {
        Write-ColorText "⚠️ Creating pyproject.toml for dependencies..." Yellow
        @"
[project]
name = "claude-hooks"
version = "0.1.0"
dependencies = [
    "requests>=2.28.0",
    "python-dotenv>=0.19.0",
    "anthropic>=0.25.0",
    "openai>=1.0.0"
]
requires-python = ">=3.8"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
"@ | Out-File -FilePath $pyprojectFile -Encoding UTF8
    }
    
    # Install dependencies if UV is available
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        Write-ColorText "📦 Installing Python dependencies..." Blue
        uv sync
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Python dependencies installed" Green
        } else {
            Write-ColorText "⚠️ Failed to install dependencies with UV" Yellow
        }
    } else {
        Write-ColorText "⚠️ UV not found. Install with:" Yellow
        Write-ColorText "   powershell -c `"irm https://astral.sh/uv/install.ps1 | iex`"" Blue
        Write-ColorText "   Then run: uv sync" Blue
    }
    
    Pop-Location
}

# Test connection to observability server
Write-Host ""
Write-ColorText "🧪 Testing connection to observability server..." Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/events/filter-options" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-ColorText "✅ Connection successful!" Green
        
        # Send test event
        Push-Location $TargetPath
        if (Get-Command uv -ErrorAction SilentlyContinue) {
            try {
                '{"test": true}' | uv run .claude/hooks/send_event.py --source-app $ProjectName --event-type "Test" 2>$null
                Write-ColorText "✅ Test event sent successfully" Green
            }
            catch {
                Write-ColorText "⚠️ Test event failed (check logs)" Yellow
            }
        }
        Pop-Location
    }
}
catch {
    Write-ColorText "⚠️ Observability server not accessible at localhost:4000" Yellow
    Write-ColorText "   Make sure the Docker container is running and ports are mapped correctly" White
}

# Final instructions
Write-Host ""
Write-ColorText "╔═══════════════════════════════════════════════════════════════╗" Green
Write-ColorText "║                                                               ║" Green
Write-ColorText "║  🎉 Hooks Extracted Successfully! 🎉                        ║" Green
Write-ColorText "║                                                               ║" Green
Write-ColorText "╚═══════════════════════════════════════════════════════════════╝" Green

Write-Host ""
Write-ColorText "📋 Next Steps:" Blue
Write-ColorText "   1. Go to your project: cd '$TargetPath'" Yellow
Write-ColorText "   2. Run Claude Code commands and watch events at http://localhost:5173" Yellow
Write-ColorText "   3. Configure LLM provider in your .env file:" Yellow
Write-ColorText "      SUMMARY_LLM_PROVIDER=anthropic  # or openai" Blue

Write-Host ""
Write-ColorText "Your project is now monitored! All Claude Code actions will be tracked." Blue

# Keep PowerShell window open briefly
Start-Sleep -Seconds 2