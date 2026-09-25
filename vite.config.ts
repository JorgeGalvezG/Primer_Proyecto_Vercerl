import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'market-api-dev',
      configureServer(server) {
        server.middlewares.use('/api/market', async (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          try {
            const symbols = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'META', 'BVN', 'FSM', 'ABX.TO', 'SPY', 'QQQ']
            const results: Record<string, any> = {}
            await Promise.all(
              symbols.map(async (sym) => {
                try {
                  const resp = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                  })
                  const json = await resp.json()
                  const meta = json?.chart?.result?.[0]?.meta
                  if (meta) {
                    results[sym] = {
                      ticker: sym,
                      name: meta.shortName || meta.longName || sym,
                      price: Number(meta.regularMarketPrice?.toFixed(2)) || 0,
                      changePct: Number(meta.regularMarketChangePercent?.toFixed(2)) || 0,
                      high: Number(meta.regularMarketDayHigh?.toFixed(2)) || 0,
                      low: Number(meta.regularMarketDayLow?.toFixed(2)) || 0,
                      open: Number(meta.chartPreviousClose?.toFixed(2)) || Number(meta.regularMarketPrice?.toFixed(2)) || 0,
                      volume: meta.regularMarketVolume || 0,
                      week52High: Number(meta.fiftyTwoWeekHigh?.toFixed(2)) || 0,
                      week52Low: Number(meta.fiftyTwoWeekLow?.toFixed(2)) || 0,
                    }
                  }
                } catch {}
              })
            )
            res.end(JSON.stringify({ success: true, timestamp: Date.now(), source: 'Yahoo Finance Free API', data: results }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: e.message }))
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve('src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
