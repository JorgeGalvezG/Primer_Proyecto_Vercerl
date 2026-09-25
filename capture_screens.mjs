import puppeteer from 'puppeteer-core'
import path from 'node:path'

const OUT_DIR = path.resolve('../capturas')
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:5173'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  console.log('Iniciando captura de pantallas con Puppeteer Core...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

  console.log(`Navegando a ${URL}...`)
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(1500)

  // 1. Dashboard Tema Claro
  console.log('Capturando Vista 1: Dashboard Tema Claro...')
  await page.screenshot({ path: path.join(OUT_DIR, 'vista1_dashboard_claro.png') })

  // 2. Dashboard Modo Oscuro
  console.log('Activando Modo Oscuro...')
  const themeToggle = await page.$('button[title*="Modo Oscuro"], button[aria-label*="Modo Oscuro"]')
  if (themeToggle) {
    await themeToggle.click()
    await sleep(600)
    console.log('Capturando Vista 5: Dashboard Modo Oscuro...')
    await page.screenshot({ path: path.join(OUT_DIR, 'vista5_dashboard_oscuro.png') })
    // Revert to light mode for subsequent screenshots
    const lightToggle = await page.$('button[title*="Tema Claro"], button[aria-label*="Tema Claro"]')
    if (lightToggle) await lightToggle.click()
    await sleep(400)
  }

  // 3. Watchlist & Alertas
  console.log('Navegando a Watchlist & Alertas...')
  const watchlistBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    return btns.find(b => b.textContent && b.textContent.includes('Watchlist'))
  })
  if (watchlistBtn) {
    await watchlistBtn.click()
    await sleep(800)
    console.log('Capturando Vista 2: Watchlist & Alertas...')
    await page.screenshot({ path: path.join(OUT_DIR, 'vista2_watchlist_alertas.png') })

    // 4. Modal Nueva Alerta
    console.log('Abriendo Modal Nueva Alerta...')
    const addAlertBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.find(b => b.textContent && b.textContent.includes('Agregar Alerta'))
    })
    if (addAlertBtn) {
      await addAlertBtn.click()
      await sleep(600)
      console.log('Capturando Vista 2: Modal Nueva Alerta con Overlay...')
      await page.screenshot({ path: path.join(OUT_DIR, 'vista2_modal_nueva_alerta.png') })

      // Cerrar modal
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'))
        return btns.find(b => b.textContent && b.textContent.includes('Cancelar'))
      })
      if (cancelBtn) await cancelBtn.click()
      await sleep(400)
    }
  }

  // 5. Trading / Ejecución de Órdenes
  console.log('Navegando a Trading / Operaciones...')
  const tradeBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    return btns.find(b => b.textContent && (b.textContent.includes('Operar') || b.textContent.includes('Trading')))
  })
  if (tradeBtn) {
    await tradeBtn.click()
    await sleep(800)
    console.log('Capturando Vista 3: Trading / Ejecución de Órdenes (3 columnas)...')
    await page.screenshot({ path: path.join(OUT_DIR, 'vista3_trading_ordenes.png') })
  }

  // 6. Leaderboard / Liga de Trading
  console.log('Navegando a Leaderboard / Liga de Trading...')
  const leaderboardBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    return btns.find(b => b.textContent && (b.textContent.includes('Liga') || b.textContent.includes('Leaderboard')))
  })
  if (leaderboardBtn) {
    await leaderboardBtn.click()
    await sleep(800)
    console.log('Capturando Vista 6: Leaderboard / Liga de Trading...')
    await page.screenshot({ path: path.join(OUT_DIR, 'vista6_leaderboard.png') })
  }

  // 7. Vista Mobile (3 Pantallas iPhone 14)
  console.log('Navegando a Vista Mobile (390x844px)...')
  const mobileBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    return btns.find(b => b.textContent && b.textContent.includes('Vista Mobile'))
  })
  if (mobileBtn) {
    await mobileBtn.click()
    await sleep(1000)
    console.log('Capturando Vista 4: Versión Móvil 3 Pantallas iPhone 14...')
    await page.screenshot({ path: path.join(OUT_DIR, 'vista4_mobile_3pantallas.png') })
  }

  console.log('¡Todas las capturas de pantalla han sido tomadas con éxito!')
  await browser.close()
}

run().catch(err => {
  console.error('Error durante la captura:', err)
  process.exit(1)
})
