# 照片清单生成器（双击 更新照片清单.bat 即可运行）
# 扫描本文件夹里的图片，把文件名写进 ../assets/photos.js
$ErrorActionPreference = "Stop"

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$folder = Split-Path $dir -Leaf

$files = Get-ChildItem -LiteralPath $dir -File |
  Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|gif|avif)$' } |
  Sort-Object Name

$items = foreach ($f in $files) {
  $name = $f.Name.Replace('\', '\\').Replace('"', '\"')
  '"' + $folder + '/' + $name + '"'
}

$js = "window.SCENE_PHOTOS = [" + ($items -join ",") + "];`r`n"
$out = Join-Path (Split-Path $dir -Parent) "assets\photos.js"
[System.IO.File]::WriteAllText($out, $js, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ""
Write-Host ("  Photos found : " + $files.Count)
Write-Host ("  Written to   : assets/photos.js")
Write-Host ""
if ($files.Count -eq 0) {
  Write-Host "  No image found. Put jpg / png / webp files in this folder first."
}
Write-Host "  Refresh the page (Ctrl+F5) to see the new photos."
Write-Host ""
