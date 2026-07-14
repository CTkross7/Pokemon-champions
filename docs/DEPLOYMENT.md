# 배포 가이드 (Cloudflare)

챔스노트(ChampsNote)를 Cloudflare에 배포하고 접속하는 방법입니다.

## ⚡ 흰 화면 문제 해결 (Workers로 배포한 경우)

### Cloudflare 대시보드(Git 연결) 배포 — 권장 설정
Cloudflare가 배포 명령을 **저장소 루트에서** 실행하므로, 설정 파일(`wrangler.toml`)을
**루트에** 두었습니다. 대시보드(Workers & Pages → 프로젝트 → Settings → Builds)에서:
- **Build command**: `cd web && npm install && npm run build`
- **Deploy command**: `npx wrangler deploy`

루트 `wrangler.toml`이 `web/dist`를 에셋으로 지정하므로 node_modules 업로드로 인한
"Asset too large" 오류와 흰 화면이 모두 해결됩니다. 저장소에 커밋만 하면 자동 재배포됩니다.

### 로컬에서 직접 배포
```bash
cd web
npm install        # 최초 1회
npm run deploy     # build 후 루트에서 wrangler deploy 실행
```

배포 후에도 흰 화면이면 **강력 새로고침** 또는 **시크릿창**으로 이전 캐시를 우회하세요.

## 🔤 URL의 계정명(`junghyeonr2d2`) 제거/변경

`champsnote.junghyeonr2d2.workers.dev`에서 `junghyeonr2d2`는 **계정의 workers.dev
서브도메인**입니다. 세 가지 방법이 있습니다:

1. **서브도메인 변경**: 대시보드 → **Workers & Pages** → 우측 **Account details** 또는
   Workers 개요의 서브도메인 항목에서 변경(계정당 1회, 모든 Worker에 적용). 예를 들어
   `ctkross`로 바꾸면 `champsnote.ctkross.workers.dev`가 됩니다.
2. **Pages로 배포(가장 깔끔, 계정명 없음)**: 아래 '방법 A'로 Pages에 배포하면
   `champsnote.pages.dev` 주소가 됩니다 — 계정명이 붙지 않습니다. **권장.**
3. **커스텀 도메인**: `champsnote.com` 구매 후 `ctkross.champsnote.com` 연결(맨 아래 참고).

---

## 커스텀 도메인 접속(`ctkross.champsnote.com`) 및 Pages 배포

챔스노트를 Cloudflare Pages로 배포하고 `ctkross.champsnote.com` 같은
커스텀 도메인으로 접속하는 방법입니다.

> 요약: 저장소를 Cloudflare Pages에 연결하면 자동으로 `champsnote.pages.dev` 주소가
> 생기고, `champsnote.com` 도메인을 소유하고 있으면 `ctkross.champsnote.com` 서브도메인을
> 연결할 수 있습니다. 도메인 구매·DNS 설정은 본인 Cloudflare 계정에서 진행해야 합니다.

## 방법 A — 대시보드 연결 (가장 쉬움, 권장)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**
2. GitHub 저장소 `CTkross7/Pokemon-champions` 선택, 브랜치
   `claude/pokemon-champion-app-design-ynor2x` 지정
3. 빌드 설정:
   - **Framework preset**: None (또는 Vite)
   - **Build command**: `cd web && npm install && npm run build`
   - **Build output directory**: `web/dist`
   - (SPA 라우팅은 `web/public/_redirects`가 자동 처리)
4. **Save and Deploy** → 몇 분 후 `champsnote.pages.dev` 로 접속 가능

## 방법 B — GitHub Actions 자동 배포

`.github/workflows/deploy-cloudflare.yml`가 브랜치 푸시마다 자동 배포합니다.
저장소 **Settings → Secrets and variables → Actions**에 다음 2개를 등록하세요:

- `CLOUDFLARE_API_TOKEN` — Cloudflare에서 "Cloudflare Pages: Edit" 권한 토큰 생성
  (My Profile → API Tokens → Create Token)
- `CLOUDFLARE_ACCOUNT_ID` — 대시보드 우측 또는 Workers & Pages 개요에서 확인

Pages 프로젝트 이름은 `champsnote`로 맞춰야 합니다(첫 배포 시 자동 생성됨).

## 커스텀 도메인 연결 (`ctkross.champsnote.com`)

1. `champsnote.com` 도메인을 보유해야 합니다(Cloudflare Registrar 또는 외부 등록기관에서
   구매 후 Cloudflare에 네임서버 연결)
