#!/bin/bash

# SVG를 PNG로 변환하는 스크립트
# 요구사항: ImageMagick (convert 또는 magick 명령어)

# 색상 설정
BG_COLOR="#4CAF50"
STROKE_COLOR="#388E3C"

echo "아이콘 생성 중..."

# 필수 디렉토리 생성
mkdir -p assets

# SVG 파일 경로
SVG_FILE="assets/icon.svg"

# PNG 생성 (다양한 크기)
if command -v convert &> /dev/null; then
    echo "ImageMagick으로 PNG 생성..."

    convert -background none -density 1200 -resize 16x16 "$SVG_FILE" "assets/icon-16.png"
    convert -background none -density 1200 -resize 48x48 "$SVG_FILE" "assets/icon-48.png"
    convert -background none -density 1200 -resize 128x128 "$SVG_FILE" "assets/icon-128.png"

    echo "✓ 아이콘 생성 완료!"
    ls -lh assets/icon-*.png
else
    echo "❌ ImageMagick이 설치되어 있지 않습니다."
    echo "설치 방법:"
    echo "  - macOS: brew install imagemagick"
    echo "  echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - Windows: https://imagemagick.org/script/download.php"
    echo ""
    echo "또는 온라인 도구로 변환:"
    echo "  - https://convertio.co/svg-png/"
    echo "  - https://cloudconvert.com/svg-to-png"
fi
