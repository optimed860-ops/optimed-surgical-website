# Saves your Supabase values into .env.local.
# The values are typed only in your own terminal. Nothing is sent anywhere.
# Run from the project folder:
#   powershell -ExecutionPolicy Bypass -File scripts\set-supabase-keys.ps1

$ErrorActionPreference = 'Stop'
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path (Split-Path $PSScriptRoot -Parent) '.env.example') $envFile
}

function Read-Value([string]$prompt, [string]$pattern, [string]$hint, [switch]$secret) {
  while ($true) {
    if ($secret) {
      $secure = Read-Host $prompt -AsSecureString
      $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
      try { $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
      finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    } else {
      $value = Read-Host $prompt
    }
    $value = "$value".Trim()
    if ($value -match $pattern) { return $value }
    Write-Host "  That doesn't look right. $hint" -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host 'Supabase dashboard -> Project Settings -> Data API / API Keys' -ForegroundColor Cyan
Write-Host ''

$url = Read-Value 'Project URL (https://xxxx.supabase.co)' '^https://[a-z0-9-]+\.supabase\.co/?$' 'It should look like https://abcd1234.supabase.co'
$url = $url.TrimEnd('/')
$publishable = Read-Value 'Publishable key (sb_publishable_...)' '^(sb_publishable_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9._-]{50,})$' 'Copy the Publishable key (starts with sb_publishable_).'
$secretKey = Read-Value 'Secret key (sb_secret_...) - hidden while typing' '^(sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9._-]{50,})$' 'Copy the Secret key (starts with sb_secret_).' -secret

$values = [ordered]@{
  'NEXT_PUBLIC_SUPABASE_URL'             = $url
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' = $publishable
  'SUPABASE_SECRET_KEY'                  = $secretKey
}

$lines = [System.Collections.Generic.List[string]]::new()
foreach ($line in [IO.File]::ReadAllLines($envFile)) { $lines.Add($line) }

foreach ($key in $values.Keys) {
  $index = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$key\s*=") { $index = $i; break }
  }
  $newLine = "$key=$($values[$key])"
  if ($index -ge 0) { $lines[$index] = $newLine } else { $lines.Add($newLine) }
}

# UTF-8 without BOM so Next.js reads the first line correctly.
[IO.File]::WriteAllLines($envFile, $lines, (New-Object System.Text.UTF8Encoding($false)))
$secretKey = $null

Write-Host ''
Write-Host 'Saved to .env.local. Restart "npm run dev" if it is running.' -ForegroundColor Green
