# Supratim model evaluation harness
# Usage:
#   powershell -File scripts\run-eval.ps1 -Model sarvam-105b [-TimeoutSec 600] [-Tasks 1,2,3]
#   powershell -File scripts\run-eval.ps1 -Model sarvam-30b  [-Debug] [-MaxTokens 8192]
param(
    [string]  $Model       = "sarvam-30b",
    [int]     $TimeoutSec  = 180,
    [string]  $Tasks       = "1,2,3,4,5,6",  # comma-separated task IDs
    [switch]  $Debug,
    [int]     $MaxTokens   = 0,   # 0 = use model default
    [int]     $MaxTurns    = 30,  # 0 = disable turn-limit guard
    [int]     $CooldownSec = 0    # seconds to wait between tasks (rate-limit spacing)
)

$Root      = Split-Path $PSScriptRoot -Parent
$CliPath   = Join-Path $Root "dist\cli.js"
$OutDir    = Join-Path $Root "docs\eval-transcripts"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$allTasks = Get-Content (Join-Path $PSScriptRoot "eval-tasks.json") -Raw | ConvertFrom-Json
$taskIds  = $Tasks.Split(',') | ForEach-Object { [int]$_.Trim() }
$runTasks = $allTasks | Where-Object { $taskIds -contains $_.id }

$suffix  = if ($Debug) { "-debug" } elseif ($MaxTokens -gt 0) { "-mt$MaxTokens" } else { "" }
$results = @()

Write-Host ""
Write-Host "=== Supratim eval: $Model$suffix (timeout=${TimeoutSec}s) ===" -ForegroundColor Cyan
Write-Host "Tasks: $($taskIds -join ', ')   Debug: $Debug   MaxTokens: $(if ($MaxTokens -gt 0) { $MaxTokens } else { 'default' })   MaxTurns: $MaxTurns   Cooldown: ${CooldownSec}s"
Write-Host "Output dir: $OutDir"
Write-Host ""

# Patch ~/.supratim/models.json maxTokens temporarily if requested
$modelsCfgPath = Join-Path $env:USERPROFILE ".supratim\models.json"
$origModelsCfg = $null
if ($MaxTokens -gt 0 -and (Test-Path $modelsCfgPath)) {
    $origModelsCfg = Get-Content $modelsCfgPath -Raw
    $cfg = $origModelsCfg | ConvertFrom-Json
    foreach ($prov in $cfg.providers.PSObject.Properties) {
        foreach ($m in $prov.Value.models) {
            if ($m.id -eq $Model) { $m.maxTokens = $MaxTokens }
        }
    }
    [System.IO.File]::WriteAllText($modelsCfgPath, ($cfg | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
    Write-Host ("Patched ${modelsCfgPath}: $Model maxTokens -> $MaxTokens") -ForegroundColor Yellow
}

foreach ($task in $runTasks) {
    $tid     = $task.id
    $prompt  = $task.prompt
    $outFile = Join-Path $OutDir "${Model}${suffix}-task${tid}.txt"

    Write-Host "--- Task $tid ---" -ForegroundColor Yellow
    Write-Host ($prompt.Substring(0, [Math]::Min(90, $prompt.Length)) + "...")
    Write-Host "Running (timeout ${TimeoutSec}s)..."

    $start = Get-Date

    $job = Start-Job -ScriptBlock {
        param($cli, $workDir, $model, $promptText, $enableDebug, $maxTurns)
        $env:SUPRATIM_MODEL = $model
        if ($enableDebug) { $env:SUPRATIM_DEBUG = "1" }
        if ($maxTurns -gt 0) { $env:SUPRATIM_MAX_TURNS = "$maxTurns" }
        Set-Location $workDir
        & node $cli "--print" $promptText 2>&1
    } -ArgumentList $CliPath, $Root, $Model, $prompt, ([bool]$Debug), $MaxTurns

    $finished = $job | Wait-Job -Timeout $TimeoutSec
    $timedOut = ($null -eq $finished)
    if ($timedOut) {
        $job | Stop-Job -PassThru | Out-Null
        $output = "[HARNESS: TIMED OUT after ${TimeoutSec}s]"
        $exitState = "TIMEOUT"
    } else {
        $output   = $job | Receive-Job
        $exitState = $job.ChildJobs[0].JobStateInfo.State
    }
    $job | Remove-Job -ErrorAction SilentlyContinue

    $text    = if ($output -is [Array]) { $output -join "`n" } else { "$output" }
    Set-Content -Path $outFile -Value $text -Encoding UTF8

    $elapsed   = [int]((Get-Date) - $start).TotalSeconds
    $completed = if ($timedOut)                 { "timeout" }
                 elseif ($text.Length -lt 30)   { "empty" }
                 else                           { "yes" }

    $color = if ($completed -eq "yes") { "Green" } else { "Red" }
    Write-Host "  state=$exitState  elapsed=${elapsed}s  completed=$completed  chars=$($text.Length)" -ForegroundColor $color
    Write-Host "  -> $outFile"
    if ($CooldownSec -gt 0) {
        Write-Host "  Cooling down ${CooldownSec}s before next task..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $CooldownSec
    }
    Write-Host ""

    $results += [PSCustomObject]@{
        Model     = "$Model$suffix"
        Task      = $tid
        Elapsed   = $elapsed
        State     = "$exitState"
        Completed = $completed
        Chars     = $text.Length
    }
}

# Restore models.json if patched
if ($null -ne $origModelsCfg) {
    [System.IO.File]::WriteAllText($modelsCfgPath, $origModelsCfg, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Restored $modelsCfgPath" -ForegroundColor Yellow
}

Write-Host "=== Summary: $Model$suffix ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$summaryFile = Join-Path $OutDir "${Model}${suffix}-summary.json"
$results | ConvertTo-Json | Set-Content $summaryFile -Encoding UTF8
Write-Host "Summary -> $summaryFile"
