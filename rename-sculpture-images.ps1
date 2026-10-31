# rename-sculpture-images.ps1
# Fixes the 24 art/sculpture image filenames so they match db.json.
# Run from the decoria project root:
#   powershell -ExecutionPolicy Bypass -File .\rename-sculpture-images.ps1

$dir = Join-Path (Get-Location) "src\assets\images\products"
if (-not (Test-Path $dir)) {
    Write-Host "Folder not found: $dir" -ForegroundColor Red
    Write-Host "Run this script from the decoria project root." -ForegroundColor Red
    exit 1
}

# old base name (without -N.jpg)  ->  correct base name
$map = [ordered]@{
    "art-sculpture-art-sculpture-bowl-il-passagio-liten-or-the-passage-small-designed-by-inger-sannes-1321" = "art-sculpture-bowl-il-passagio-liten-or-the-passage-small-designed-by-inger-sannes-1321"
    "art-sculpture-art-sculpture-by-einar-hoste-1361" = "art-sculpture-by-einar-hoste-1361"
    "art-sculpture-art-sculpture-by-hugo-liisberg-3101" = "art-sculpture-by-hugo-liisberg-3101"
    "art-sculpture-art-sculpture-by-jorgen-larsen-3606" = "art-sculpture-wall-sculpture-by-jorgen-larsen-3606"
    "art-sculpture-art-sculpture-by-nils-g-stenqvist-1826" = "art-sculpture-by-nils-g-stenqvist-1826"
    "art-sculpture-art-sculpture-by-torsten-johansson-2401" = "art-sculpture-by-torsten-johansson-2401"
    "art-sculpture-art-sculpture-designed-by-torsten-johansson-2259" = "art-sculpture-designed-by-torsten-johansson-2259"
    "art-sculpture-blasegel-designed-by-stig-ake-lund-868" = "art-sculpture-framed-sculpture-blasegel-designed-by-stig-ake-lund-868"
}

$renamed = 0; $skipped = 0; $missing = 0
foreach ($old in $map.Keys) {
    $new = $map[$old]
    foreach ($n in 1..3) {
        $src = Join-Path $dir "$old-$n.jpg"
        $dst = Join-Path $dir "$new-$n.jpg"
        if (Test-Path -LiteralPath $src) {
            if (Test-Path -LiteralPath $dst) {
                $skipped++; Write-Host "SKIP (target exists): $(Split-Path $dst -Leaf)" -ForegroundColor Yellow
            } else {
                Rename-Item -LiteralPath $src -NewName (Split-Path $dst -Leaf)
                $renamed++; Write-Host "OK: $(Split-Path $src -Leaf) -> $(Split-Path $dst -Leaf)" -ForegroundColor Green
            }
        } else {
            if (Test-Path -LiteralPath $dst) {
                $skipped++; Write-Host "SKIP (already renamed): $(Split-Path $dst -Leaf)" -ForegroundColor DarkGray
            } else {
                $missing++; Write-Host "NOT FOUND: $(Split-Path $src -Leaf)" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "Renamed: $renamed / 24   Skipped: $skipped   Not found: $missing" -ForegroundColor Cyan
Write-Host "Now verify with:  node tools/validate-images.mjs" -ForegroundColor Cyan
