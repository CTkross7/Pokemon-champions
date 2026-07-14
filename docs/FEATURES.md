# 챔스노트(ChampsNote) — 전체 기능·설계 종합 정리

> Pokémon Champions 경쟁 배틀 유틸리티. 웹(Cloudflare Pages, `champsnote.pages.dev`) 출시 준비 완료.
> 이 문서는 **지금까지 구현·설계된 모든 것**의 누락 없는 목록과, 남은/보완할 항목(Gap)을 함께 정리합니다.
> 최종 갱신: 2026-07-14

## 1. 기술 스택 (구현됨)
- **프론트엔드**: Vite 8 + React 19 + TypeScript + Tailwind CSS 4 (네온라임 `#d0f224` + zinc)
- **상태/저장**: zustand + persist (설정·팀·인증·도감필터), i18next (ko/en), react-router-dom 7
- **데미지 엔진**: `@smogon/calc` + `@pkmn/dex` (Gen 9) — Champions **SP 모델**(Lv.50 고정, SP 0~32/스탯, 총 66) 어댑터
- **백엔드**: Cloudflare Pages advanced mode(`dist/_worker.js`, esbuild 번들) + **D1**(samples·users·sessions·notices·reports·moderation)
- **인증**: Google OAuth2 + 이메일/비밀번호(PBKDF2-SHA256), 세션 쿠키(HttpOnly·Secure)
- **데이터 파이프라인**: `data/scripts/*.mjs` → 정적 JSON, GitHub Actions 주간 자동 갱신
- **PWA**: manifest + service worker(오프라인 캐시), OG/Twitter 메타, robots.txt + **sitemap.xml**

## 2. 페이지·기능 인벤토리 (21개 라우트, 전부 구현)

| 라우트 | 기능 | 상태 |
|---|---|---|
| `/` 홈 | 히어로 + **시즌 칩(레귤레이션/D-day)** + **메타 미리보기(상위8)** + 최근 소식 + 기능 카드 | ✅ |
| `/dex` 도감 | 챔피언스 로스터(310+메가35) 검색(한/영)·타입·종족값 정렬, **필터 상태 유지·초기화** | ✅ |
| `/dex/:id` 상세 | 종족값·타입 상성·특성·**학습기술(한글)**·추천 빌드 | ✅ |
| `/dex/types` | 인터랙티브 타입 상성표(공/수 전환) | ✅ |
| `/calculator` 계산기 | SP 모델 데미지 계산, 메가·날씨·필드·아이템·특성, 챔피언스 메가 지원 | ✅ |
| `/teams` 팀빌더 | 6마리 편성·SP 배분·저장(다중)·Showdown import/export·**이미지 공유**·스피드 티어 | ✅(로그인) |
| `/teams` 코칭 | **팀 자동 진단 리포트**: 타입 구멍·스피드 라인·메타 위협 대응·역할 밸런스·개선 제안 | ✅ |
| `/matchup` 매치업 | **실전 매치업 어시스턴트**: 상대 6마리 입력→위협 순위·선출 추천·경고 | ✅(로그인) |
| `/stats` 통계 | 사용률 상위·티어 랭킹·채용 기술/아이템/성격(한글) | ✅ |
| `/gallery` 갤러리 | 커뮤니티 샘플 목록·좋아요·신고 | ✅ |
| `/share` 공유 | 팀 공유 링크 디코드·이미지 | ✅ |
| `/notices` 공지 | 공지/업데이트/이벤트 (관리자 작성) | ✅ |
| `/login` 로그인 | Google + 이메일/비밀번호(로그인·회원가입 토글) | ✅ |
| `/welcome` 온보딩 | 신규 Google 유저 아이디 확정(실시간 중복검증) | ✅ |
| `/profile` 프로필 | 아바타·표시닉네임(7일 쿨타임)·**아이디(@handle) 변경(7일 쿨타임)** | ✅ |
| `/admin` 관리자 | 신고 검토·처리·유저 경고·기간차단(3·7·30일)·콘텐츠 삭제 | ✅(권한) |
| `/settings` 설정 | 테마(3-way)·언어·후원(계좌 복사)·정책 링크·관리자 진입점 | ✅ |
| `/about` 소개 | 서비스 소개·주요기능·데이터 출처·문의 | ✅ |
| `/terms` 이용약관 | 13조+부칙 (한/영, 기업형) | ✅ |
| `/privacy` 개인정보 | 15조+부칙 (한/영, 기업형) | ✅ |
| `/data-sources` 출처 | PokéAPI·Showdown·Smogon 출처 명시 | ✅ |

