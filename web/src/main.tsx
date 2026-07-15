import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import './store/settings'
import App from './App.tsx'

// Load Google AdSense on the live site only (see lib/ads). Enabling Auto Ads
// in the AdSense dashboard also provides the bottom anchor and interstitial
// (popup) formats with no extra code.
import { ADSENSE_CLIENT, adsEnabled, isInApp } from './lib/ads'
if (adsEnabled()) {
  const s = document.createElement('script')
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  document.head.appendChild(s)
}

// Inside the Android launcher: tag <html> so the layout reserves space for the
// native AdMob banner, and start native ads (no-op on the plain website).
if (isInApp()) {
  document.documentElement.classList.add('champs-in-app')
  void import('./lib/appAds').then((m) => m.initAppAds())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
