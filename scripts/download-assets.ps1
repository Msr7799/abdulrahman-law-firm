$ErrorActionPreference = "Stop"
$directories = @("public/assets/images", "public/assets/icons", "public/assets/logos", "public/assets/backgrounds")
foreach ($directory in $directories) { New-Item -ItemType Directory -Force -Path $directory | Out-Null }
Write-Host "Asset directories are ready. Add only an owner-approved direct URL after recording its source and licence in ASSETS.md."
