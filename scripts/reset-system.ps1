# Reset Multi-Agent Observability System (Windows)
# =================================================

param(
    [switch]$ClearDatabase,
    [switch]$Help
)

if ($Help) {
    Write-Host "Reset Multi-Agent Observability System (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\reset-system.ps1 [-ClearDatabase]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -ClearDatabase  Also remove the SQLite database"
    exit 0
}

# Colors
function Write-ColorText($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

Write-ColorText "🛑 Resetting Multi-Agent Observability System" Red
Write-ColorText "=============================================" Red
Write-Host ""

# Stop processes using ports 4000 and 5173
Write-ColorText "🔍 Finding and stopping processes..." Blue

$processesToKill = @()

# Find processes using port 4000
try {
    $port4000 = netstat -ano | Select-String ":4000 " | Select-String "LISTENING"
    if ($port4000) {
        $pid = ($port4000.ToString().Split() | Where-Object {$_})[-1]
        $processesToKill += $pid
        Write-ColorText "Found process on port 4000: PID $pid" Yellow
    }
}
catch {
    # Port not in use
}

# Find processes using port 5173
try {
    $port5173 = netstat -ano | Select-String ":5173 " | Select-String "LISTENING"
    if ($port5173) {
        $pid = ($port5173.ToString().Split() | Where-Object {$_})[-1]
        $processesToKill += $pid
        Write-ColorText "Found process on port 5173: PID $pid" Yellow
    }
}
catch {
    # Port not in use
}

# Find Node/Bun processes that might be related
$nodeProcesses = Get-Process -Name "node", "bun" -ErrorAction SilentlyContinue
foreach ($proc in $nodeProcesses) {
    $cmdLine = ""
    try {
        $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        if ($cmdLine -match "apps\\server|apps\\client|multi-agent|observability") {
            $processesToKill += $proc.Id
            Write-ColorText "Found related process: PID $($proc.Id) - $($proc.Name)" Yellow
        }
    }
    catch {
        # Could not get command line
    }
}

# Kill processes
$processesToKill = $processesToKill | Sort-Object -Unique
foreach ($pid in $processesToKill) {
    try {
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-ColorText "✅ Stopped process PID $pid" Green
    }
    catch {
        Write-ColorText "⚠️ Could not stop process PID $pid (may already be stopped)" Yellow
    }
}

if ($processesToKill.Count -eq 0) {
    Write-ColorText "ℹ️ No running processes found" Blue
}

# Clear database if requested
if ($ClearDatabase) {
    Write-Host ""
    Write-ColorText "🗑️ Clearing database..." Red
    
    $dbFiles = @(
        "apps\server\events.db",
        "apps\server\events.db-shm", 
        "apps\server\events.db-wal"
    )
    
    foreach ($dbFile in $dbFiles) {
        if (Test-Path $dbFile) {
            try {
                Remove-Item $dbFile -Force
                Write-ColorText "✅ Removed $dbFile" Green
            }
            catch {
                Write-ColorText "⚠️ Could not remove $dbFile" Yellow
            }
        }
    }
}

# Clear any stuck ports (Windows sometimes keeps them open)
Write-Host ""
Write-ColorText "🔧 Clearing network ports..." Blue
try {
    # Reset TCP connections on the ports we use
    netsh int ip reset | Out-Null
    Write-ColorText "✅ Network reset completed" Green
}
catch {
    Write-ColorText "⚠️ Network reset failed (may require administrator privileges)" Yellow
}

# Display final status
Write-Host ""
Write-ColorText "============================================" Blue
Write-ColorText "✅ System Reset Complete" Green
Write-ColorText "============================================" Blue
Write-Host ""

if ($ClearDatabase) {
    Write-ColorText "Database cleared - all event history removed" Yellow
}

Write-ColorText "🚀 Ready to start fresh with:" Blue
Write-ColorText "   .\scripts\start-system.ps1" Green
Write-ColorText "   or" White
Write-ColorText "   docker-compose up -d" Green

Write-Host ""
Write-ColorText "All processes stopped and ports freed" Green