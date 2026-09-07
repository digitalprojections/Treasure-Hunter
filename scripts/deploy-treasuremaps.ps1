param(
  [string]$KeyPath = "C:\Users\denta\source\repos\created-link-lightsail.pem",
  [string]$RemoteUser = "ubuntu",
  [string]$RemoteHost = "created.link",
  [string]$RemoteDir = "/home/ubuntu/migration/public_html/treasuremaps"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$archivePath = Join-Path $repoRoot "dist\treasuremaps-dist.zip"
$remoteArchive = "/tmp/treasuremaps-dist.zip"
$remoteStage = "/tmp/treasuremaps-dist"

Push-Location $repoRoot
try {
  $env:VITE_GAMES_API_URL = "https://battleship.created.link"
  npx.cmd vite build --base /treasuremaps/
  if ($LASTEXITCODE -ne 0) { throw "Vite build failed with exit code $LASTEXITCODE" }

  $jsFiles = Get-ChildItem -Path "dist\assets" -Filter "*.js" -File
  $bundleHasBackend = $jsFiles | Where-Object { (Get-Content -LiteralPath $_.FullName -Raw).Contains("https://battleship.created.link") } | Select-Object -First 1
  if (-not $bundleHasBackend) { throw "Built bundle does not contain https://battleship.created.link" }

  $html = Get-Content -LiteralPath "dist\index.html" -Raw
  if (-not $html.Contains('/treasuremaps/assets/')) { throw "Built HTML does not reference /treasuremaps/assets/" }

  if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
  Compress-Archive -Path "dist\*" -DestinationPath $archivePath -Force

  ssh -i $KeyPath "$RemoteUser@$RemoteHost" "rm -rf $remoteStage $remoteArchive && mkdir -p $remoteStage"
  if ($LASTEXITCODE -ne 0) { throw "Remote staging cleanup failed with exit code $LASTEXITCODE" }

  scp -i $KeyPath $archivePath "$RemoteUser@$RemoteHost`:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "Upload failed with exit code $LASTEXITCODE" }

  ssh -i $KeyPath "$RemoteUser@$RemoteHost" "unzip -q $remoteArchive -d $remoteStage && sudo mkdir -p $RemoteDir && sudo find $RemoteDir -mindepth 1 -maxdepth 1 -exec rm -rf {} + && sudo cp -a $remoteStage/. $RemoteDir/ && sudo chown -R www-data:www-data $RemoteDir && rm -rf $remoteStage $remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "Remote install failed with exit code $LASTEXITCODE" }

  Write-Host "Deployed Treasure Hunter to https://created.link/treasuremaps/"
}
finally {
  Pop-Location
}
