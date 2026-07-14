import { useTranslation } from 'react-i18next'

interface Article {
  title: string
  clauses: string[]
}

const EFFECTIVE = '2026-07-13'

const TERMS_KO: Article[] = [
  {
    title: '제1조 (목적)',
    clauses: [
      '① 본 약관은 챔스노트(ChampsNote, 이하 "서비스")가 제공하는 「포켓몬 챔피언스」 관련 유틸리티 및 커뮤니티 서비스의 이용과 관련하여 서비스와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
    ],
  },
  {
    title: '제2조 (정의)',
    clauses: [
      '① "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.',
      '② "회원"이란 소셜 로그인(Google) 또는 아이디 등록을 통해 서비스에 가입한 자를 말합니다.',
      '③ "콘텐츠"란 이용자가 서비스에 작성·업로드·공유하는 팀·샘플·댓글·문자 등 일체의 정보를 말합니다.',
      '④ 본 약관에서 정의하지 않은 용어는 관련 법령 및 일반 관례에 따릅니다.',
    ],
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    clauses: [
      '① 본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.',
      '② 서비스는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 서비스 내 공지사항을 통해 사전 공지합니다.',
      '③ 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다. 변경 공지 후에도 계속 이용하는 경우 변경에 동의한 것으로 봅니다.',
    ],
  },
  {
    title: '제4조 (서비스의 제공)',
    clauses: [
      '① 서비스는 도감, 데미지 계산기, 팀빌더 및 자동 진단·코칭, 실전 매치업 분석, 배틀 데이터 통계, 샘플·팀 공유, 공지사항 등의 기능을 제공합니다.',
      '② 서비스는 무료로 제공되며, 운영·유지에 필요한 광고를 게재하거나 자발적 후원을 받을 수 있습니다.',
      '③ 서비스는 기능의 추가·변경·삭제를 포함하여 서비스 내용을 수시로 개선할 수 있습니다.',
    ],
  },
  {
    title: '제5조 (서비스의 중단)',
    clauses: [
      '① 서비스는 시스템 점검·보수·교체, 통신 두절, 천재지변, 제3자(호스팅·API 제공자 등)의 서비스 장애 등 부득이한 사유가 있는 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.',
      '② 서비스는 사전 고지 없이 서비스를 변경하거나 중단할 수 있으며, 이로 인해 이용자에게 발생한 손해에 대하여 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.',
    ],
  },
  {
    title: '제6조 (이용자의 의무)',
    clauses: [
      '① 이용자는 다음 각 호의 행위를 하여서는 안 됩니다.',
      '  1. 타인의 정보를 도용하거나 허위 정보를 등록하는 행위',
      '  2. 서비스에 게시된 정보를 무단으로 변경·삭제하거나 서비스 운영을 방해하는 행위',
      '  3. 음란·폭력·혐오·차별·불법적인 콘텐츠를 게시하는 행위',
      '  4. 타인의 지식재산권·명예·프라이버시를 침해하는 행위',
      '  5. 자동화된 수단으로 서비스에 과도한 부하를 유발하는 행위',
      '② 이용자는 관련 법령, 본 약관, 서비스 이용안내 및 공지사항을 준수하여야 합니다.',
    ],
  },
  {
    title: '제7조 (콘텐츠의 관리)',
    clauses: [
      '① 이용자가 작성한 콘텐츠에 대한 책임은 해당 이용자에게 있습니다.',
      '② 서비스는 콘텐츠가 제6조를 위반하거나 관련 법령에 저촉된다고 판단되는 경우, 사전 통지 없이 해당 콘텐츠를 비공개·삭제하고 이용자에게 경고·이용정지 등의 조치를 할 수 있습니다.',
      '③ 이용자가 콘텐츠를 서비스에 공개 게시하는 경우, 서비스는 이를 서비스 운영·홍보 목적으로 노출·이용할 수 있습니다.',
    ],
  },
  {
    title: '제8조 (지식재산권)',
    clauses: [
      '① 「포켓몬」 및 관련 명칭·캐릭터·이미지의 저작권 및 상표권은 Nintendo, Creatures Inc., GAME FREAK inc.에 있습니다.',
      '② 본 서비스는 팬메이드 비공식 서비스로서 Nintendo, The Pokemon Company, GAME FREAK inc.와 제휴·후원·승인 관계에 있지 않습니다.',
      '③ 서비스가 자체 제작한 UI·코드·문구 등의 저작권은 서비스 개발자에게 있으며, 이용자가 작성한 콘텐츠의 저작권은 해당 이용자에게 있습니다.',
    ],
  },
  {
    title: '제9조 (데이터의 정확성 및 면책)',
    clauses: [
      '① 서비스가 제공하는 계산·통계·추천 정보는 공개된 데이터(제10조)에 기반한 참고 자료이며, 실제 인게임 결과와 다를 수 있습니다.',
      '② 서비스는 정보의 정확성·완전성·최신성을 보장하지 않으며, 이를 신뢰하여 이용한 결과에 대해 책임을 지지 않습니다.',
      '③ 서비스는 "있는 그대로(as is)" 제공됩니다.',
    ],
  },
  {
    title: '제10조 (데이터 및 통계 출처)',
    clauses: [
      '① 명칭·종족값·스프라이트 등 기본 데이터는 PokeAPI를, 로스터·학습기술·메커니즘은 Pokemon Showdown의 champions 데이터를, 사용률·카운터 통계는 Smogon University의 공개 통계를 바탕으로 합니다.',
      '② 자세한 출처는 서비스 내 "데이터 및 통계 출처" 페이지에 명시합니다.',
    ],
  },
  {
    title: '제11조 (광고 및 후원)',
    clauses: [
      '① 서비스는 운영에 필요한 비용 충당을 위해 서비스 화면에 광고를 게재할 수 있습니다.',
      '② 이용자는 자발적으로 후원할 수 있으며, 후원은 서비스 운영·유지 목적으로 사용됩니다. 후원은 대가성이 없으며 환불되지 않습니다.',
    ],
  },
  {
    title: '제12조 (개인정보의 보호)',
    clauses: [
      '① 서비스는 이용자의 개인정보를 관련 법령 및 별도의 개인정보처리방침에 따라 보호합니다. 구체적인 사항은 "개인정보처리방침"에서 정합니다.',
    ],
  },
  {
    title: '제13조 (준거법 및 분쟁해결)',
    clauses: [
      '① 본 약관은 대한민국 법령에 따라 규율되고 해석됩니다.',
      '② 서비스와 이용자 간 분쟁이 발생한 경우 상호 신의성실의 원칙에 따라 원만히 해결하도록 노력하며, 협의가 이루어지지 않을 경우 관련 법령이 정한 절차에 따릅니다.',
    ],
  },
]

