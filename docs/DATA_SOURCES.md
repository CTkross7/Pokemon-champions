# 데이터 출처 및 검증 기록 (DATA SOURCES)

> 원칙: 검증 불가능한 정보는 서비스에 사용하지 않는다. 모든 게임 데이터는 출처와 검증 등급을 기록한다.

## 검증 등급
- **official**: The Pokémon Company / Nintendo 공식 발표·공식 사이트
- **cross-checked**: 신뢰도 높은 복수의 독립 출처에서 일치 확인
- **unverified**: 검증 불가 — 서비스에 사용 금지

## 게임 기본 정보 (official)
- 출시일 (Switch 2026-04-08, 모바일 2026-06-17), 크로스플랫폼, 게임 모드(랭크/캐주얼/토너먼트), VP 시스템, Pokémon HOME 연동
  - https://champions.pokemon.com/en-us/
  - https://www.pokemon.com/us/news/pokemon-champions-releases-on-nintendo-switch-and-nintendo-switch-2-on-april-8-2026
  - https://www.pokemon.com/us/pokemon-news/pokemon-champions-comes-to-android-and-ios-on-june-17
  - https://press.pokemon.com/en/releases/Pokemon-Champions-Launches-June-17-on-iOS-and-Android-Devices-The-Poke

## 배틀 시스템 — SP 규칙 (cross-checked)
- SP 총 66 / 스탯당 최대 32 / 전원 Lv.50 / 1 SP = +1 스탯: 아래 독립 출처에서 일치
  - https://www.gamecards.gg/guides/pokemon-champions-stat-points-ranked-battles-guide
  - https://www.switchbladegaming.com/pokemon-champions/sp-system-explained/
  - https://genpkm.com/blog/pokemon-champions-no-ivs-stat-points-competitive-guide-2026
  - https://www.serebii.net/pokemonchampions/rankedbattle.shtml (랭크배틀)
- ⚠️ Phase 2(계산기) 착수 시 게임 내 실측으로 재확인 예정

## 현재 레귤레이션 — Reg M-B, 2026-07 기준 (cross-checked)
- https://www.pikalytics.com/ (Reg. M-B 표기)
- https://champteams.gg/ (Reg M-B 팀빌더)

## 로스터 시드 22종 (usage-stats-2026-07, cross-checked)
- 2026-07 랭크배틀 사용률 통계에 등장 = 게임 내 존재 확인으로 간주
  - https://www.pikalytics.com/champions
  - https://www.pokemon-zone.com/champions/
  - https://championsmeta.io/
- 제외: Floette-Eternal — 단일 계열 출처에만 등장, 교차 검증 불가 (unverified)

## 포켓몬 기반 데이터 (mechanics)
- 종족값·타입·특성·기술 데이터: `@pkmn/dex` (Pokémon Showdown 데이터, MIT) — 커뮤니티 표준, 대전 시뮬레이터 검증 데이터
- 한글명(종/기술/특성/아이템/타입/성격): PokéAPI CSV (https://github.com/PokeAPI/pokeapi, data/v2/csv) — 게임 원본 텍스트 기반
- ⚠️ Champions 고유 밸런스 변경(기술 위력 조정 등)이 존재할 경우 큐레이션 오버라이드 파일로 관리 예정 (Phase 2)

## 지식재산권 관련
- 본 서비스는 비공식 팬메이드 유틸리티. The Pokémon Company/Nintendo/Game Freak과 무관함을 전 페이지 푸터에 고지
- 공식 아트웍 사용 금지. 스프라이트는 커뮤니티 관행(PokéAPI 스프라이트) 범위에서 사용하되 권리자 요청 시 즉시 제거 방침
- 서비스명·아이콘에 "Pokémon" 상표 미사용 (가칭: ChampMate)
