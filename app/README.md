# 챔스노트 Android 런처 (Capacitor + AdMob)

웹사이트(**champsnote.pages.dev**)를 그대로 띄우는 얇은 **런처(WebView 셸)** 앱입니다.
콘텐츠는 라이브 사이트를 로드하므로 **웹을 배포하면 앱도 즉시 최신 상태**가 되고(스토어
업데이트 불필요), 웹이 못 하는 부분만 네이티브로 처리합니다.

- **AdMob 광고** — 구글은 WebView/앱 안에서 AdSense를 금지하므로, 앱에서는 웹 AdSense를
  끄고(`web/src/lib/ads.ts` → `isInApp`) 네이티브 AdMob 배너/전면 광고를 띄웁니다.
- 스플래시 화면, 상태바 테마, 안드로이드 뒤로가기 처리.

## 구조

```
app/
  capacitor.config.ts   # appId·appName·server.url·UA·플러그인 설정
  www/index.html        # 첫 로딩/오프라인 폴백 화면 (원격 사이트가 곧 덮어씀)
  android/              # 생성된 네이티브 프로젝트 (커밋됨, Android Studio로 빌드)
```

웹 쪽 연동:
- `web/src/lib/ads.ts` — `isInApp()`가 UA의 `ChampsNoteApp`를 감지해 AdSense를 끔.
- `web/src/lib/appAds.ts` — 앱 안에서만 AdMob 플러그인을 동적 로드해 배너/전면 광고 표시.
- `main.tsx` — 앱이면 `<html>`에 `champs-in-app` 클래스 추가(배너 자리 확보) + AdMob 시작.

## 준비물

- Node 18+
- **Android Studio** (SDK, Platform-Tools, JDK 17 포함) — APK/AAB 빌드에 필수.
  > 이 저장소의 샌드박스에는 Android SDK가 없어 여기서는 APK를 빌드할 수 없습니다.
  > `android/` 프로젝트 생성·설정까지 완료되어 있으니, 아래 절차대로 로컬/CI의
  > Android Studio 환경에서 빌드하세요.

## 개발 워크플로

```bash
cd app
npm install                 # 최초 1회
npx cap sync android        # 웹 폴백/플러그인/설정 반영
npx cap open android        # Android Studio 열기 → Run ▶
```

- `server.url`이 원격이라 대부분의 화면은 라이브 사이트가 뜹니다.
- 로컬 웹 빌드를 번들하고 싶으면(오프라인 완결형) `npm run build:web` 후
  `capacitor.config.ts`의 `server.url`을 주석 처리하고 `npx cap sync android`.

## AdSense와 AdMob 함께 쓰기 (중요)

**둘 다 사용하지만, 플랫폼별로 나뉩니다** — 이게 구글 정책상 유일하게 허용되는 방식입니다.

| 접속 환경 | 표시 광고 | 코드 |
|---|---|---|
| 브라우저(웹) | **AdSense** | `web/src/lib/ads.ts` · `main.tsx` |
| 챔스노트 앱(WebView) | **AdMob** | `web/src/lib/appAds.ts` |

- 앱 안(WebView)에서는 `isInApp()`이 AdSense를 **끄고** AdMob을 켭니다.
  > ⚠️ 구글 **AdSense 정책은 앱/WebView 안에서 AdSense 게재를 금지**합니다.
  > 앱 안에 AdSense를 넣으면 계정이 정지될 수 있어, 앱은 반드시 AdMob만 씁니다.
  > (두 계정은 동시에 활성 상태로 두고, 각자 자기 화면에서 수익이 발생합니다.)
- AdSense 계정과 AdMob 계정은 같은 구글 계정에서 함께 운영 가능합니다.

## AdMob 설정 (콘솔 단계별)

현재 코드는 구글 **공개 테스트 ID**로 동작합니다(수익 없음, 크래시 방지용).
실 수익화하려면 [AdMob 콘솔](https://apps.admob.com)에서:

**1) 앱 등록 → 앱 ID 넣기**
- 앱 > 앱 추가 > Android > "챔스노트" (스토어 미등록 상태로도 생성 가능).
- 발급된 **앱 ID**(`ca-app-pub-XXXX~YYYY`, `~` 포함)를
  `android/app/src/main/AndroidManifest.xml`의
  `com.google.android.gms.ads.APPLICATION_ID` 값에 붙여넣기.
