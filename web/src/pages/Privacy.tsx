import { useTranslation } from 'react-i18next'

/**
 * Privacy Policy — enterprise-style, article/clause format. Reflects the app's
 * actual data handling: local-first storage, optional Google/email accounts,
 * community content in D1, session cookies, moderation, and AdSense.
 * Required for AdSense approval and app-store submission.
 */

interface Article {
  title: string
  clauses: string[]
}

const EFFECTIVE = '2026-07-14'
const DEV_EMAIL = 'ctkross.dev@gmail.com'

const KO: Article[] = [
  {
    title: '제1조 (총칙)',
    clauses: [
      '① 챔스노트(ChampsNote, 이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.',
      '② 본 방침은 서비스가 어떤 개인정보를 어떤 목적으로 수집·이용하며, 어떻게 보관·파기하는지를 설명합니다.',
    ],
  },
  {
    title: '제2조 (수집하는 개인정보 항목)',
    clauses: [
      '① 서비스는 계정 없이도 대부분의 기능(도감·계산기·통계 등)을 이용할 수 있으며, 이 경우 개인정보를 수집하지 않습니다.',
      '② 회원가입·로그인 시 다음 정보를 수집합니다.',
      '  1. 이메일 회원가입: 이메일 주소, 아이디, 비밀번호(단방향 암호화하여 저장), 표시 이름',
      '  2. Google 로그인: Google이 제공하는 계정 식별자(sub), 이메일, 이름, 프로필 사진 URL',
      '  3. 선택 입력: 프로필 사진(이용자가 업로드 시), 표시 닉네임',
      '③ 커뮤니티 이용 시: 공유한 팀·샘플, 작성한 공지·댓글, 신고 내용이 수집·저장됩니다.',
      '④ 서비스 이용 과정에서 자동으로 생성·수집되는 정보: 세션 식별용 쿠키, 접속 IP·기기·브라우저 정보, 이용 로그.',
      '⑤ 팀·설정 등 이용자 데이터는 원칙적으로 이용자 기기(브라우저 로컬 저장소)에 저장되며, 로그인 시 일부는 서버와 동기화될 수 있습니다.',
    ],
  },
  {
    title: '제3조 (개인정보의 수집·이용 목적)',
    clauses: [
      '① 회원 식별 및 로그인 유지, 계정·프로필 관리',
      '② 커뮤니티(샘플 공유·공지·좋아요) 기능 제공 및 콘텐츠 표시',
      '③ 부정 이용 방지, 신고 처리, 이용약관 위반에 대한 경고·이용제한 등 운영·모니터링',
      '④ 서비스 개선, 오류 분석, 통계',
      '⑤ 광고 게재(제12조) 및 후원 안내',
    ],
  },
  {
    title: '제4조 (개인정보의 보유 및 이용기간)',
    clauses: [
      '① 이용자의 개인정보는 원칙적으로 회원 탈퇴 시 또는 수집·이용 목적 달성 시까지 보유하며, 목적 달성 후 지체 없이 파기합니다.',
      '② 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.',
      '③ 세션 쿠키는 발급일로부터 최대 30일간 유효하며, 로그아웃 시 무효화됩니다.',
    ],
  },
  {
    title: '제5조 (쿠키의 사용)',
    clauses: [
      '① 서비스는 로그인 상태 유지를 위해 필수 쿠키(세션 쿠키, HttpOnly·Secure)를 사용합니다. 이 쿠키가 없으면 로그인 기능을 이용할 수 없습니다.',
      '② 광고가 활성화된 경우 광고 사업자(Google)가 맞춤형 광고를 위해 쿠키를 사용할 수 있습니다(제12조).',
      '③ 이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 기능이 제한될 수 있습니다.',
    ],
  },
  {
    title: '제6조 (개인정보의 제3자 제공)',
    clauses: [
      '① 서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.',
      '② 다만 법령에 근거가 있거나 수사기관의 적법한 요청이 있는 경우는 예외로 합니다.',
    ],
  },
  {
    title: '제7조 (개인정보 처리의 위탁)',
    clauses: [
      '① 서비스는 운영을 위해 다음과 같이 개인정보 처리를 위탁(또는 인프라를 이용)합니다.',
      '  1. Cloudflare, Inc. — 웹 호스팅 및 데이터베이스(D1) 등 인프라 제공',
      '  2. Google LLC — 소셜 로그인(OAuth) 및 광고(AdSense)',
      '② 위탁받은 자가 관련 법령을 위반하지 않도록 필요한 사항을 관리·감독합니다.',
    ],
  },
  {
    title: '제8조 (개인정보의 국외 이전)',
    clauses: [
      '① 서비스는 Cloudflare·Google의 글로벌 인프라를 이용하므로, 개인정보가 국외 서버에 저장·처리될 수 있습니다.',
      '② 이는 서비스 제공에 필요한 범위로 한정되며, 각 사업자의 개인정보 보호 정책이 함께 적용됩니다.',
    ],
  },
  {
    title: '제9조 (이용자의 권리와 행사 방법)',
    clauses: [
      '① 이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다.',
      '② 프로필 정보(표시 이름·프로필 사진 등)는 프로필 편집 화면에서 직접 수정할 수 있습니다.',
      '③ 회원 탈퇴 또는 계정·데이터 삭제를 원하시면 제14조의 연락처로 요청해 주세요.',
      '④ 브라우저 로컬 저장소에 저장된 데이터(팀·설정)는 브라우저 저장소를 비우면 삭제됩니다.',
    ],
  },
  {
    title: '제10조 (개인정보의 파기)',
    clauses: [
      '① 보유기간 경과 또는 처리 목적 달성 등 파기 사유가 발생하면, 서버에 저장된 개인정보는 복구 불가능한 방법으로 지체 없이 삭제합니다.',
      '② 회원 탈퇴 시 계정 정보 및 연동된 데이터는 관련 법령상 보존 의무가 없는 한 삭제됩니다.',
    ],
  },
  {
    title: '제11조 (개인정보의 안전성 확보 조치)',
    clauses: [
      '① 비밀번호는 PBKDF2 등 단방향 암호화하여 저장하며, 평문으로 보관하지 않습니다.',
      '② 모든 통신은 HTTPS로 암호화되며, 세션 쿠키는 HttpOnly·Secure 속성으로 보호됩니다.',
      '③ 관리자 기능은 지정된 계정에만 접근이 허용됩니다.',
    ],
  },
  {
    title: '제12조 (광고 및 맞춤형 광고)',
    clauses: [
      '① 서비스는 운영 비용 충당을 위해 Google AdSense 광고를 게재할 수 있습니다.',
      '② Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록 등을 기반으로 맞춤형 광고를 제공할 수 있습니다.',
      '③ 이용자는 Google 광고 설정(https://adssettings.google.com) 또는 www.aboutads.info 에서 맞춤형 광고를 거부할 수 있습니다.',
    ],
  },
  {
    title: '제13조 (만 14세 미만 아동의 개인정보)',
    clauses: [
      '① 서비스는 만 14세 미만 아동의 개인정보를 수집하지 않는 것을 원칙으로 합니다.',
      '② 만 14세 미만 아동이 회원가입을 원하는 경우 법정대리인의 동의가 필요합니다.',
    ],
  },
  {
    title: '제14조 (개인정보 보호책임자 및 문의)',
    clauses: [
      `① 개인정보 보호책임자: 개발자 CTkross`,
      `② 문의: ${DEV_EMAIL}`,
      '③ 개인정보 침해에 관한 상담이 필요한 경우 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118) 등에 문의할 수 있습니다.',
    ],
  },
  {
    title: '제15조 (방침의 변경)',
    clauses: [
      '① 본 방침이 변경되는 경우 시행일 및 변경 사유를 서비스 내 공지사항을 통해 사전 고지합니다.',
    ],
  },
]

