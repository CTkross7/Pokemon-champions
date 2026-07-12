/**
 * E2E smoke test: layout shell, i18n toggle, theme toggle, routing, persistence.
 *
 * Usage:
 *   npm run build && npm run test:e2e
 * (starts `vite preview` itself; needs Chromium — set CHROMIUM_PATH if
 *  Playwright's bundled browser is unavailable)
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 4173
const BASE = `http://localhost:${PORT}`

function resolveChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  // Managed environments ship Chromium under PLAYWRIGHT_BROWSERS_PATH with a
  // possibly different revision than the installed playwright package expects.
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (root && existsSync(root)) {
    const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d))
    if (dir) return `${root}/${dir}/chrome-linux/chrome`
  }
  return undefined // fall back to playwright's own resolution
}

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`preview server did not start at ${url}`)
}

const results = []
const check = (name, cond) => {
  results.push([name, cond])
  if (!cond) process.exitCode = 1
}
const eventually = (locator) =>
  locator.waitFor({ state: 'visible', timeout: 5000 }).then(
    () => true,
    () => false,
  )

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
try {
  await waitForServer(BASE)
  const browser = await chromium.launch({ executablePath: resolveChromium() })

  for (const viewport of [
    { width: 1280, height: 800, tag: 'desktop' },
    { width: 390, height: 844, tag: 'mobile' },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
    const consoleErrors = []
    page.on('pageerror', (e) => consoleErrors.push(String(e)))
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))

    await page.goto(BASE, { waitUntil: 'networkidle' })
    check(`[${viewport.tag}] hero renders (ko)`, await eventually(page.getByText('이기는 배틀을 위한 모든 도구')))
    check(`[${viewport.tag}] disclaimer footer`, await eventually(page.getByText('비공식 서비스')))
    check(
      `[${viewport.tag}] dark theme default`,
      await page.evaluate(() => document.documentElement.classList.contains('dark')),
    )

    await page.getByRole('button', { name: '언어' }).click()
    check(`[${viewport.tag}] language toggles to EN`, await eventually(page.getByText('Every tool you need to win')))

    await page.getByRole('button', { name: /mode/i }).click()
    check(
      `[${viewport.tag}] theme toggles to light`,
      await page.evaluate(() => !document.documentElement.classList.contains('dark')),
    )

    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
    check(`[${viewport.tag}] about page renders`, await eventually(page.getByText('About ChampsNote')))
    check(`[${viewport.tag}] developer credit`, await eventually(page.getByText('CTkross').first()))

    await page.goto(`${BASE}/nonexistent-route`, { waitUntil: 'networkidle' })
    check(`[${viewport.tag}] catch-all placeholder`, await eventually(page.getByText(/under construction|개발 중/)))

    // Calculator: pick attacker + defender, choose a move, assert a result
    await page.goto(`${BASE}/calculator`, { waitUntil: 'networkidle' })
    check(`[${viewport.tag}] calculator title`, await eventually(page.getByText(/Damage Calculator|데미지 계산기/).first()))
    const pickSpecies = async (panelLabel, name) => {
      const panel = page.locator('.card', { hasText: panelLabel }).first()
      await panel.getByRole('button').first().click()
      const box = page.getByRole('searchbox').last()
      await box.fill(name)
      await page.getByRole('button', { name: new RegExp(name) }).first().click()
    }
    await pickSpecies(/Attacker|공격 포켓몬/, 'Garchomp')
    await pickSpecies(/Defender|방어 포켓몬/, 'Heatran')
    // Select the first available move chip
    const moveChip = page.locator('button', { hasText: /\d{2,3}$/ }).first()
    await moveChip.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    await moveChip.click().catch(() => {})
    check(`[${viewport.tag}] calculator produces a % result`, await eventually(page.getByText(/%/).first()))

    // Dex: search Korean name, open detail, check stats + matchups
    await page.goto(`${BASE}/dex`, { waitUntil: 'networkidle' })
    const search = page.getByRole('searchbox')
    await search.waitFor({ state: 'visible', timeout: 5000 })
    await search.fill('피카츄')
    const pikachuCard = page.getByRole('link', { name: /피카츄|Pikachu/ }).first()
    check(`[${viewport.tag}] dex search finds Pikachu`, await eventually(pikachuCard))
    await pikachuCard.click()
    check(`[${viewport.tag}] dex detail base stats`, await eventually(page.getByText(/Base stats|종족값/)))
    check(`[${viewport.tag}] dex detail matchups`, await eventually(page.getByText(/Defensive matchups|방어 상성/)))
    check(`[${viewport.tag}] dex detail learnset rows`, await eventually(page.locator('table tbody tr').first()))

    // Type chart page
    await page.goto(`${BASE}/dex/types`, { waitUntil: 'networkidle' })
    check(`[${viewport.tag}] type chart renders`, await eventually(page.getByText(/Full type chart|전체 상성표/)))

    // Team builder: add a Pokémon to slot 1, expect speed tier + export text
    await page.goto(`${BASE}/teams`, { waitUntil: 'networkidle' })
    const addBtn = page.getByRole('button', { name: /Add Pokémon|포켓몬 추가/ }).first()
    await addBtn.waitFor({ state: 'visible', timeout: 5000 })
    await addBtn.click()
    await page.getByRole('searchbox').last().fill('Garchomp')
    await page.getByRole('button', { name: /Garchomp|한카리아스/ }).first().click()
    check(`[${viewport.tag}] team speed tier renders`, await eventually(page.getByText(/Speed line|스피드 라인/)))
    check(`[${viewport.tag}] team coach report renders`, await eventually(page.getByText(/Auto-Diagnosis|자동 진단/)))
    check(`[${viewport.tag}] coach meta threats`, await eventually(page.getByText(/Meta threat coverage|메타 위협 대응/)))
    await page.getByRole('button', { name: /^Export|내보내기/ }).first().click()
    const exportBox = page.locator('textarea')
    check(
      `[${viewport.tag}] team export contains species`,
      await exportBox
        .inputValue()
        .then((v) => /Garchomp/.test(v))
        .catch(() => false),
    )

    // Live matchup assistant: uses the saved team + an opponent
    await page.goto(`${BASE}/matchup`, { waitUntil: 'networkidle' })
    const oppPicker = page.getByRole('button', { name: /Add opponent|상대 포켓몬 추가/ }).first()
    await oppPicker.waitFor({ state: 'visible', timeout: 5000 })
    await oppPicker.click()
    await page.getByRole('searchbox').last().fill('Charizard')
    await page.getByRole('button', { name: /Charizard|리자몽/ }).first().click()
    check(`[${viewport.tag}] matchup recommends leads`, await eventually(page.getByText(/Recommended leads|추천 선출/)))
    check(`[${viewport.tag}] matchup threat ranking`, await eventually(page.getByText(/Threat ranking|위협도 순위/)))

    await page.goto(BASE, { waitUntil: 'networkidle' })
    check(`[${viewport.tag}] settings persist across reload`, await eventually(page.getByText('Every tool you need to win')))
    check(`[${viewport.tag}] no console errors`, consoleErrors.length === 0)
    if (consoleErrors.length) console.error('console errors:', consoleErrors)

    await page.close()
  }
  await browser.close()
} finally {
  preview.kill()
}

for (const [name, ok] of results) console.log(`${ok ? '✓' : '✗'} ${name}`)
console.log(process.exitCode ? 'SMOKE TEST FAILED' : 'SMOKE TEST PASSED')
