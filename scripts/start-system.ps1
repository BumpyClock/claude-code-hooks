# Start Multi-Agent Observability System (Windows)
# =================================================

param([switch]$Help)

if ($Help) {
    Write-Host "Start Multi-Agent Observability System (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-system.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "This script starts both the server and client components locally."
    exit 0
}

# Get the directory of this script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# Get the project root directory (parent of scripts)
$projectRoot = Split-Path -Parent $scriptDir

# Colors
function Write-ColorText($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

Write-ColorText "🚀 Starting Multi-Agent Observability System" Blue
Write-ColorText "===========================================" Blue
Write-Host ""

# Function to check if port is in use
function Test-PortInUse($port) {
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        $listener.Stop()
        return $false
    }
    catch {
        return $true
    }
}

# Set working directory to project root
Set-Location $projectRoot

# Check if ports are already in use
if (Test-PortInUse 4000) {
    Write-ColorText "⚠️ Port 4000 is already in use. Run .\scripts\reset-system.ps1 first." Yellow
    exit 1
}

if (Test-PortInUse 5173) {
    Write-ColorText "⚠️ Port 5173 is already in use. Run .\scripts\reset-system.ps1 first." Yellow
    exit 1
}

# Start server
Write-Host ""
Write-ColorText "Starting server on port 4000..." Green
Push-Location "apps\server"

if (Get-Command bun -ErrorAction SilentlyContinue) {
    $serverProcess = Start-Process -FilePath "bun" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
} else {
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
}

Pop-Location

# Wait for server to be ready
Write-ColorText "Waiting for server to start..." Yellow
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/events/filter-options" -UseBasicParsing -TimeoutSec 1
        if ($response.StatusCode -eq 200) {
            Write-ColorText "✅ Server is ready!" Green
            break
        }
    }
    catch {
        Start-Sleep 1
    }
    
    if ($i -eq 30) {
        Write-ColorText "❌ Server failed to start within 30 seconds" Red
        $serverProcess | Stop-Process -Force
        exit 1
    }
}

# Start client
Write-Host ""
Write-ColorText "Starting client on port 5173..." Green
Push-Location "apps\client"

if (Get-Command bun -ErrorAction SilentlyContinue) {
    $clientProcess = Start-Process -FilePath "bun" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
} else {
    $clientProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
}

Pop-Location

# Wait for client to be ready
Write-ColorText "Waiting for client to start..." Yellow
for ($i = 1; $i -le 20; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 1
        if ($response.StatusCode -eq 200) {
            Write-ColorText "✅ Client is ready!" Green
            break
        }
    }
    catch {
        Start-Sleep 1
    }
}

# Display status
Write-Host ""
Write-ColorText "============================================" Blue
Write-ColorText "✅ Multi-Agent Observability System Started" Green
Write-ColorText "============================================" Blue
Write-Host ""
Write-ColorText "🖥️  Client URL: http://localhost:5173" Green
Write-ColorText "🔌 Server API: http://localhost:4000" Green
Write-ColorText "📡 WebSocket: ws://localhost:4000/stream" Green
Write-Host ""
Write-ColorText "📝 Process IDs:" Blue
Write-ColorText "   Server PID: $($serverProcess.Id)" Yellow
Write-ColorText "   Client PID: $($clientProcess.Id)" Yellow
Write-Host ""
Write-ColorText "To stop the system, run: .\scripts\reset-system.ps1" Yellow
Write-ColorText "To test the system, run: .\scripts\test-system.ps1" Yellow
Write-Host ""
Write-ColorText "Press Ctrl+C to stop both processes" Blue

# Function to cleanup on exit
function Stop-Processes {
    Write-Host ""
    Write-ColorText "Shutting down..." Yellow
    try {
        $serverProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        $clientProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-ColorText "✅ Stopped all processes" Green
    }
    catch {
        Write-ColorText "⚠️ Some processes may still be running" Yellow
    }
    exit 0
}

# Handle Ctrl+C
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName "CancelKeyPress" -Action {
    Stop-Processes
}

# Wait for processes to complete
try {
    Wait-Process -InputObject $serverProcess, $clientProcess
}
catch {
    Stop-Processes
}