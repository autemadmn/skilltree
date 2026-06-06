$ErrorActionPreference = "Stop"

$Port = 5305
$Url = "http://127.0.0.1:$Port/"
$AppRoot = Split-Path -Parent $PSScriptRoot
$Npm = "C:\Program Files\nodejs\npm.cmd"

function Show-LauncherMessage {
  param([string] $Message)

  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show($Message, "Neural Skill Tree") | Out-Null
}

function Test-AppIsRunning {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

try {
  if (-not (Test-Path $Npm)) {
    $command = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($command) {
      $Npm = $command.Source
    }
  }

  if (-not (Test-Path $Npm)) {
    Show-LauncherMessage "Node.js/npm was not found. Install Node.js, then run npm install in the app folder."
    exit 1
  }

  if (-not (Test-Path (Join-Path $AppRoot "node_modules"))) {
    Show-LauncherMessage "Dependencies are missing. Open the app folder and run npm install once before using the desktop shortcut."
    exit 1
  }

  if (-not (Test-AppIsRunning)) {
    Start-Process -FilePath $Npm -ArgumentList @("run", "dev", "--", "--port", "$Port", "--strictPort") -WorkingDirectory $AppRoot -WindowStyle Hidden

    $ready = $false
    for ($i = 0; $i -lt 30; $i += 1) {
      Start-Sleep -Milliseconds 700
      if (Test-AppIsRunning) {
        $ready = $true
        break
      }
    }

    if (-not $ready) {
      Show-LauncherMessage "The local app server did not start on port $Port. Try running npm run dev manually from the app folder."
      exit 1
    }
  }

  Start-Process $Url
} catch {
  Show-LauncherMessage $_.Exception.Message
  exit 1
}