- ⚠️ 앱 ID를 바꾸면 **APK 재빌드** 필요.

**2) 광고 단위 만들기** (스크린샷의 "광고 단위 만들기" 화면)
- **배너** 선택 → 이름(예: `champsnote-banner`) → 생성 → 단위 ID(`ca-app-pub-XXXX/BBBB`) 복사.
- **전면 광고** 선택 → 이름(예: `champsnote-interstitial`) → 생성 → 단위 ID 복사.
- (선택) 보상형/네이티브/앱오프닝은 지금 코드에서 미사용 — 나중에 확장 시 추가.

**3) 단위 ID를 웹 빌드 환경변수로 주입** (앱이 라이브 사이트를 로드하므로 웹에 설정)
- Cloudflare Pages > 프로젝트 > Settings > Environment variables 에 추가:
  ```
  VITE_ADMOB_BANNER=ca-app-pub-XXXX/BBBB
  VITE_ADMOB_INTERSTITIAL=ca-app-pub-XXXX/IIII
  VITE_ADMOB_TESTING=false
  ```
- 웹을 다시 배포하면 **APK 재빌드 없이** 앱에도 실 광고가 반영됩니다.
  (단위 ID는 웹 빌드에 들어가고, 앱 ID만 APK에 들어갑니다.)
- 로컬 테스트는 `web/.env.local`에 같은 변수 + `VITE_ADMOB_TEST_DEVICE=<기기 테스트ID>`.

**4) 동의(UMP)·app-ads.txt**
- EEA/영국 사용자 동의는 `appAds.ts`가 UMP로 자동 처리(요청→필요 시 동의 폼).
  AdMob 콘솔 > 개인정보 보호 및 메시지에서 GDPR 메시지를 만들어두세요.
- 웹 루트에 `app-ads.txt`를 두고 AdMob 퍼블리셔 라인을 추가하면 무효 트래픽 방지에 도움.

## 릴리스 빌드 (Play 스토어) — 단계별

> ⚠️ 이 저장소 개발환경엔 Android SDK가 없어 AAB 컴파일은 **Android Studio(또는 SDK
> 설치된 PC)** 에서 해야 합니다. 아래는 그 PC에서의 절차이며, 서명 설정·버전은 이미
> 프로젝트에 반영돼 있습니다.

**0) 최초 1회 준비**
```bash
cd app
npm install
npx cap sync android   # 웹 폴백·플러그인·설정 동기화
```

**1) 앱 아이콘** — **이미 브랜드 아이콘이 `android/.../res/mipmap-*`에 반영돼 있습니다.**
어댑티브 아이콘 배경=볼트그린(`#CAFB02`, `res/values/ic_launcher_background.xml`), 전경=챔스노트
CN 로고(안전영역 여백 포함). 런처가 원형·스퀘어클로 잘라도 검은 테두리 없이 볼트 배경이 꽉 찹니다.
> **아이콘만 바꿀 거면 별도 명령 없이 APK만 다시 빌드하면 됩니다.**

(선택) 로고를 교체하려면 `app/assets/`의 소스(`icon.png`·`icon-foreground.png`·`icon-background.png`)를
바꾼 뒤 아래로 재생성합니다. 스플래시만 새로 뽑을 때도 사용:
```powershell
npx @capacitor/assets generate --android --splashBackgroundColor "#050505" --splashBackgroundColorDark "#050505"
npx cap sync android
```
(이 도구는 `sharp`를 쓰며 일반 PC에선 정상 설치됩니다. `icon-foreground.png`+`icon-background.png`가
있으면 그 두 레이어로 어댑티브 아이콘을 만듭니다.)

