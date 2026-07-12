# 챔스노트 (ChampsNote)

> Pokémon Champions 플레이어를 위한 종합 배틀 유틸리티 — 도감, SP 네이티브 데미지 계산기, 팀 자동 진단·코칭, 실전 매치업 어시스턴트.

**비공식 팬메이드 서비스입니다.** The Pokémon Company, Nintendo, Game Freak과 무관합니다.

## 구조

```
/web    Vite + React 19 + TypeScript + Tailwind 4 웹 앱 (Cloudflare Pages 배포 대상)
/data   데이터 파이프라인 (한글명 생성, 큐레이션 데이터, 무결성 검증)
/docs   진행상황(STATUS.md), 데이터 출처(DATA_SOURCES.md), 로드맵
/app    (예정) Capacitor 안드로이드 앱
```

## 개발

```bash
# 웹 앱
cd web
npm install
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드 (tsc + vite)

# 데이터 파이프라인
cd data
npm install
npm run fetch:ko-names   # PokéAPI CSV → 한글명 맵 재생성
npm run validate         # 데이터 무결성 검증
```

## 문서
- 진행 상황 및 로드맵: [docs/STATUS.md](docs/STATUS.md)
- 데이터 출처·검증 기록: [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)
