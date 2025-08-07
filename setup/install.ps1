# Multi-Agent Observability System - PowerShell Installer
# ======================================================
# Windows PowerShell version of the installer script

param(
    [switch]$Help,
    [switch]$Force
)

if ($Help) {
    Write-Host "Multi-Agent Observability System Installer (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\install.ps1 [-Force] [-Help]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Force  Skip confirmation prompts"
    Write-Host "  -Help   Show this help message"
    Write-Host ""
    exit 0
}

# Requires PowerShell 5.1 or later
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "❌ PowerShell 5.1 or later is required" -ForegroundColor Red
    exit 1
}

# Colors and formatting functions
function Write-ColorText($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

function Write-Banner {
    Write-ColorText " ╔══════════════════════════════════════════════════════════════╗" Cyan
    Write-ColorText " ║                                                              ║" Cyan
    Write-ColorText " ║   🔬 Multi-Agent Observability System Installer 🔬         ║" Cyan
    Write-ColorText " ║                                                              ║" Cyan
    Write-ColorText " ║   Real-time monitoring for Claude Code agents               ║" Cyan
    Write-ColorText " ║                                                              ║" Cyan
    Write-ColorText " ╚══════════════════════════════════════════════════════════════╝" Cyan
}

function Write-Progress($current, $total, $message) {
    $percent = [math]::Round(($current / $total) * 100)
    Write-Progress -Activity "Installing Multi-Agent Observability System" -Status $message -PercentComplete $percent
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Install Chocolatey if not present
function Install-Chocolatey {
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-ColorText "📦 Installing Chocolatey package manager..." Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        if (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-ColorText "✅ Chocolatey installed successfully" Green
        } else {
            Write-ColorText "❌ Failed to install Chocolatey" Red
            exit 1
        }
    } else {
        Write-ColorText "✅ Chocolatey is already installed" Green
    }
}

# Install Node.js via Chocolatey
function Install-Node {
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-ColorText "📦 Installing Node.js..." Yellow
        choco install nodejs -y
        
        # Refresh environment
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        if (Get-Command node -ErrorAction SilentlyContinue) {
            Write-ColorText "✅ Node.js installed successfully" Green
        } else {
            Write-ColorText "❌ Failed to install Node.js" Red
            exit 1
        }
    } else {
        Write-ColorText "✅ Node.js is already installed" Green
    }
}

# Install Bun
function Install-Bun {
    if (!(Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-ColorText "📦 Installing Bun..." Yellow
        try {
            powershell -c "irm bun.sh/install.ps1 | iex"
            
            # Add Bun to PATH for current session
            $bunPath = "$env:USERPROFILE\.bun\bin"
            if (Test-Path $bunPath) {
                $env:PATH += ";$bunPath"
            }
            
            if (Get-Command bun -ErrorAction SilentlyContinue) {
                Write-ColorText "✅ Bun installed successfully" Green
            } else {
                Write-ColorText "❌ Failed to install Bun, falling back to npm" Yellow
            }
        } catch {
            Write-ColorText "⚠️ Bun installation failed, will use npm instead" Yellow
        }
    } else {
        Write-ColorText "✅ Bun is already installed" Green
    }
}

# Install Python and UV
function Install-Python {
    if (!(Get-Command python -ErrorAction SilentlyContinue)) {
        Write-ColorText "📦 Installing Python..." Yellow
        choco install python -y
        
        # Refresh environment
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } else {
        Write-ColorText "✅ Python is already installed" Green
    }
    
    # Install UV (Python package manager)
    if (!(Get-Command uv -ErrorAction SilentlyContinue)) {
        Write-ColorText "📦 Installing UV Python package manager..." Yellow
        try {
            powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
            
            # Add UV to PATH for current session  
            $uvPath = "$env:USERPROFILE\.cargo\bin"
            if (Test-Path $uvPath) {
                $env:PATH += ";$uvPath"
            }
            
            if (Get-Command uv -ErrorAction SilentlyContinue) {
                Write-ColorText "✅ UV installed successfully" Green
            } else {
                Write-ColorText "⚠️ UV installation may require manual PATH update" Yellow
            }
        } catch {
            Write-ColorText "⚠️ UV installation failed, will use pip instead" Yellow
        }
    } else {
        Write-ColorText "✅ UV is already installed" Green
    }
}

# Setup environment
function Setup-Environment {
    Write-ColorText "🔧 Setting up environment configuration..." Blue
    
    if (!(Test-Path ".env")) {
        if (Test-Path ".env.sample") {
            Copy-Item ".env.sample" ".env"
        } else {
            @"
# Multi-Agent Observability System Configuration
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional
ENGINEER_NAME=your_name_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here

# LLM Provider for Event Summaries
SUMMARY_LLM_PROVIDER=anthropic
"@ | Out-File -FilePath ".env" -Encoding UTF8
        }
        Write-ColorText "✅ Created .env file" Green
    } else {
        Write-ColorText "⚠️ .env file already exists, skipping..." Yellow
    }
    
    # Create client .env if needed
    if (!(Test-Path "apps\client\.env")) {
        "VITE_MAX_EVENTS_TO_DISPLAY=100" | Out-File -FilePath "apps\client\.env" -Encoding UTF8
        Write-ColorText "✅ Created client .env file" Green
    }
}

# Install dependencies
function Install-Dependencies {
    Write-ColorText "📦 Installing dependencies..." Blue
    
    # Server dependencies
    Write-Progress 1 4 "Installing server dependencies..."
    Set-Location "apps\server"
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        bun install
    } else {
        npm install
    }
    Set-Location "..\..\"
    
    # Client dependencies
    Write-Progress 2 4 "Installing client dependencies..."
    Set-Location "apps\client"
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        bun install
    } else {
        npm install
    }
    Set-Location "..\..\"
    
    # Python dependencies for hooks
    Write-Progress 3 4 "Setting up Python hook dependencies..."
    if (Test-Path ".claude\hooks") {
        Set-Location ".claude\hooks"
        
        if (!(Test-Path "pyproject.toml")) {
            @"
[project]
name = "claude-hooks"
version = "0.1.0"
dependencies = [
    "requests",
    "python-dotenv",
    "anthropic",
    "openai"
]
requires-python = ">=3.8"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
"@ | Out-File -FilePath "pyproject.toml" -Encoding UTF8
        }
        
        if (Get-Command uv -ErrorAction SilentlyContinue) {
            uv sync
        } else {
            pip install requests python-dotenv anthropic openai
        }
        
        Set-Location "..\..\"
    }
    
    Write-Progress 4 4 "Dependencies installation complete!"
    Write-Progress -Completed -Activity "Installing dependencies"
}