**2) 업로드 키스토어 생성(최초 1회)** — 서명 주체를 `ctkross.champsnote.dev`로 반영:
한 줄로(bash·PowerShell 공통):
```bash
keytool -genkeypair -v -keystore champsnote.jks -alias upload -keyalg RSA -keysize 2048 -validity 10950 -dname "CN=ctkross.champsnote.dev, OU=ChampsNote, O=CTkross, L=Seoul, S=Seoul, C=KR"
```
- `CN`(주체)에 `ctkross.champsnote.dev`가 서명 인증서에 박힙니다. `O`/`OU`는 자유롭게 조정.
- 앱 식별자(applicationId)도 `dev.champsnote.ctkross`(= ctkross.champsnote.dev 역순)로 반영돼 있습니다. **출시 후에는 변경 불가**이니 지금 값이 맞는지 확인하세요.

`app/android/keystore.properties` 생성(**커밋 금지** — .gitignore 등록됨):
```
storeFile=/absolute/path/to/champsnote.jks
storePassword=<키스토어 비밀번호>
keyAlias=upload
keyPassword=<키 비밀번호>
```
> build.gradle의 서명 설정이 이 파일을 자동으로 읽습니다(없으면 debug 키로 폴백).
> Play App Signing을 켜면 이 키는 "업로드 키"로 쓰이고 실제 배포 서명은 Google이 관리합니다(권장).

**3) 버전 올리기** — `app/android/app/build.gradle`에서 업로드마다 `versionCode`를 **+1**
(현재 1), `versionName`은 라벨(현재 "1.7.6").

**4) AAB 빌드**
```bash
cd app/android
./gradlew bundleRelease
# 산출물: app/build/outputs/bundle/release/app-release.aab
```
또는 Android Studio → **Build > Generate Signed Bundle/APK > Android App Bundle**.

**5) [Play Console](https://play.google.com/console) 업로드**
- 앱 이름/아이콘/스크린샷/피처 그래픽: `docs/store-assets/` 참고.
- **데이터 안전(Data safety)**: 이메일/구글 로그인·팀 데이터 저장(계정 연동), AdMob
  광고 식별자(AD_ID) 사용을 정확히 신고.
- 콘텐츠 등급, 개인정보처리방침 URL(`https://champsnote.pages.dev/privacy`) 입력.
- 내부 테스트 → 비공개/공개 테스트 → 프로덕션.

> 광고: 실 AdMob ID 미반영 상태로도 빌드·출시는 가능합니다(테스트 광고만 노출, 수익 0).
> 위 "AdMob 설정"대로 실 ID를 넣으면 재빌드 없이(단위 ID) 광고가 실 광고로 바뀝니다.

## APK 직접 배포 (웹 /download 페이지)

스토어(AAB) 외에, 웹사이트에서 **APK를 바로 내려받게** 하는 다운로드 페이지가 있습니다
(`champsnote.pages.dev/download`, 홈 상단 배너·하단 "앱" 메뉴에서 진입). APK 파일만
호스팅하고 그 URL을 환경변수로 넣으면 다운로드 버튼이 활성화됩니다.

**1) APK 만들기 (release, 서명됨)**
```powershell
cd app\android
.\gradlew.bat assembleRelease
# 산출물: app\build\outputs\apk\release\app-release.apk
```

**Android Studio에서 만들고 파일 찾기(GUI):**
- **Build > Build Bundle(s) / APK(s) > Build APK(s)** 실행.
- 완료 알림(우하단)에서 **"locate"** 클릭 → 파일 탐색기에서 `app-release.apk` 위치가 열림.
- 경로: `app\android\app\build\outputs\apk\release\app-release.apk`.
- 그 파일을 아무 이름(예: `champsnote.apk`)으로 복사해 아래 중 한 곳에 올립니다.

**2) APK 호스팅 — 저장소 공개 여부에 따라**

> ⚠️ 이 저장소는 **비공개(private)**입니다. **비공개 저장소의 GitHub Releases 첨부파일은
> 로그인·권한이 있는 사람만** 받을 수 있어(비로그인 방문자는 404), 웹사이트 공개 배포엔
> 쓸 수 없습니다. 그래서 아래 **(권장) public 폴더** 방식을 사용합니다.

