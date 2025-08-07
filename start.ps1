# Multi-Agent Observability System - Universal Starter (Windows)
# =============================================================
# PowerShell version of the universal starter script

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Multi-Agent Observability System - Universal Starter" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "This script automatically detects and runs the best installation method:"
    Write-Host "  - Docker (recommended): If Docker Desktop is running"
    Write-Host "  - Local development: Falls back to local setup"
    Write-Host ""
    Write-Host "Prerequisites:" -ForegroundColor Yellow
    Write-Host "  - ANTHROPIC_API_KEY environment variable or .env file"
    Write-Host "  - Docker Desktop (recommended) or Node.js + Python"
    Write-Host ""
    exit 0
}

# Colors for PowerShell
function Write-ColorText($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

function Write-Banner {
    Write-ColorText "╔══════════════════════════════════════════════════════════════╗" Cyan
    Write-ColorText "║                                                              ║" Cyan
    Write-ColorText "║        🔬 Multi-Agent Observability System 🔬              ║" Cyan
    Write-ColorText "║                                                              ║" Cyan
    Write-ColorText "║            Universal One-Click Starter                      ║" Cyan
    Write-ColorText "║                                                              ║" Cyan
    Write-ColorText "╚══════════════════════════════════════════════════════════════╝" Cyan
}

# Check if Docker is available and running
function Test-DockerAvailable {
    try {
        $null = Get-Command docker -ErrorAction Stop
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Check for API key
function Test-ApiKeyAvailable {
    # Check environment variable first
    if ($env:ANTHROPIC_API_KEY -and $env:ANTHROPIC_API_KEY -ne "your_anthropic_api_key_here") {
        return $true
    }
    
    # Check .env file
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $apiKeyLine = $envContent | Where-Object { $_ -match "^ANTHROPIC_API_KEY=" -and $_ -notmatch "your_anthropic_api_key_here" }
        if ($apiKeyLine) {
            return $true
        }
    }
    
    return $false
}

# Main script
Clear-Host
Write-Banner
Write-Host ""
Write-ColorText "🔍 Detecting best installation method..." Blue
Write-Host ""

# Test Docker availability
if (Test-DockerAvailable) {
    Write-ColorText "✅ Docker detected and running" Green
    
    # Check API key
    if (Test-ApiKeyAvailable) {
        Write-ColorText "✅ API key found" Green
    } else {
        Write-ColorText "⚠️  Setting up environment..." Yellow
        
        if (!(Test-Path ".env")) {
            Copy-Item ".env.sample" ".env"
        }
        
        Write-ColorText "Please edit .env and add your ANTHROPIC_API_KEY" Blue
        Write-ColorText "Get your key from: https://console.anthropic.com/" Blue
        Write-ColorText "Press any key to open .env file..." Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        notepad.exe ".env"
        exit 1
    }
    
    Write-Host ""
    Write-ColorText "🚀 Starting with Docker (recommended)..." Blue
    
    # Start Docker Compose
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-ColorText "✅ System started!" Green
        Write-ColorText "🌐 Dashboard: http://localhost:5173" Cyan
        Write-ColorText "📡 API: http://localhost:4000" Cyan
        
        Write-Host ""
        Write-ColorText "🪝 To monitor your projects:" Blue
        Write-ColorText "   .\setup\extract-hooks.ps1 C:\path\to\your\project `"Project Name`"" Yellow
    } else {
        Write-ColorText "❌ Failed to start Docker containers" Red
        exit 1
    }
    
} else {
    Write-ColorText "⚠️  Docker not available, using local development setup..." Yellow
    
    # Check if local setup exists
    if (!(Test-Path "apps\server\package.json")) {
        Write-ColorText "📦 Running full installation..." Blue
        PowerShell -ExecutionPolicy Bypass -File ".\setup\install.ps1"
    }
    
    Write-ColorText "🚀 Starting local development servers..." Blue
    PowerShell -ExecutionPolicy Bypass -File ".\scripts\start-system.ps1"
}

Write-Host ""
Write-ColorText "🎉 Ready! Open http://localhost:5173 and run Claude Code commands to see events!" Green

# Keep PowerShell window open
Write-Host ""
Write-ColorText "Press any key to exit..." Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")