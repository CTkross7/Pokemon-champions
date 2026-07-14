import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import About from '@/pages/About'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import DataSources from '@/pages/DataSources'
import AuthGate from '@/components/AuthGate'
import UnderConstruction from '@/pages/UnderConstruction'

// Route-level code splitting keeps the initial bundle small; @smogon/calc and
// the dex datasets load only when their pages are opened.
const Dex = lazy(() => import('@/pages/Dex'))
const DexDetail = lazy(() => import('@/pages/DexDetail'))
const TypeChartPage = lazy(() => import('@/pages/TypeChartPage'))
const Calculator = lazy(() => import('@/pages/Calculator'))
const Teams = lazy(() => import('@/pages/Teams'))
const Matchup = lazy(() => import('@/pages/Matchup'))
const Shared = lazy(() => import('@/pages/Shared'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Stats = lazy(() => import('@/pages/Stats'))
const Settings = lazy(() => import('@/pages/Settings'))
const Login = lazy(() => import('@/pages/Login'))
const Profile = lazy(() => import('@/pages/Profile'))
const Welcome = lazy(() => import('@/pages/Welcome'))
const Notices = lazy(() => import('@/pages/Notices'))
const Admin = lazy(() => import('@/pages/Admin'))

function PageFallback() {
  return <div className="card h-64 animate-pulse" />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="dex"
          element={
            <Suspense fallback={<PageFallback />}>
              <Dex />
            </Suspense>
          }
        />
        <Route
          path="dex/types"
          element={
            <Suspense fallback={<PageFallback />}>
              <TypeChartPage />
            </Suspense>
          }
        />
        <Route
          path="dex/:id"
          element={
            <Suspense fallback={<PageFallback />}>
              <DexDetail />
            </Suspense>
          }
        />
        <Route
          path="calculator"
          element={
            <Suspense fallback={<PageFallback />}>
              <Calculator />
            </Suspense>
          }
        />
        <Route
          path="teams"
          element={
            <AuthGate>
              <Suspense fallback={<PageFallback />}>
                <Teams />
              </Suspense>
            </AuthGate>
          }
        />
        <Route
          path="matchup"
          element={
            <AuthGate>
              <Suspense fallback={<PageFallback />}>
                <Matchup />
              </Suspense>
            </AuthGate>
          }
        />
        <Route
          path="share"
          element={
            <Suspense fallback={<PageFallback />}>
              <Shared />
            </Suspense>
          }
        />
        <Route
          path="gallery"
          element={
            <Suspense fallback={<PageFallback />}>
              <Gallery />
            </Suspense>
          }
        />
        <Route
          path="stats"
          element={
            <Suspense fallback={<PageFallback />}>
              <Stats />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageFallback />}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="login"
          element={
            <Suspense fallback={<PageFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageFallback />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="welcome"
          element={
            <Suspense fallback={<PageFallback />}>
              <Welcome />
            </Suspense>
          }
        />
        <Route
          path="notices"
          element={
            <Suspense fallback={<PageFallback />}>
              <Notices />
            </Suspense>
          }
        />
        <Route
          path="admin"
          element={
            <Suspense fallback={<PageFallback />}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="about" element={<About />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="data-sources" element={<DataSources />} />
        <Route path="*" element={<UnderConstruction titleKey="nav.home" />} />
      </Route>
    </Routes>
  )
}
