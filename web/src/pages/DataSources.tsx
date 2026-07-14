import { useTranslation } from 'react-i18next'

interface Block {
  title: string
  body: string[]
  link?: string
}

const KO: Block[] = [
  {
    title: '상표·저작권',
    body: [
      '포켓몬 및 관련 캐릭터명은 Nintendo·Creatures Inc.·GAME FREAK inc.의 상표 및 저작물입니다.',
      'Pokemon and all respective names are Trademark and © of Nintendo 1996–2026, Creatures Inc. and GAME FREAK inc.',
    ],
  },
  {
    title: '비공식·비후원',
    body: [
      '본 서비스는 Nintendo, The Pokemon Company, GAME FREAK inc.와 제휴·후원·승인 관계에 있지 않은 팬메이드 비공식 서비스입니다.',
    ],
  },
  {
    title: '스프라이트·게임 데이터',
    body: ['포켓몬·기술·특성·아이템의 명칭(한/영)·종족값·스프라이트는 PokeAPI를 통해 제공됩니다.'],
    link: 'https://pokeapi.co/',
  },
  {
    title: '로스터·학습기술·메커니즘',
    body: [
      '챔피언스 로스터·티어·포켓몬별 학습기술은 Pokemon Showdown 저장소의 champions 모드(formats-data·learnsets)에서 그대로 가져옵니다. 각 포켓몬은 포켓몬 챔피언스에서 실제 사용 가능한 기술만 표기됩니다.',
      '기술의 존재 여부와 위력·PP·명중 등 수치도 champions 모드(moves)를 기준으로 하며, 포챔스에 없는 기술은 표시하지 않습니다.',
      '이 규칙은 빌드 시 자동 검증(합법성 가드)으로 강제되며, 위반 시 배포가 중단됩니다.',
    ],
    link: 'https://github.com/smogon/pokemon-showdown',
  },
  {
    title: '사용률·채용률 통계',
    body: [
      '싱글 사용률·기술/물건/특성/성격 채용률은 Smogon University가 Pokemon Showdown 래더 로그에서 집계한 챔피언스 포맷(gen9championsbssregma, cutoff 1500) 통계를 바탕으로 하며, 주기적으로 자동 수집됩니다.',
      '※ Showdown 환경과 Nintendo Switch 랭크 매치의 메타·표본·규칙은 다를 수 있습니다.',
    ],
    link: 'https://www.smogon.com/stats/',
  },
  {
    title: '대미지 계산',
    body: ['데미지 계산 로직은 Smogon University의 Pokemon Showdown 계산 엔진(@smogon/calc)을 참고·포팅했습니다.'],
    link: 'https://github.com/smogon/damage-calc',
  },
]

const EN: Block[] = [
  { title: 'Trademark & Copyright', body: ['Pokemon and all respective names are Trademark and © of Nintendo 1996–2026, Creatures Inc. and GAME FREAK inc.'] },
  { title: 'Unofficial & Unendorsed', body: ['This is a fan-made, unofficial service, not affiliated with or endorsed by Nintendo, The Pokemon Company, or GAME FREAK inc.'] },
  { title: 'Sprites & game data', body: ['Names (KO/EN), base stats, and sprites for Pokemon, moves, abilities, and items are provided by PokeAPI.'], link: 'https://pokeapi.co/' },
  { title: 'Roster, learnsets & mechanics', body: ['The Champions roster, tiers, and per-Pokemon learnsets come directly from the champions mod (formats-data / learnsets) in the Pokemon Showdown repository — each Pokemon shows only the moves it can actually use in Champions. Move existence and stats (power/PP/accuracy) also follow the champions mod, and moves that do not exist in Champions are never shown. A build-time legality guard enforces this and blocks deploy on any violation.'], link: 'https://github.com/smogon/pokemon-showdown' },
  { title: 'Usage & adoption stats', body: ['Usage and move/item/ability/spread adoption are based on Smogon University stats aggregated from Pokemon Showdown ladder logs (gen9championsbssregma, cutoff 1500), collected automatically. The Showdown meta may differ from Nintendo Switch ranked.'], link: 'https://www.smogon.com/stats/' },
  { title: 'Damage calculation', body: ['Damage logic is ported from / references Smogon University’s Pokemon Showdown calc engine (@smogon/calc).'], link: 'https://github.com/smogon/damage-calc' },
]

export default function DataSources() {
  const { i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const blocks = ko ? KO : EN

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{ko ? '데이터 및 통계 출처' : 'Data & Stats Sources'}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {ko
            ? '모든 게임 데이터는 아래의 검증 가능한 공식·오픈 소스에서만 가져옵니다.'
            : 'All game data comes only from the verifiable official/open sources below.'}
        </p>
      </header>

      <div className="space-y-4">
        {blocks.map((b) => (
          <section key={b.title} className="card p-5">
            <h2 className="text-[15px] font-bold">{b.title}</h2>
            {b.body.map((p, i) => (
              <p key={i} className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                {p}
              </p>
            ))}
            {b.link && (
              <a
                href={b.link}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-[12px] font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                {b.link}
              </a>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}
