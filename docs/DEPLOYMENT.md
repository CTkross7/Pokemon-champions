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