2. Pages 프로젝트 → **Custom domains** → **Set up a custom domain**
3. `ctkross.champsnote.com` 입력 → Cloudflare가 CNAME 레코드를 자동 추가
4. 발급 완료 후 해당 주소로 전 세계에서 접속 가능(HTTPS 자동)

> 참고: 도메인을 아직 구매하지 않았다면, 먼저 `champsnote.pages.dev` 기본 주소로 접속해
> 확인할 수 있습니다. 커스텀 도메인은 언제든 추가할 수 있습니다.

## 로컬 미리보기

```bash
cd web
npm install
npm run build
npm run preview   # http://localhost:4173
```

---

## 커뮤니티 갤러리 활성화 (선택 · Cloudflare D1)

공개 샘플 갤러리는 **선택 기능**입니다. 설정하지 않아도 사이트는 정상 작동하며
`/api/*`는 503을 반환하고 갤러리는 "준비 중"으로 표시됩니다. 활성화하려면(1회):

```bash
# 저장소 루트에서 실행
# 1) D1 데이터베이스 생성 → 출력된 database_id 복사
npx wrangler d1 create champsnote
# 2) 루트 wrangler.toml 하단의 [[d1_databases]] 블록 주석 해제 후 database_id 붙여넣기
# 3) 테이블 생성(원격)
npx wrangler d1 execute champsnote --file=web/schema.sql --remote
# 4) 커밋/푸시(자동 재배포) 또는  cd web && npm run deploy
```

이후 팀빌더의 '커뮤니티에 공개' 버튼으로 팀을 올리면 `/gallery`에 표시되고,
좋아요·가져오기가 동작합니다. (샘플은 D1에 저장됨)

---

## Cloudflare Pages에서 API(갤러리·계정) 동작 원리

Pages는 정적 파일만 올리는 게 기본이지만, 빌드 산출물(`web/dist`)에 **`_worker.js`**가
있으면 **고급 모드(advanced mode)**로 전환되어 그 Worker가 모든 요청을 처리합니다.
`npm run build`가 자동으로 `worker/index.ts`를 `dist/_worker.js`로 번들하므로,
Pages에서도 `/api/*`(갤러리·계정)와 SPA 라우팅이 그대로 동작합니다. (별도 설정 불필요)

- 정적 파일: `_worker.js`가 `env.ASSETS`로 서빙
- 클라이언트 라우트(`/dex/...` 등): 파일이 없으면 `index.html` 폴백
- `/api/*`: 갤러리·계정 핸들러

> Pages 대시보드 빌드 설정: Build command `cd web && npm install && npm run build`,
> Build output directory `web/dist`.

## Pages에 D1 바인딩 연결 (대시보드)

`wrangler.toml`의 D1 설정은 **Workers 배포**용입니다. **Pages 배포**는 대시보드에서
바인딩을 따로 지정해야 합니다:

1. **Workers & Pages → (Pages 프로젝트) champsnote → Settings → Bindings**
   (또는 Functions → D1 database bindings)
2. **Add binding** → Variable name `DB`, D1 database `champsnote` 선택 → 저장
3. D1 콘솔에서 `web/schema.sql`의 테이블(samples·users·sessions)을 1회 실행
4. 재배포 후 `/api/samples`가 `{"samples":[]}`(200)이면 정상

---

## 계정 로그인 활성화 (선택 · Google)

로그인/회원가입은 **선택 기능**입니다. 설정 전에는 로그인 페이지의 Google 버튼이
'준비 중'으로 비활성화되고, 사용자는 **아이디만 정해 이 기기에 저장되는 데모 계정**을
쓸 수 있습니다(사이트는 정상 작동). 실제 Google 로그인·기기 간 동기화를 켜려면:

### 1) D1의 users·sessions 테이블 (위 절차)
`web/schema.sql`에 포함되어 있으니 위 D1 절차대로 실행하면 함께 생성됩니다.

### 2) 환경변수/시크릿 등록 (Pages 대시보드)
**Pages 프로젝트 → Settings → Variables and Secrets** 에서:

| 이름 | 종류 | 값 |
|---|---|---|
| `AUTH_SECRET` | Secret(암호화) | 임의의 긴 랜덤 문자열 |
| `APP_URL` | Text | 배포 주소(예: `https://champsnote.pages.dev`, 끝 슬래시 없이) |
| `GOOGLE_CLIENT_ID` | Secret | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Secret | Google OAuth 클라이언트 보안 비밀 |
| `ADMIN_USERNAMES` | Text | (선택) 공지 작성 권한 아이디, 쉼표로 여러 명(예: `ctkross`) |