- **(권장, 비공개 저장소용) Cloudflare Pages public 폴더** — `web/public/champsnote.apk`로
  커밋·배포하면 `/champsnote.apk`(같은 도메인)로 **누구나** 받습니다. 소스는 비공개 그대로.
  1. 빌드한 `app-release.apk`를 `web/public/champsnote.apk`로 복사.
  2. 커밋·푸시 → Cloudflare Pages가 자동 배포.
  - PWA 프리캐시 대상(js/css/html/svg/woff2)에 apk는 없어 캐시로 부풀지 않고, 실제 파일이라
    SPA 폴백보다 우선 서빙됩니다.

- **(저장소가 public일 때만) GitHub Releases** — 바이너리를 git에 안 쌓음.
  1. Releases > "Draft a new release" > 태그(예: `v1.8.0`) > `champsnote.apk` 첨부 > Publish.
  2. URL: `https://github.com/<owner>/<repo>/releases/latest/download/champsnote.apk`
     (파일명을 매번 `champsnote.apk`로 통일하면 `latest`가 항상 최신을 가리킴.)

**3) 다운로드 버튼 활성화 (Cloudflare Pages 환경변수)**
```
VITE_APK_URL=/champsnote.apk   # public 폴더 방식(비공개 저장소 권장)
VITE_APK_VERSION=1.8.0
VITE_APK_SIZE=6.97 MB          # 실제 파일 크기(선택)
VITE_PLAY_URL=...              # 스토어 출시 후 Play 링크(선택)
```
- 웹을 다시 배포하면 `/download` 페이지의 **"APK 다운로드"** 버튼이 켜지고, 위 값이 반영됩니다.
- `VITE_APK_URL`이 비어 있으면 버튼은 "다운로드 준비 중" 상태로 안전하게 표시됩니다(깨진 링크 없음).
- 새 버전 배포: APK 새로 올리고(같은 파일명) `VITE_APK_VERSION`만 올린 뒤 웹 재배포.

## 참고 / 정책

- 팬메이드 비공식 유틸리티임을 앱 설명·앱 내에 고지(웹 About/Privacy와 동일).
- WebView 단순 래핑 앱은 Play 정책의 "최소 기능" 심사를 받을 수 있으므로, 네이티브
  광고·스플래시·오프라인 폴백 등 부가 가치를 유지합니다.
- 상표: 앱 이름/아이콘에 "Pokémon"을 직접 쓰지 않습니다(브랜드는 "챔스노트").

## 네이티브 구글 로그인 (앱 내 구글 로그인 유지)

앱(WebView)에서 구글 로그인을 그대로 쓰고 **로그인 상태도 유지**되게 하는 네이티브 연동.
구조: 네이티브 구글 SDK로 `id_token` 획득 → 앱 WebView에서 `/api/auth/google/native`로
전송 → Worker가 검증 후 **세션 쿠키 발급**(같은 도메인이라 앱에 그대로 저장). 브라우저 이탈·
딥링크 불필요. (미설정 시 앱은 자동으로 브라우저 열기로 폴백하므로 언제든 안전.)

**1) 구글 클라우드 — Android OAuth 클라이언트 생성**
console.cloud.google.com → APIs & Services → Credentials → Create credentials →
OAuth client ID → **Android**:
- 패키지 이름: `dev.champsnote.ctkross`
- SHA-1 인증서 지문(업로드 키에서 추출):
  `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore "champsnote.jks" -alias upload`
  (출력의 `SHA1:` 값. Play App Signing을 켜면 Play 콘솔의 앱 서명 SHA-1도 추가 등록 필요.)

**2) Web 클라이언트 ID 확인** — 기존 웹 구글 로그인 값(= Worker의 `GOOGLE_CLIENT_ID`,
`...apps.googleusercontent.com`). 공개값이며 네이티브 serverClientId로 사용.

**3) 웹 환경변수** (Cloudflare Pages > Environment variables): `VITE_GOOGLE_CLIENT_ID=<Web 클라이언트 ID>`
- Worker `GOOGLE_CLIENT_ID`와 **같은 값**이어야 audience 검증 통과.

**4) 플러그인 설치 + APK 재빌드**
```powershell
cd app
npm install
npx cap sync android
cd android
.\gradlew.bat assembleRelease
```
- 미설정 시 버튼은 기존처럼 브라우저 열기로 폴백(무해).
