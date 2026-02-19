# Charset Switcher 개발 가이드

## 프로젝트 구조

```
charset-switcher-extension/
├── manifest.json              # Chrome 확장 설정 파일
├── package.json               # 프로젝트 메타정보
├── README.md                  # 프로젝트 설명서
├── DEVELOPMENT.md             # 이 파일
├── .gitignore                 # Git 무시 파일
│
├── assets/
│   └── icon.svg              # 확장 아이콘 (SVG)
│
├── scripts/
│   ├── generate-icons.sh     # PNG 생성 스크립트 (Bash)
│   └── generate-icons.ps1    # PNG 생성 스크립트 (PowerShell)
│
└── src/
    ├── common/               # 공용 모듈
    │   ├── constants.js      # 상수 정의
    │   ├── storage.js        # Chrome Storage API 래퍼
    │   └── utils.js          # 유틸리티 함수
    │
    ├── popup/                # 팝업 UI
    │   ├── popup.html        # 팝업 마크업
    │   └── popup.js          # 팝업 로직
    │
    ├── background/           # 백그라운드 서비스
    │   └── background.js     # 우클릭 메뉴, 배지 관리
    │
    ├── content/              # 콘텐츠 스크립트
    │   └── content.js        # 인코딩 강제 적용
    │
    └── settings/             # 설정 페이지
        ├── settings.html     # 설정 마크업
        └── settings.js       # 설정 로직
```

## 주요 파일 설명

### manifest.json
Chrome 확장의 메인 설정 파일:
- 확장 정보 (이름, 버전, 설명)
- 권한 설정
- 액션 (팝업, 아이콘)
- 백그라운드 서비스 워커
- 콘텐츠 스크립트
- 옵션 페이지

### 공용 모듈 (src/common/)

**constants.js**
- 기본 인코딩 목록
- Chrome Storage 키 정의

**storage.js**
- 사이트별 설정 저장/로드
- 사용자정의 인코딩 관리
- 기본 설정 관리
- 모든 인코딩 목록 조회

**utils.js**
- URL에서 도메인 추출
- 현재 인코딩 조회
- 인코딩 메타 태그 설정

### 팝업 (src/popup/)

**popup.html**
- 도메인 표시
- 인코딩 선택 드롭다운
- 적용/제거 버튼
- 설정 페이지 링크

**popup.js**
- 인코딩 목록 로드
- 현재 도메인 정보 표시
- 인코딩 적용/제거 처리
- 메시지 표시

### 백그라운드 서비스 (src/background/)

**background.js**
- 우클릭 메뉴 생성/관리
- 우클릭 메뉴 이벤트 처리
- 배지 업데이트
- 탭 활성화 시 배지 업데이트
- 저장소 변경 감시

### 콘텐츠 스크립트 (src/content/)

**content.js**
- 페이지 로드 시 자동으로 저장된 인코딩 적용
- 팝업/메뉴에서 인코딩 변경 요청 수신
- 메타 태그를 통해 인코딩 강제 적용

### 설정 페이지 (src/settings/)

**settings.html**
- 기본 인코딩 선택
- 기본/사용자정의 인코딩 목록 표시
- 사용자정의 인코딩 추가 입력
- 사이트별 설정 관리

**settings.js**
- 인코딩 목록 표시
- 사용자정의 인코딩 추가/제거
- 사이트 설정 개별 제거
- 저장소 변경 감시

## 설치 및 개발

### 1. 프로젝트 클론
```bash
git clone <repo-url>
cd charset-switcher-extension
```

### 2. Chrome에서 로드

1. Chrome 주소창에 `chrome://extensions/` 입력
2. 우측 상단 "개발자 모드" 활성화
3. "확장 프로그램 로드" 클릭
4. 프로젝트 폴더 선택

### 3. 개발 시작

파일 수정 후 Chrome을 새로고침하면 자동으로 재로드됩니다.
(확장 관리 페이지에서 새로고침 아이콘 클릭)

## 코드 스타일

- **JavaScript**: ES6+ 모듈 문법 사용
- **네이밍**: camelCase (함수, 변수), PascalCase (클래스)
- **비동기**: async/await 사용
- **주석**: 복잡한 로직에만 추가

## 테스트 방법

### 팝업 테스트
1. 확장 아이콘 클릭
2. 팝업이 열림
3. 인코딩 선택 및 적용 테스트

### 우클릭 메뉴 테스트
1. 웹페이지에서 우클릭
2. "인코딩 변경" 메뉴 확인
3. 인코딩 선택 및 적용 테스트

### 설정 페이지 테스트
1. 팝업의 ⚙️ 버튼 클릭 (또는 확장 관리에서 "옵션")
2. 사용자정의 인코딩 추가/제거 테스트
3. 사이트 설정 관리 테스트

### 콘솔 확인
1. Chrome DevTools 열기 (F12)
2. Chrome 확장 콘솔 확인
   - 팝업: PopUp 페이지 DevTools
   - 백그라운드: Service Workers
   - 콘텐츠: 웹페이지 Console

## 문제 해결

### 메뉴가 나타나지 않는 경우
1. 탭 새로고침
2. 확장 재로드
3. 콘솔에서 에러 확인

### 인코딩이 적용되지 않는 경우
1. 콘텐츠 스크립트가 로드되었는지 확인
2. 메타 태그 설정 후 페이지 새로고침 필요
3. 일부 특수 페이지는 작동하지 않을 수 있음

### 배지가 표시되지 않는 경우
1. 백그라운드 서비스 워커 확인
2. 탭 활성화 후 확인
3. 콘솔 에러 확인

## 배포

### Chrome Web Store에 게시할 때
1. 아이콘 PNG 버전 생성 (선택사항)
2. manifest.json 버전 업데이트
3. package.json 버전 업데이트
4. 배포 가능한 ZIP 생성

## 참고 자료

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
