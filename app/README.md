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

## AdMob 설정 (출시 전 필수)

현재는 구글 **공개 테스트 ID**로 동작합니다(수익 없음, 크래시 방지용). 실제 수익화 시:

1. **앱 ID** — [AdMob 콘솔](https://apps.admob.com)에서 앱 생성 후 앱 ID를
   `android/app/src/main/AndroidManifest.xml`의
   `com.google.android.gms.ads.APPLICATION_ID` 값에 넣기.
2. **광고 단위 ID** — 배너/전면 단위를 만들고, 웹 빌드 환경변수로 주입:
   ```
   VITE_ADMOB_BANNER=ca-app-pub-XXXX/BBBB
   VITE_ADMOB_INTERSTITIAL=ca-app-pub-XXXX/IIII
   VITE_ADMOB_TESTING=false
   ```
   (웹을 다시 배포하면 앱에도 반영됩니다.)
3. **app-ads.txt** — 웹 루트에 `app-ads.txt`를 두고 AdMob 퍼블리셔 라인을 추가하면
   무효 트래픽 방지에 도움이 됩니다.

## 릴리스 빌드 (Play 스토어)

1. `android/app/build.gradle`에서 `versionCode`(정수 +1)·`versionName` 갱신.
2. 업로드 키스토어 생성(최초 1회):
   ```bash
   keytool -genkey -v -keystore champsnote.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
   `android/keystore.properties`에 경로/별칭/비밀번호를 두고 `build.gradle` 서명 설정에 연결
   (키스토어·비밀번호는 **커밋 금지**, `.gitignore`에 포함됨).
3. Android Studio → **Build > Generate Signed Bundle/APK > Android App Bundle(.aab)**.
4. [Play Console](https://play.google.com/console)에 AAB 업로드:
   - 앱 이름/아이콘/스크린샷은 `docs/store-assets/` 참고.
   - **데이터 안전(Data safety)** 양식: 이메일/구글 로그인·팀 데이터 저장(계정 연동),
     AdMob 광고 식별자 사용을 정확히 신고.
   - 콘텐츠 등급, 개인정보처리방침 URL(`/privacy`) 입력.
5. 내부 테스트 → 비공개/공개 테스트 → 프로덕션 단계로 출시.

## 참고 / 정책

- 팬메이드 비공식 유틸리티임을 앱 설명·앱 내에 고지(웹 About/Privacy와 동일).
- WebView 단순 래핑 앱은 Play 정책의 "최소 기능" 심사를 받을 수 있으므로, 네이티브
  광고·스플래시·오프라인 폴백 등 부가 가치를 유지합니다.
- 상표: 앱 이름/아이콘에 "Pokémon"을 직접 쓰지 않습니다(브랜드는 "챔스노트").
