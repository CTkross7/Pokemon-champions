import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import About from '@/pages/About'
import Dex from '@/pages/Dex'
import DexDetail from '@/pages/DexDetail'
import TypeChartPage from '@/pages/TypeChartPage'
import UnderConstruction from '@/pages/UnderConstruction'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dex" element={<Dex />} />
        <Route path="dex/types" element={<TypeChartPage />} />
        <Route path="dex/:id" element={<DexDetail />} />
        <Route path="calculator" element={<UnderConstruction titleKey="nav.calculator" />} />
        <Route path="teams" element={<UnderConstruction titleKey="nav.teams" />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<UnderConstruction titleKey="nav.home" />} />
      </Route>
    </Routes>
  )
}
