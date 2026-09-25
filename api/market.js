// Serverless API function for Vercel
// Fetches 100% free real-time market data from Yahoo Finance with zero API keys and zero cost

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const defaultSymbols = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'META', 'BVN', 'FSM', 'ABX.TO', 'SPY', 'QQQ']
  const querySymbols = req.query?.symbols ? req.query.symbols.split(',') : defaultSymbols

  try {
    const results = {}

    await Promise.all(
      querySymbols.map(async (sym) => {
        try {
          const resp = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            }
          )
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
              currency: meta.currency || 'USD'
            }
          }
        } catch (e) {
          // ignore individual symbol errors
        }
      })
    )

    // Cache in Vercel CDN for 15 seconds to ensure ultra-fast responses
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30')
    return res.status(200).json({
      success: true,
      timestamp: Date.now(),
      source: 'Yahoo Finance Real-Time Free API',
      data: results
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