> `ADMIN_USERNAMES`에 등록된 아이디로 로그인하면 `/notices`(공지사항) 작성·삭제 및
> `/admin`(관리자 대시보드: 신고 검토·경고·차단)이 가능합니다. 일반 사용자는 읽기만 됩니다.

> **이메일+비밀번호 로그인**은 D1만 연결되면 별도 설정 없이 동작합니다(Google 자격증명 불필요).
> 신규 Google 로그인 사용자는 첫 로그인 시 `/welcome`에서 아이디를 직접 정합니다(중복 검증).
>
> **🔧 스키마 자동 마이그레이션**: 워커가 첫 API 요청 시 필요한 테이블·컬럼을 자동으로
> 보정합니다(`web/worker/migrate.ts`). 기존 users 테이블에 새 컬럼(`password_hash`,
> `display_name_changed_at`, `username_changed_at`, `onboarded`)이 없으면 **자동으로 추가**되므로,
> "프로필 편집 시 처리 실패" 같은 문제는 재배포만 하면 해결됩니다. (수동 `ALTER TABLE` 불필요)

### 관리자 계정 등록 방법 (신고 검토·경고·차단)
1. 먼저 해당 계정으로 **정상 회원가입/로그인**해서 아이디(@사용자명)를 확정합니다.
2. Pages **Settings → Variables and Secrets** 의 `ADMIN_USERNAMES` 에 그 **아이디**를
   입력합니다(쉼표로 여러 명, 예: `ctkross,admin2`). 대소문자 무관.
3. **재배포** 후 그 계정으로 로그인하면 설정 페이지에 **관리자 대시보드(`/admin`)** 진입점이
   생기고, `/notices` 공지 작성·삭제와 신고 검토·유저 경고·기간차단(3·7·30일)이 가능합니다.
> 관리자 판별은 서버에서 매 요청 검증하므로(`isAdmin`), 프론트만으로는 권한이 생기지 않습니다.

### 3) Google OAuth 클라이언트 만들기
1. https://console.cloud.google.com → 프로젝트 생성/선택
2. **API 및 서비스 → OAuth 동의 화면** → External → 앱 이름·이메일 입력 저장
   (테스트 상태면 "테스트 사용자"에 본인 계정 추가)
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID → 웹 애플리케이션**
4. **승인된 리디렉션 URI**: `{APP_URL}/api/auth/google/callback`
   (예: `https://champsnote.pages.dev/api/auth/google/callback`)
5. 발급된 클라이언트 ID·보안 비밀을 위 2)의 시크릿으로 등록 → 재배포

Google 자격증명이 모두 있을 때만 버튼이 활성화됩니다(`/api/auth/config`가 자동 판별).

### 동작 방식
- `/api/auth/google/start` → Google 동의 화면 리디렉션
- 콜백에서 토큰 교환 → `users` 업서트 → 세션 쿠키(`cn_session`, HttpOnly·Secure) 발급 → `/profile`
- 아이디 중복은 `GET /api/auth/username-available?u=` 로 실시간 검증

> ⚠️ 실제 Google 로그인은 자격증명 등록 후 검증됩니다. 배포 후 리디렉션 URI가
> 배포 주소와 정확히 일치하는지 확인하고 실제 로그인 1회로 확인하세요.

### ❗ Google 로그인 오류 해결
- **`401: disabled_client` / "The OAuth client was disabled"**: Google Cloud Console에서
  해당 **OAuth 2.0 클라이언트가 비활성화**된 상태입니다. **APIs & Services → 사용자 인증 정보**
  에서 클라이언트를 확인 → 비활성화됐으면 다시 사용 설정하거나 **새 클라이언트를 만들어**
  `GOOGLE_CLIENT_ID/SECRET`를 갱신하세요. (프로젝트가 삭제/정지된 경우도 동일 오류)
- **`403: access_denied`**: OAuth 동의 화면이 **테스트** 상태면 "테스트 사용자"에 로그인 계정을
  추가하거나, 동의 화면을 **게시(프로덕션)** 로 전환하세요.
- **`redirect_uri_mismatch`**: 승인된 리디렉션 URI가 `{APP_URL}/api/auth/google/callback` 와
  정확히 일치해야 합니다(끝 슬래시·http/https·서브도메인까지).

