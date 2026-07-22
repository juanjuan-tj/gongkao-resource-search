param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,
  [string]$OutputFile
)

$scriptDirectory = Split-Path -Parent $PSCommandPath
if (-not $OutputFile) {
  $OutputFile = Join-Path $scriptDirectory '..\data\resources.json'
}

$lines = Get-Content -LiteralPath $InputFile -Encoding UTF8
$records = [System.Collections.Generic.List[object]]::new()
$title = $null

foreach ($line in $lines) {
  $trimmed = $line.Trim()
  if (-not $trimmed) { continue }

  $linkPrefix = [string][char]0x94FE + [char]0x63A5
  $colonCharacters = [string][char]0xFF1A + ':'
  if ($trimmed -match ("^" + [regex]::Escape($linkPrefix) + "[$colonCharacters]\s*(https?://\S+)$")) {
    if (-not $title) { throw "Link without a preceding title: $trimmed" }
    $records.Add([ordered]@{
      id = $records.Count + 1
      title = $title
      url = $Matches[1]
    })
    $title = $null
  } else {
    if ($title) { throw "Title without a following link: $title" }
    $title = $trimmed
  }
}

if ($title) { throw "Final title without a following link: $title" }

$targetDirectory = Split-Path -Parent $OutputFile
if (-not (Test-Path -LiteralPath $targetDirectory)) {
  New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
}

$records | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $OutputFile -Encoding UTF8
Write-Output "已生成 $($records.Count) 条资料：$OutputFile"