## 3. 킬러 피처(차별화) — 전부 구현
1. **팀 자동 진단·코칭** (`/teams` 코치 탭) — 규칙 기반 약점/스피드/위협 분석 + 개선 제안
2. **실전 매치업 어시스턴트** (`/matchup`) — 3초 조회형 모바일 UI
3. **빌드 추천 어시스턴트** (도감 상세) — 역할별 SP·기술·아이템 추천 + 채용 이유
4. **샘플 공유 커뮤니티** (`/gallery` + 이미지 카드) — 로그인·비차단 게이트

## 4. 데이터 무결성 (핵심 원칙: 검증된 데이터만, 날조 금지)
- 종/종족값/타입/특성/기술: **@pkmn/dex**(Showdown, 커뮤니티 검증) — 챔피언스 전용 메가 35종 포함
- 한글명: PokéAPI 파생 `ko-names.json`
- **기술 교차검증(2026-07-14)**: HOME 전송으로 챔피언스에서 합법인 "Past" 기술(파멸의 빛 등 191종)이 누락됐던 문제 수정 — **한글명 검증된 것만** 복원(영어 누출 0)
- 자동 갱신: GitHub Actions 주간(@pkmn/dex·PokéAPI 최신 반영)
- `validate.mjs`: 로스터/참조 무결성 + **영어 누출 가드**(챔피언스 기술·특성 한글 강제)

## 5. 서버 보안·게이트 (검증됨)
- POST 샘플·좋아요·신고 → 로그인 필수(401), 차단 유저(403)
- 관리자 API → `ADMIN_USERNAMES` 서버 검증(403), 프론트만으론 권한 없음
- 비밀번호 PBKDF2(10만 iter), 세션 HttpOnly·Secure, 아이디/이메일 중복(409)
- **D1 스키마 자동 마이그레이션**(`worker/migrate.ts`) — 라이브 컬럼 누락 자동 보정

## 6. 수익화
- 웹 **AdSense**: 게시자 `ca-pub-4878038748315573`, 라이브에서만 로드, ads.txt 포함, 자동광고+배너 슬롯
- 앱 **AdMob**: Phase 14(안드로이드)에서 연동 예정

---

## 7. 남은/보완 항목 (Gap 분석)

### 출시 전 사용자 조치 (코드는 준비됨)
- [ ] Cloudflare Pages 환경변수: `AUTH_SECRET`, `APP_URL`, `GOOGLE_CLIENT_ID/SECRET`, `ADMIN_USERNAMES`, (선택) `VITE_ADSENSE_CLIENT`/`VITE_ADSENSE_SLOT_BANNER`
- [ ] D1 바인딩 연결(대시보드) — 스키마는 자동 마이그레이션되므로 수동 SQL 불필요
- [ ] AdSense 사이트 심사 신청 → 승인 후 광고 노출(수일~2주)
- [ ] `regulation.json`의 시즌 **종료일**을 공식 일정에서 입력 → 홈 D-day 자동 표기(현재 날조 방지로 미표기)

### 초기 설계 대비 미구현/향후
- [ ] **Phase 14 — 안드로이드 앱**(Capacitor + AdMob) + Play Store 출시 *(사용자 승인 대기 중인 다음 대형 단계)*
- [ ] **VP/SP 자원 플래너**(영입·육성 계획) — 초기 로드맵의 차별화 후보, 미착수
- [ ] 커뮤니티 **댓글**(현재 좋아요·신고만) — 확장 여지
- [ ] 샘플 **레귤레이션별 브라우징 필터** — 확장 여지
- [ ] 다국어 확장(현재 ko/en) — 필요 시

### 알려진 제약
- 사용률 통계는 Smogon 접근 차단 시 폴백 데이터 사용(라이브에선 실데이터)
- 일부 특성(Eelevate·Fire Mane)은 PokéAPI 한글명 부재 → 임의 번역 안 함(주간 갱신 시 자동 반영)