const EN: Article[] = [
  { title: 'Article 1 (General)', clauses: ['ChampsNote ("the Service") values your privacy and complies with applicable data-protection laws.', 'This policy explains what personal data we collect, why, and how we store and delete it.'] },
  { title: 'Article 2 (Data We Collect)', clauses: ['Most features (Pokedex, calculator, stats) work without an account and collect no personal data.', 'On sign-up/login we collect: (1) Email account — email, username, password (stored one-way hashed), display name; (2) Google login — Google account id (sub), email, name, profile picture URL; (3) optional avatar and display name.', 'Community use stores your shared teams/samples, notices/comments, and reports.', 'Automatically collected: a session cookie, IP/device/browser info, and usage logs.', 'Teams and settings are stored on your device (browser storage); some may sync to the server when signed in.'] },
  { title: 'Article 3 (Purposes)', clauses: ['Identify members and keep you logged in; manage accounts/profiles.', 'Provide community features and display content.', 'Prevent abuse, handle reports, and enforce the Terms (warnings/bans).', 'Improve the service, analyze errors, and produce statistics.', 'Serve ads (Article 12) and present donation info.'] },
  { title: 'Article 4 (Retention)', clauses: ['Personal data is kept until account deletion or purpose fulfillment, then destroyed without delay, except where law requires retention.', 'Session cookies last up to 30 days and are invalidated on logout.'] },
  { title: 'Article 5 (Cookies)', clauses: ['We use an essential session cookie (HttpOnly, Secure) to keep you logged in.', 'When ads are enabled, Google may use cookies for personalized ads (Article 12).', 'You may block cookies in your browser, but some features (e.g. login) may not work.'] },
  { title: 'Article 6 (Third-Party Disclosure)', clauses: ['We do not share your personal data externally, except where required by law or valid legal process.'] },
  { title: 'Article 7 (Processors)', clauses: ['We use: (1) Cloudflare, Inc. — hosting and database (D1); (2) Google LLC — social login (OAuth) and ads (AdSense). We supervise processors for legal compliance.'] },
  { title: 'Article 8 (International Transfer)', clauses: ['Because we use Cloudflare/Google global infrastructure, data may be stored/processed on servers outside your country, limited to what is needed to run the service.'] },
  { title: 'Article 9 (Your Rights)', clauses: ['You may access, correct, delete, or restrict processing of your data at any time.', 'Profile fields (display name, avatar) are editable in the profile screen.', 'For account/data deletion, contact us (Article 14).', 'Local data (teams/settings) is removed by clearing your browser storage.'] },
  { title: 'Article 10 (Destruction)', clauses: ['When retention ends or the purpose is fulfilled, server-side personal data is deleted irrecoverably without delay. On account deletion, account and linked data are removed unless the law requires retention.'] },
  { title: 'Article 11 (Security)', clauses: ['Passwords are stored one-way hashed (PBKDF2), never in plaintext.', 'All traffic is HTTPS; session cookies are HttpOnly and Secure.', 'Admin features are restricted to designated accounts.'] },
  { title: 'Article 12 (Ads & Personalization)', clauses: ['We may display Google AdSense ads to cover costs.', 'Third-party vendors including Google may use cookies to serve personalized ads based on prior visits.', 'You can opt out at https://adssettings.google.com or www.aboutads.info.'] },
  { title: 'Article 13 (Children)', clauses: ['We do not knowingly collect data from children under 14; where required, a legal guardian’s consent is needed.'] },
  { title: 'Article 14 (Contact)', clauses: [`Data protection officer: CTkross. Contact: ${DEV_EMAIL}.`] },
  { title: 'Article 15 (Changes)', clauses: ['We announce changes and their effective date via the in-app notices before they take effect.'] },
]

export default function Privacy() {
  const { i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const articles = ko ? KO : EN

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{ko ? '개인정보처리방침' : 'Privacy Policy'}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ko ? `시행일: ${EFFECTIVE}` : `Effective: ${EFFECTIVE}`}</p>
      </header>

      <div className="space-y-6">
        {articles.map((a) => (
          <section key={a.title}>
            <h2 className="text-[15px] font-bold">{a.title}</h2>
            <div className="mt-2 space-y-1.5">
              {a.clauses.map((c, i) => (
                <p key={i} className={`text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300 ${c.startsWith('  ') ? 'pl-4' : ''}`}>
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
          {ko ? `본 방침은 ${EFFECTIVE}부터 시행됩니다.` : `This policy is effective from ${EFFECTIVE}.`}
        </p>
      </section>
    </article>
  )
}
