# Load git identity + GitHub PAT from pat.txt (repo root, gitignored).
# Usage: . .\scripts\load-pat.ps1
$patFile = Join-Path (Split-Path $PSScriptRoot -Parent) "pat.txt"
if (-not (Test-Path $patFile)) {
    Write-Error "pat.txt not found at $patFile"
    return
}
Get-Content $patFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        switch ($key) {
            "GIT_NAME"     { $script:GitName = $val; $env:GIT_AUTHOR_NAME = $val; $env:GIT_COMMITTER_NAME = $val }
            "GIT_EMAIL"    { $script:GitEmail = $val; $env:GIT_AUTHOR_EMAIL = $val; $env:GIT_COMMITTER_EMAIL = $val }
            "GITHUB_USER"  { $script:GitHubUser = $val }
            "PAT"          { $script:GitHubPat = $val }
        }
    }
}
if (-not $script:GitHubPat) { Write-Warning "PAT not set in pat.txt" }
