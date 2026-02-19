# SVG를 PNG로 변환하는 PowerShell 스크립트
# 요구사항: ImageMagick 또는 Inkscape

Write-Host "아이콘 생성 중..." -ForegroundColor Green

# 필수 디렉토리 생성
if (!(Test-Path "assets")) {
    New-Item -ItemType Directory -Path "assets" | Out-Null
}

$SVG_FILE = "assets/icon.svg"

# ImageMagick 확인
$convert = Get-Command convert -ErrorAction SilentlyContinue
if ($convert) {
    Write-Host "ImageMagick으로 PNG 생성..." -ForegroundColor Cyan

    # 16x16
    & convert -background none -density 1200 -resize 16x16 "$SVG_FILE" "assets/icon-16.png"
    Write-Host "✓ icon-16.png 생성 완료"

    # 48x48
    & convert -background none -density 1200 -resize 48x48 "$SVG_FILE" "assets/icon-48.png"
    Write-Host "✓ icon-48.png 생성 완료"

    # 128x128
    & convert -background none -density 1200 -resize 128x128 "$SVG_FILE" "assets/icon-128.png"
    Write-Host "✓ icon-128.png 생성 완료"

    Get-Item "assets/icon-*.png" | Select-Object Name, Length
} else {
    Write-Host "❌ ImageMagick이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "설치 방법:" -ForegroundColor Yellow
    Write-Host "1. Chocolatey 사용:" -ForegroundColor Cyan
    Write-Host "   choco install imagemagick"
    Write-Host ""
    Write-Host "2. 또는 공식 사이트에서 다운로드:" -ForegroundColor Cyan
    Write-Host "   https://imagemagick.org/script/download.php"
    Write-Host ""
    Write-Host "3. 또는 온라인 도구 사용:" -ForegroundColor Cyan
    Write-Host "   https://convertio.co/svg-png/"
    Write-Host "   https://cloudconvert.com/svg-to-png"
}
