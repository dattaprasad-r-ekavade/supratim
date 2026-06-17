# Supratim model evaluation harness
# Usage:
#   powershell -File scripts\run-eval.ps1 -Model sarvam-105b [-TimeoutSec 600] [-Tasks 1,2,3]
#   powershell -File scripts\run-eval.ps1 -Provider ollama-cloud -Model "qwen3-coder:480b" -ApiKeyFile ollamakey.txt
param(
    [string]  $Provider     = "sarvam",
    [string]  $Model       = "",
    [int]     $TimeoutSec  = 180,
    [string]  $Tasks       = "1,2,3,4,5,6",
    [string]  $ApiKeyFile  = "",
    [switch]  $Debug,
    [int]     $MaxTokens   = 0,
    [int]     $MaxTurns    = 30,
    [int]     $CooldownSec = 0
)

$Root      = Split-Path $PSScriptRoot -Parent
$CliPath   = Join-Path $Root "dist\cli.js"
$OutDir    = Join-Path $Root "docs\eval-transcripts"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

if (-not $Model) {
    $Model = if ($Provider -eq "ollama-cloud") { "qwen3-coder:480b" } else { "sarvam-30b" }
}

$fileModel = $Model -replace ':', '-'

$allTasks = Get-Content (Join-Path $PSScriptRoot "eval-tasks.json") -Raw | ConvertFrom-Json
$taskIds  = $Tasks.Split(',') | ForEach-Object { [int]$_.Trim() }
$runTasks = $allTasks | Where-Object { $taskIds -contains $_.id }

$suffix  = if ($Debug) { "-debug" } elseif ($MaxTokens -gt 0) { "-mt$MaxTokens" } else { "" }
$tag     = if ($Provider -eq "sarvam") { "$Model$suffix" } else { "$Provider-$fileModel$suffix" }
$results = @()

Write-Host ""
Write-Host "=== Supratim eval: $tag (timeout=${TimeoutSec}s) ===" -ForegroundColor Cyan
Write-Host "Provider: $Provider   Model: $Model   Tasks: $($taskIds -join ', ')   Debug: $Debug   MaxTokens: $(if ($MaxTokens -gt 0) { $MaxTokens } else { 'default' })   MaxTurns: $MaxTurns   Cooldown: ${CooldownSec}s"
Write-Host "Output dir: $OutDir"
Write-Host ""

# Merge ollama-cloud provider from bundled config into ~/.supratim/models.json
$modelsCfgPath = Join-Path $env:USERPROFILE ".supratim\models.json"
$origModelsCfg = $null
if ($Provider -eq "ollama-cloud" -and (Test-Path $modelsCfgPath)) {
    $origModelsCfg = Get-Content $modelsCfgPath -Raw -Encoding UTF8
    $userCfg = $origModelsCfg | ConvertFrom-Json
    $bundled = Get-Content (Join-Path $Root "config\models.json") -Raw -Encoding UTF8 | ConvertFrom-Json
    $userCfg.providers | Add-Member -NotePropertyName "ollama-cloud" -NotePropertyValue $bundled.providers."ollama-cloud" -Force
    [System.IO.File]::WriteAllText($modelsCfgPath, ($userCfg | ConvertTo-Json -Depth 12), [System.Text.UTF8Encoding]::new($false))
    Write-Host "Merged ollama-cloud provider into $modelsCfgPath" -ForegroundColor Yellow
}

# Resolve API key for Ollama
$ollamaKey = $null
if ($Provider -eq "ollama-cloud") {
    $keyPath = if ($ApiKeyFile) { Join-Path $Root $ApiKeyFile } else { Join-Path $Root "ollamakey.txt" }
    if (Test-Path $keyPath) {
        $raw = Get-Content $keyPath -Raw
        if ($raw -match 'key\s*=\s*([^\s\r\n]+)') { $ollamaKey = $Matches[1].Trim() }
        elseif ($raw.Trim() -and -not $raw.Contains('=')) { $ollamaKey = $raw.Trim() }
    }
    if (-not $ollamaKey) { Write-Host "ERROR: No Ollama API key in $keyPath" -ForegroundColor Red; exit 1 }
}

# Patch ~/.supratim/models.json maxTokens temporarily if requested
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
    $outFile = Join-Path $OutDir "${tag}-task${tid}.txt"

    Write-Host "--- Task $tid ---" -ForegroundColor Yellow
    Write-Host ($prompt.Substring(0, [Math]::Min(90, $prompt.Length)) + "...")
    Write-Host "Running (timeout ${TimeoutSec}s)..."

    $start = Get-Date

    $job = Start-Job -ScriptBlock {
        param($cli, $workDir, $provider, $model, $promptText, $enableDebug, $maxTurns, $apiKey)
        $env:SUPRATIM_PROVIDER = $provider
        $env:SUPRATIM_MODEL = $model
        if ($provider -eq "ollama-cloud") { $env:OLLAMA_API_KEY = $apiKey }
        if ($enableDebug) { $env:SUPRATIM_DEBUG = "1" }
        if ($maxTurns -gt 0) { $env:SUPRATIM_MAX_TURNS = "$maxTurns" }
        Set-Location $workDir
        & node $cli "--print" $promptText 2>&1
    } -ArgumentList $CliPath, $Root, $Provider, $Model, $prompt, ([bool]$Debug), $MaxTurns, $ollamaKey

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
        Model     = $tag
        Task      = $tid
        Elapsed   = $elapsed
        State     = "$exitState"
        Completed = $completed
        Chars     = $text.Length
    }
}

# Restore models.json if patched or merged
if ($null -ne $origModelsCfg) {
    [System.IO.File]::WriteAllText($modelsCfgPath, $origModelsCfg, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Restored $modelsCfgPath" -ForegroundColor Yellow
}

Write-Host "=== Summary: $tag ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$summaryFile = Join-Path $OutDir "${tag}-summary.json"
$results | ConvertTo-Json | Set-Content $summaryFile -Encoding UTF8
Write-Host "Summary -> $summaryFile"
