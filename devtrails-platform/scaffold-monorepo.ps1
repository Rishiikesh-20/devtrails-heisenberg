Param(
    [switch]$CreateServiceSkeletons = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Scaffolding DevTrails monorepo structure..."

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$requiredDirs = @(
    "infra",
    "backend-go",
    "ai-engine-python",
    "oracle-service",
    "frontend-pwa"
)

foreach ($dir in $requiredDirs) {
    $path = Join-Path $root $dir
    if (-not (Test-Path -Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "Created: $path"
    }
    else {
        Write-Host "Exists:  $path"
    }
}

if ($CreateServiceSkeletons) {
    $extraDirs = @(
        "backend-go\cmd\server",
        "backend-go\internal\config",
        "backend-go\internal\handlers",
        "backend-go\internal\store",
        "infra\init-scripts\postgres",
        "infra\init-scripts\clickhouse",
        "ai-engine-python\app",
        "oracle-service\src",
        "frontend-pwa\app"
    )

    foreach ($dir in $extraDirs) {
        $path = Join-Path $root $dir
        if (-not (Test-Path -Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            Write-Host "Created: $path"
        }
        else {
            Write-Host "Exists:  $path"
        }
    }
}

Write-Host "Done."