---

## 구글 광고(AdSense) 배치 (선택)

웹 광고는 **선택 기능**입니다. 퍼블리셔 ID가 없으면 광고 스크립트조차 로드되지
않아 완전히 광고 없는 사이트로 배포됩니다(심사에 유리). 켜는 절차:

### 1) AdSense 퍼블리셔 ID(ca-pub-…) 발급받기
1. https://adsense.google.com 접속 → Google 계정으로 가입
2. **사이트 추가**에 배포 주소(`champsnote.pages.dev` 또는 커스텀 도메인) 입력
3. AdSense가 안내하는 사이트 소유권 확인(자동 스니펫)을 완료 → **심사 신청**
   - 심사에는 보통 수일~2주가 걸리며, 콘텐츠·정책(개인정보처리방침·이용약관) 페이지가 있어야 유리합니다(이미 `/privacy`·`/terms` 제공).
4. 승인되면 **계정 → 계정 정보**에서 **게시자 ID** `ca-pub-XXXXXXXXXXXXXXXX` 확인
5. **광고 → 광고 단위 기준**에서 "디스플레이 광고" 단위를 만들면 **슬롯 ID**(10자리 숫자)가 발급됩니다

### 2) Cloudflare Pages 환경변수 등록
Pages 프로젝트 → **Settings → Variables and Secrets** (빌드 타임 변수, Text):

| 이름 | 값 |
|---|---|
| `VITE_ADSENSE_CLIENT` | `ca-pub-XXXXXXXXXXXXXXXX` (게시자 ID) |
| `VITE_ADSENSE_SLOT_BANNER` | 배너 광고 단위의 슬롯 ID(숫자) |

> `VITE_` 접두사가 붙은 변수는 빌드 시점에 주입되므로, 등록 후 **재배포**해야 반영됩니다.

> **ads.txt**: 루트에 `web/public/ads.txt`(→ 배포 시 `/ads.txt`)가 포함되어 있어 게시자 소유권을
> 자동 증명합니다. 게시자 ID가 바뀌면 이 파일의 `pub-XXXX` 값을 함께 수정하세요.

### ⚠️ "광고가 안 떠요" 체크리스트
광고 스크립트는 **라이브 도메인에서만** 로드됩니다(localhost/미리보기 제외). 스크립트가
로드돼도 아래가 충족돼야 실제 광고가 노출됩니다:
1. **AdSense 심사 승인 완료** — 신규 사이트는 승인 전까지 광고가 전혀 표시되지 않습니다(수일~2주).
   `adsense.google.com` → 사이트 상태가 **"준비됨/게재 중"** 인지 확인.
2. **자동 광고 ON** — 대시보드 → 광고 → 자동 광고에서 사이트에 대해 켜져 있는지 확인.
3. **`/ads.txt` 접근 가능** — 배포 후 `https(도메인)/ads.txt` 가 열리는지 확인(포함 완료).
4. **배너 슬롯** — 하단 배너는 `VITE_ADSENSE_SLOT_BANNER` 등록 + 재배포가 필요합니다(자동광고는 불필요).
5. **광고 차단기/무효 트래픽** — 본인 IP의 반복 조회는 무효 트래픽으로 잠시 광고가 빌 수 있습니다.

### 3) 하단 배너 · 팝업(전면) · 앵커 광고
- **배너**: 위 슬롯을 등록하면 각 페이지 하단에 반응형 배너가 표시됩니다(코드 반영 완료).
- **하단 앵커 / 팝업(전면·비네트)**: AdSense 대시보드 → **광고 → 자동 광고**를 켜면
  코드 추가 없이 **화면 하단 고정(앵커) 광고**와 **페이지 전환 시 전면(팝업) 광고**가
  자동으로 노출됩니다. (게시자 ID만 있으면 스크립트가 로드되어 동작)

### 4) 안드로이드 앱(AdMob)
안드로이드 앱(Capacitor) 단계에서 `@capacitor-community/admob`로 배너·전면·보상형
광고를 네이티브로 붙입니다. AdMob은 AdSense와 별도 계정/단위이며, 앱 출시(Phase 14)
때 앱 ID·광고 단위 ID를 발급받아 연동합니다.

> ⚠️ 정책: 실수 클릭 유도·과도한 광고는 계정 정지 사유입니다. 사용성을 해치지 않는
> 위치(콘텐츠 하단·자동 앵커)만 사용하세요.
