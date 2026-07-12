# 배포 가이드 (Cloudflare Pages)

챔스노트(ChampsNote)를 Cloudflare Pages로 배포하고 `ctkross.champsnote.com` 같은
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
