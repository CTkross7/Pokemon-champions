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
import { isInApp } from './lib/ads'
// The AdSense loader now lives in index.html <head> (guarded against in-app /
// localhost there) so site review finds it early. Nothing to inject here.

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
