import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import About from '@/pages/About'
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
            <Suspense fallback={<PageFallback />}>
              <Teams />
            </Suspense>
          }
        />
        <Route
          path="matchup"
          element={
            <Suspense fallback={<PageFallback />}>
              <Matchup />
            </Suspense>
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
        <Route path="about" element={<About />} />
        <Route path="*" element={<UnderConstruction titleKey="nav.home" />} />
      </Route>
    </Routes>
  )
}
