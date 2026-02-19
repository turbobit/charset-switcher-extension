# Charset Switcher - Chrome 확장 프로그램

웹페이지의 문자 인코딩을 강제로 지정하는 Chrome 확장 프로그램입니다. EUC-KR, UTF-8, GB2312 등 다양한 인코딩을 지원하며, 사이트별로 설정을 저장할 수 있습니다.

## 주요 기능

### 1. 팝업에서 인코딩 변경
- 현재 사이트 표시
- 드롭다운에서 인코딩 선택
- 한 번의 클릭으로 인코딩 변경
- 설정 제거 버튼

### 2. 우클릭 컨텍스트 메뉴
- 페이지에서 우클릭 → "인코딩 변경"
- 모든 인코딩 옵션을 메뉴에서 선택
- 즉시 적용

### 3. 사이트별 설정 자동 저장
- 도메인별로 인코딩 설정 자동 저장
- 같은 사이트 방문 시 자동 적용
- 배지에 현재 인코딩 표시 (예: "UTF", "EUC")

### 4. 설정 페이지
- 기본 인코딩 선택
- 사용자 정의 인코딩 추가/제거
- 저장된 사이트별 설정 관리
- 사이트 설정 개별 제거

## 프로젝트 구조

```
charset-switcher-extension/
├── manifest.json                # Chrome 확장 설정
├── README.md                    # 이 파일
├── src/
│   ├── common/
│   │   ├── constants.js        # 상수 (기본 인코딩 목록, 저장소 키)
│   │   ├── storage.js          # 저장소 관리 함수
│   │   └── utils.js            # 유틸리티 함수
│   ├── popup/
│   │   ├── popup.html          # 팝업 UI
│   │   └── popup.js            # 팝업 로직
│   ├── background/
│   │   └── background.js       # 백그라운드 서비스 워커
│   ├── content/
│   │   └── content.js          # 콘텐츠 스크립트 (인코딩 적용)
│   └── settings/
│       ├── settings.html       # 설정 페이지 UI
│       └── settings.js         # 설정 로직
└── assets/                     # 아이콘 (추후 추가)
```

## 아이콘 생성

기본적으로 SVG 아이콘이 포함되어 있으며, 필요하면 다양한 크기의 PNG로 변환할 수 있습니다.

### PNG 아이콘 생성 (선택사항)

**필수 요구사항:** ImageMagick 설치

**Windows (PowerShell):**
```powershell
cd scripts
.\generate-icons.ps1
```

**macOS/Linux (Bash):**
```bash
cd scripts
bash generate-icons.sh
```

### ImageMagick 설치

**Windows:**
- Chocolatey: `choco install imagemagick`
- 또는 공식 다운로드: https://imagemagick.org/script/download.php

**macOS:**
```bash
brew install imagemagick
```

**Ubuntu/Debian:**
```bash
sudo apt-get install imagemagick
```

## 설치 방법

### 개발 모드에서 설치

1. Chrome 브라우저 열기
2. 주소창에 `chrome://extensions/` 입력
3. 우측 상단의 "개발자 모드" 활성화
4. "확장 프로그램 로드" 버튼 클릭
5. 이 프로젝트 폴더 선택

## 사용 방법

### 팝업을 통한 인코딩 변경
1. Chrome 도구모음에서 확장 아이콘 클릭
2. 현재 사이트 확인
3. 인코딩 선택
4. "적용" 버튼 클릭

### 우클릭 메뉴를 통한 인코딩 변경
1. 웹페이지에서 우클릭
2. "인코딩 변경" 메뉴 선택
3. 원하는 인코딩 선택
4. 즉시 적용됨

### 설정 관리
1. 팝업의 ⚙️ 버튼 클릭 (또는 확장 관리 페이지에서 옵션)
2. 설정 페이지 열기
3. 인코딩 추가/제거
4. 사이트별 설정 관리

## 지원하는 기본 인코딩

- UTF-8
- EUC-KR (한글)
- ISO-8859-1 (Latin)
- GB2312 (중국어 간체)
- BIG5 (중국어 번체)
- Shift_JIS (일본어)
- Windows-1252

## 사용자 정의 인코딩 추가

1. 설정 페이지 열기
2. "사용자 정의 인코딩 추가" 섹션에서:
   - 인코딩 값: 입력 (예: ISO-8859-2)
   - 표시 이름: 입력 (예: ISO-8859-2 (Polish))
3. "추가" 버튼 클릭
4. 우클릭 메뉴와 팝업에서 즉시 사용 가능

## 저장되는 데이터

Chrome의 동기 저장소(Sync Storage)에 저장됩니다:
- `siteCharsetSettings`: 사이트별 인코딩 설정
- `customCharsets`: 사용자 정의 인코딩
- `defaultCharset`: 기본 인코딩

## 주의사항

- 인코딩 변경 후 페이지 새로고침이 필요할 수 있습니다
- 일부 웹사이트는 브라우저의 인코딩 설정을 무시할 수 있습니다
- Chrome의 메타 태그를 통해 인코딩을 강제하므로, 일부 특수한 페이지에서는 작동하지 않을 수 있습니다

## 개발 정보

### 기술 스택
- Manifest V3 (Chrome 확장 최신 버전)
- Vanilla JavaScript (프레임워크 없음)
- Chrome Storage API
- Chrome Context Menus API
- Chrome Scripting API

### 주요 기능 설명

#### content.js (인코딩 적용)
- 페이지 로드 시 자동으로 저장된 인코딩 적용
- 팝업/우클릭 메뉴에서 인코딩 변경 시 즉시 적용
- 메타 태그를 통해 인코딩 강제

#### background.js (백그라운드 서비스)
- 우클릭 메뉴 생성 및 관리
- 배지 표시 (현재 인코딩)
- 인코딩 설정 저장 처리

#### popup.js (팝업 UI)
- 현재 도메인 표시
- 인코딩 선택 및 적용
- 설정 제거

#### settings.js (설정 페이지)
- 인코딩 관리 UI
- 사용자 정의 인코딩 추가/제거
- 사이트별 설정 관리

## 라이선스

MIT License

## 지원

문제가 발생하거나 기능을 요청하려면 이 저장소에 이슈를 등록하세요.