# Validate installation
function Test-Installation {
    Write-ColorText "🔍 Validating installation..." Blue
    
    $errors = 0
    
    # Test server
    Set-Location "apps\server"
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        $result = bun run typecheck 2>$null
    } else {
        $result = npx tsc --noEmit 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorText "✅ Server validation passed" Green
    } else {
        Write-ColorText "❌ Server validation failed" Red
        $errors++
    }
    
    Set-Location "..\..\"
    
    if ($errors -gt 0) {
        Write-ColorText "⚠️ Installation completed with warnings" Yellow
    } else {
        Write-ColorText "✅ Installation validation successful!" Green
    }
}

# Main installation function
function Start-Installation {
    Clear-Host
    Write-Banner
    Write-Host ""
    
    Write-ColorText "Starting installation at $(Get-Date)" Magenta
    Write-Host ""
    
    # Administrator check
    if (!(Test-Administrator)) {
        Write-ColorText "⚠️ Consider running as Administrator for smoother installation" Yellow
        if (!$Force) {
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-ColorText "Installation cancelled" Yellow
                exit 0
            }
        }
    }
    
    Write-ColorText "🚀 Beginning installation process..." Blue
    Write-Host ""
    
    try {
        Install-Chocolatey
        Install-Node
        Install-Bun
        Install-Python
        Setup-Environment
        Install-Dependencies
        Test-Installation
        
        # Success message
        Write-Host ""
        Write-ColorText "╔═══════════════════════════════════════════════════════════════╗" Green
        Write-ColorText "║                                                               ║" Green
        Write-ColorText "║  🎉 INSTALLATION COMPLETE! 🎉                               ║" Green
        Write-ColorText "║                                                               ║" Green
        Write-ColorText "║  Your Multi-Agent Observability System is ready to use!      ║" Green
        Write-ColorText "║                                                               ║" Green
        Write-ColorText "╚═══════════════════════════════════════════════════════════════╝" Green
        
        Write-Host ""
        Write-ColorText "📋 Next Steps:" Cyan
        Write-ColorText "   1. Set your API keys in .env" Yellow
        Write-ColorText "   2. Start the system: .\scripts\start-system.ps1" Yellow
        Write-ColorText "   3. Open your browser: http://localhost:5173" Yellow
        Write-ColorText "   4. Test with Claude Code: Run any command and watch events!" Yellow
        
        Write-Host ""
        Write-ColorText "🔧 Quick Commands:" Cyan
        Write-ColorText "   Start system: .\scripts\start-system.ps1" Blue
        Write-ColorText "   Stop system:  .\scripts\reset-system.ps1" Blue
        Write-ColorText "   Test system:  .\scripts\test-system.ps1" Blue
        
        if (!(Test-Path ".env") -or (Select-String "your_anthropic_api_key_here" ".env")) {
            Write-Host ""
            Write-ColorText "⚠️ IMPORTANT: Don't forget to set your ANTHROPIC_API_KEY in .env" Yellow
        }
        
        Write-Host ""
        Write-ColorText "Happy coding with Claude! 🤖✨" Green
        
    } catch {
        Write-ColorText "❌ Installation failed: $($_.Exception.Message)" Red
        exit 1
    }
}

# Handle Ctrl+C
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName "CancelKeyPress" -Action {
    Write-Host ""
    Write-ColorText "Installation interrupted by user" Yellow
    exit 1
}

# Run main installation
Start-Installation