const TERMS_EN: Article[] = [
  { title: 'Article 1 (Purpose)', clauses: ['These Terms govern the rights, obligations, and responsibilities between ChampsNote ("the Service") and its users regarding the use of the Pokemon Champions utilities and community features.'] },
  { title: 'Article 2 (Definitions)', clauses: ['"User" means members and non-members who use the Service.', '"Member" means anyone who signs up via social login (Google) or username registration.', '"Content" means any teams, samples, comments, or text a user creates, uploads, or shares.'] },
  { title: 'Article 3 (Effect & Amendment)', clauses: ['These Terms take effect when posted within the Service.', 'The Service may amend these Terms within the limits of applicable law, giving prior notice via the notices board with the effective date and reason.', 'Continuing to use the Service after notice constitutes acceptance of the amended Terms.'] },
  { title: 'Article 4 (Provision of Service)', clauses: ['The Service provides a Pokedex, damage calculator, team builder with auto-diagnosis, matchup analysis, battle-data stats, sample/team sharing, and notices.', 'The Service is free and may display ads or accept voluntary donations to sustain operations.'] },
  { title: 'Article 5 (Interruption)', clauses: ['The Service may suspend all or part of the Service for maintenance, outages, force majeure, or third-party (hosting/API) failures.', 'The Service is not liable for damages from changes or interruptions absent willful misconduct or gross negligence.'] },
  { title: 'Article 6 (User Obligations)', clauses: ['Users must not: impersonate others or register false information; disrupt the Service; post unlawful/obscene/hateful content; infringe others’ IP, reputation, or privacy; or overload the Service via automation.', 'Users must comply with applicable law, these Terms, and posted notices.'] },
  { title: 'Article 7 (Content Management)', clauses: ['Users are responsible for content they create.', 'The Service may hide or delete violating content without prior notice and may warn or suspend the user.', 'Publicly posted content may be shown/used for operating and promoting the Service.'] },
  { title: 'Article 8 (Intellectual Property)', clauses: ['Pokemon and related names, characters, and images are © and ™ of Nintendo, Creatures Inc., and GAME FREAK inc.', 'This is an unofficial fan-made service, not affiliated with or endorsed by Nintendo, The Pokemon Company, or GAME FREAK inc.', 'The Service’s own UI/code belongs to the developer; user content belongs to the user.'] },
  { title: 'Article 9 (Accuracy & Disclaimer)', clauses: ['Calculations, stats, and recommendations are reference material based on public data and may differ from in-game results.', 'The Service does not guarantee accuracy, completeness, or timeliness and is provided "as is".'] },
  { title: 'Article 10 (Data & Stats Sources)', clauses: ['Names/stats/sprites from PokeAPI; roster/learnsets/mechanics from Pokemon Showdown’s champions data; usage/counter stats from Smogon University. See the "Data & stats sources" page for details.'] },
  { title: 'Article 11 (Ads & Donations)', clauses: ['The Service may display ads to cover operating costs.', 'Donations are voluntary, used to sustain the Service, non-reciprocal, and non-refundable.'] },
  { title: 'Article 12 (Privacy)', clauses: ['The Service protects personal data under applicable law and its separate Privacy Policy.'] },
  { title: 'Article 13 (Governing Law & Disputes)', clauses: ['These Terms are governed by the laws of the Republic of Korea.', 'Disputes are resolved in good faith; failing agreement, per procedures set by applicable law.'] },
]

export default function Terms() {
  const { i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const articles = ko ? TERMS_KO : TERMS_EN

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{ko ? '이용약관' : 'Terms of Service'}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {ko ? `시행일: ${EFFECTIVE}` : `Effective: ${EFFECTIVE}`}
        </p>
      </header>

      <div className="space-y-6">
        {articles.map((a) => (
          <section key={a.title}>
            <h2 className="text-[15px] font-bold">{a.title}</h2>
            <div className="mt-2 space-y-1.5">
              {a.clauses.map((c, i) => (
                <p
                  key={i}
                  className={`text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300 ${c.startsWith('  ') ? 'pl-4' : ''}`}
                >
                  {c.trim()}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-zinc-200 pt-4 dark:border-white/8">
        <h2 className="text-[15px] font-bold">{ko ? '부칙' : 'Addendum'}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
          {ko ? `본 약관은 ${EFFECTIVE}부터 시행됩니다.` : `These Terms are effective from ${EFFECTIVE}.`}
        </p>
      </section>
    </article>
  )
}
