import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import './store/settings'
import App from './App.tsx'

// Load Google AdSense only when a publisher id is configured, so the app ships
// ad-free by default. Enabling Auto Ads in the AdSense dashboard also provides
// the bottom anchor and interstitial (popup) formats with no extra code.
const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined
if (adsenseClient) {
  const s = document.createElement('script')
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`
  document.head.appendChild(s)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
