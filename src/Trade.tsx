import React, { useState, useId } from 'react'
import {
  TrendingUp, TrendingDown, ChevronDown, AlertCircle, CheckCircle2,
  Clock, XCircle, ArrowLeft, Shield, Sliders, BarChart2
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Side      = 'compra' | 'venta'
type OrderType = 'Mercado' | 'Límite' | 'Stop' | 'Stop-Límite'
type Period    = '1min' | '5min' | '15min' | '1H' | '4H' | '1D' | '1W'
type Indicator = 'Ninguno' | 'SMA' | 'EMA' | 'RSI' | 'MACD'

export interface TradeProps {
  initialTicker?: string
  dark?: boolean
  onBackToDashboard?: () => void
  onOrderSuccess?: (msg: string) => void
}

// ── Data ──────────────────────────────────────────────────────────────────────

const ASSETS_MAP: Record<string, {
  ticker: string; name: string; sector: string
  price: number; change: number; changePct: number
  open: number; high: number; low: number
  week52High: number; week52Low: number
  volume: number; marketCap: number
}> = {
  AAPL: {
    ticker: 'AAPL', name: 'Apple Inc.', sector: 'Tecnología',
    price: 190.12, change: -1.34, changePct: -0.70,
    open: 191.46, high: 192.18, low: 189.75,
    week52High: 237.23, week52Low: 164.08,
    volume: 58_432_100, marketCap: 2_910_000_000_000,
  },
  BVN: {
    ticker: 'BVN', name: 'Compañía de Minas Buenaventura', sector: 'Minería / Metales',
    price: 16.85, change: +0.65, changePct: +4.01,
    open: 16.20, high: 17.10, low: 16.15,
    week52High: 18.90, week52Low: 9.80,
    volume: 3_820_000, marketCap: 4_280_000_000,
  },
  FSM: {
    ticker: 'FSM', name: 'Fortuna Mining Corp.', sector: 'Metales Preciosos',
    price: 4.92, change: +0.28, changePct: +6.03,
    open: 4.65, high: 5.05, low: 4.60,
    week52High: 6.10, week52Low: 2.85,
    volume: 8_120_000, marketCap: 1_510_000_000,
  },
  'ABX.TO': {
    ticker: 'ABX.TO', name: 'Barrick Gold Corporation', sector: 'Minería / Oro',
    price: 24.80, change: +0.45, changePct: +1.85,
    open: 24.35, high: 25.10, low: 24.20,
    week52High: 27.50, week52Low: 18.20,
    volume: 12_400_000, marketCap: 43_600_000_000,
  },
  TSLA: {
    ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotriz / Tech',
    price: 243.18, change: +7.56, changePct: +3.21,
    open: 235.60, high: 245.80, low: 234.10,
    week52High: 271.00, week52Low: 138.80,
    volume: 89_100_000, marketCap: 774_000_000_000,
  },
  NVDA: {
    ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductores',
    price: 875.32, change: +40.87, changePct: +4.90,
    open: 835.00, high: 882.00, low: 832.00,
    week52High: 974.00, week52Low: 392.00,
    volume: 143_210_000, marketCap: 2_150_000_000_000,
  },
}

// Exactly $68,420.00 Buying Power as required
const BUYING_POWER = 68_420.00

// Generate reproducible candle data
function genCandles(n: number, base: number, vol: number) {
  const result = []
  let price = base
  for (let i = 0; i < n; i++) {
    const d = (Math.sin(i * 0.7) + Math.cos(i * 0.3)) * vol * 0.5
    const open  = price
    const close = price + d
    const high  = Math.max(open, close) + Math.abs(d) * 0.45 + 0.3
    const low   = Math.min(open, close) - Math.abs(d) * 0.45 - 0.3
    const v     = 2_000_000 + Math.abs(Math.sin(i * 1.3)) * 3_000_000
    result.push({ open, close, high, low, volume: v, time: `${9 + Math.floor(i / 6)}:${(i % 6) * 10 || '00'}` })
    price = close
  }
  return result
}

// Depth Order Book
function genBook(mid: number) {
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: mid + (5 - i) * 0.12,
    qty: Math.floor(800 + Math.sin((5 - i) * 2.1) * 600 + 400),
  }))
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: mid - (i + 1) * 0.12,
    qty: Math.floor(900 + Math.cos(i * 1.7) * 700 + 500),
  }))
  return { asks, bids }
}

const INITIAL_ORDER_HISTORY = [
  { id: 1, date: 'Hoy 10:45', side: 'compra' as Side, type: 'Mercado', qty: 25, price: 189.80, status: 'Ejecutada' },
  { id: 2, date: 'Hoy 09:32', side: 'venta' as Side, type: 'Límite', qty: 15, price: 192.50, status: 'Ejecutada' },
  { id: 3, date: 'Ayer 15:10', side: 'compra' as Side, type: 'Límite', qty: 50, price: 187.00, status: 'Cancelada' },
  { id: 4, date: 'Ayer 11:20', side: 'compra' as Side, type: 'Stop', qty: 20, price: 185.50, status: 'Ejecutada' },
  { id: 5, date: '23 Sep 14:05', side: 'venta' as Side, type: 'Mercado', qty: 30, price: 191.20, status: 'Ejecutada' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtCap = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  return `$${fmt(n, 0)}`
}

const fmtVol = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return fmt(n, 0)
}

// ── Candlestick Chart Component with TradingView #131722 dark background ──────

function TradingViewChart({
  candles, indicator, period, setPeriod, setIndicator
}: {
  candles: ReturnType<typeof genCandles>
  indicator: Indicator
  period: Period
  setPeriod: (p: Period) => void
  setIndicator: (ind: Indicator) => void
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const W = 680, H = 340
  const PAD = { top: 20, right: 60, bottom: 25, left: 15 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const lows = candles.map(d => d.low)
  const highs = candles.map(d => d.high)
  const yMin = Math.floor(Math.min(...lows) - 0.5)
  const yMax = Math.ceil(Math.max(...highs) + 0.5)
  const toY = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * innerH
  const slotW = innerW / candles.length
  const barW = Math.max(Math.floor(slotW * 0.65), 3)

  const ticks = [
    yMin,
    yMin + (yMax - yMin) * 0.25,
    yMin + (yMax - yMin) * 0.5,
    yMin + (yMax - yMin) * 0.75,
    yMax
  ]

  // Calculate SMA line
  const smaPoints = candles.map((c, i) => {
    if (i < 5) return null
    const slice = candles.slice(i - 4, i + 1)
    const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / 5
    return { x: PAD.left + slotW * i + slotW / 2, y: toY(avg) }
  }).filter(Boolean) as { x: number; y: number }[]

  const smaPath = smaPoints.length > 0
    ? smaPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : ''

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-[#2A2E39]" style={{ background: '#131722' }}>
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[#2A2E39] bg-[#1E222D]">
        {/* Period Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-gray-400 mr-1">Periodo:</span>
          {(['1min', '5min', '15min', '1H', '4H', '1D', '1W'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                period === p
                  ? 'bg-[#2962FF] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2E39]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Technical Indicators Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-400">Indicadores:</span>
          <select
            value={indicator}
            onChange={e => setIndicator(e.target.value as Indicator)}
            className="bg-[#131722] text-xs text-gray-200 border border-[#2A2E39] rounded px-2 py-1 outline-none focus:border-[#2962FF]"
          >
            <option value="Ninguno">Ninguno</option>
            <option value="SMA">SMA (Media Móvil 5p)</option>
            <option value="EMA">EMA (Exponencial)</option>
            <option value="RSI">RSI (Fuerza Relativa)</option>
            <option value="MACD">MACD</option>
          </select>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none">
          {/* Horizontal Grid lines and Y-axis Price Labels */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={toY(t)}
                y2={toY(t)}
                stroke="#242832"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={W - PAD.right + 6}
                y={toY(t) + 3}
                fill="#787B86"
                fontSize={10}
                fontFamily="Consolas, monospace"
              >
                ${fmt(t, 2)}
              </text>
            </g>
          ))}

          {/* Candlestick Bars */}
          {candles.map((d, i) => {
            const cx = PAD.left + slotW * i + slotW / 2
            const bull = d.close >= d.open
            const candleColor = bull ? '#089981' : '#F23645'
            const bTop = Math.min(toY(d.open), toY(d.close))
            const bBot = Math.max(toY(d.open), toY(d.close))
            const bH = Math.max(bBot - bTop, 2)

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-crosshair"
              >
                {/* Wick */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={toY(d.high)}
                  y2={toY(d.low)}
                  stroke={candleColor}
                  strokeWidth={1.5}
                />
                {/* Body */}
                <rect
                  x={cx - barW / 2}
                  y={bTop}
                  width={barW}
                  height={bH}
                  fill={candleColor}
                  rx={0.5}
                />
                {/* Timestamp at bottom every 6 candles */}
                {i % 6 === 0 && (
                  <text
                    x={cx}
                    y={H - 6}
                    fill="#787B86"
                    fontSize={9}
                    textAnchor="middle"
                    fontFamily="Consolas, monospace"
                  >
                    {d.time}
                  </text>
                )}
              </g>
            )
          })}

          {/* Indicator Overlay (e.g. SMA/EMA) */}
          {(indicator === 'SMA' || indicator === 'EMA') && smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#F0B90B"
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-3 left-4 bg-[#1E222D]/90 border border-[#2A2E39] rounded px-3 py-1.5 text-[11px] text-gray-200 pointer-events-none font-mono flex items-center gap-3 backdrop-blur shadow-md"
          >
            <span className="text-gray-400">O: <strong className="text-white">${fmt(candles[hoveredIdx].open)}</strong></span>
            <span className="text-gray-400">H: <strong className="text-emerald-400">${fmt(candles[hoveredIdx].high)}</strong></span>
            <span className="text-gray-400">L: <strong className="text-rose-400">${fmt(candles[hoveredIdx].low)}</strong></span>
            <span className="text-gray-400">C: <strong className="text-white">${fmt(candles[hoveredIdx].close)}</strong></span>
            <span className="text-gray-400">Vol: <strong className="text-blue-400">{fmtVol(candles[hoveredIdx].volume)}</strong></span>
          </div>
        )}
      </div>

      {/* RSI / MACD sub-panel indicator */}
      {(indicator === 'RSI' || indicator === 'MACD') && (
        <div className="h-20 border-t border-[#2A2E39] bg-[#161A25] px-3 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>{indicator === 'RSI' ? 'RSI (14) — [Sobrecompra 70 / Sobrevenda 30]' : 'MACD (12, 26, 9)'}</span>
            <span className={indicator === 'RSI' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
              {indicator === 'RSI' ? '54.20 Neutral' : 'Hist: +0.48 / MACD: 1.25'}
            </span>
          </div>
          <div className="h-12 w-full flex items-center justify-center">
            <svg viewBox="0 0 600 40" className="w-full h-full">
              <line x1="0" x2="600" y1="10" y2="10" stroke="#363C4E" strokeDasharray="2 2" />
              <line x1="0" x2="600" y1="30" y2="30" stroke="#363C4E" strokeDasharray="2 2" />
              <path
                d="M 0 24 Q 80 12 160 22 T 320 18 T 480 28 T 600 16"
                fill="none"
                stroke={indicator === 'RSI' ? '#F0B90B' : '#2962FF'}
                strokeWidth={1.8}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Trade View Component (3 Columns) ─────────────────────────────────────

export default function Trade({
  initialTicker = 'AAPL',
  dark = false,
  onBackToDashboard,
  onOrderSuccess
}: TradeProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker)
  const [side, setSide] = useState<Side>('compra')
  const [orderType, setOrderType] = useState<OrderType>('Mercado')
  const [quantity, setQuantity] = useState<number>(20)
  const [limitPrice, setLimitPrice] = useState<number>(190.12)
  const [period, setPeriod] = useState<Period>('1D')
  const [indicator, setIndicator] = useState<Indicator>('SMA')
  const [orderHistory, setOrderHistory] = useState(INITIAL_ORDER_HISTORY)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const asset = ASSETS_MAP[selectedTicker] || ASSETS_MAP['AAPL']
  const candles = React.useMemo(() => genCandles(36, asset.price * 0.97, asset.price * 0.015), [asset.price])
  const book = React.useMemo(() => genBook(asset.price), [asset.price])

  // Calculation of effective price & total cost
  const effectivePrice = orderType === 'Mercado' ? asset.price : (limitPrice || asset.price)
  const totalCost = quantity * effectivePrice
  const exceedsPower = side === 'compra' && totalCost > BUYING_POWER
  const maxAskQty = Math.max(...book.asks.map(a => a.qty))
  const maxBidQty = Math.max(...book.bids.map(b => b.qty))

  const rangePct = Math.min(
    100,
    Math.max(0, ((asset.price - asset.week52Low) / (asset.week52High - asset.week52Low)) * 100)
  )

  const handlePercentageClick = (pct: number) => {
    const budget = BUYING_POWER * pct
    const calcQty = Math.floor(budget / effectivePrice)
    setQuantity(Math.max(1, calcQty))
  }

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (exceedsPower) return

    const newOrder = {
      id: Date.now(),
      date: 'Hoy Justo ahora',
      side,
      type: orderType,
      qty: quantity,
      price: effectivePrice,
      status: 'Ejecutada',
    }
    setOrderHistory([newOrder, ...orderHistory])
    const msg = `Orden de ${side.toUpperCase()} de ${quantity} ${asset.ticker} ejecutada con éxito a $${fmt(effectivePrice)}`
    setSuccessToast(msg)
    onOrderSuccess?.(msg)
    setTimeout(() => setSuccessToast(null), 4000)
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 w-full max-w-[1520px] mx-auto min-h-screen">
      {/* Top Header Breadcrumb & Ticker Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b t-border">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold t-card border t-border t-text1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={14} /> Volver al Dashboard
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider t-text2">Operar Activo:</span>
            <div className="flex items-center gap-1">
              {Object.keys(ASSETS_MAP).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTicker(t)
                    setLimitPrice(ASSETS_MAP[t].price)
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    selectedTicker === t
                      ? 'bg-[#1F3864] text-white shadow-sm'
                      : 't-card border t-border t-text2 hover:t-text1'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mercado Abierto NYSE / BVL</span>
          </div>
          <div className="text-xs font-mono-data t-text2">
            Poder de compra: <strong className="t-text1 font-bold">${fmt(BUYING_POWER)}</strong>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* 3-Column Layout: 30% LEFT | 45% CENTER | 25% RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUMNA IZQUIERDA (30% -> lg:col-span-4 / col-span-3.6) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. Panel de información del activo */}
          <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {asset.ticker.slice(0, 2)}
                  </span>
                  <div>
                    <h2 className="text-base font-bold t-text1 leading-tight">{asset.name}</h2>
                    <span className="text-xs font-semibold t-text2">{asset.ticker} · {asset.sector}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black font-mono-data t-text1">${fmt(asset.price)}</div>
                <div className={`text-xs font-bold font-mono-data flex items-center justify-end gap-0.5 ${
                  asset.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {asset.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {asset.change >= 0 ? '+' : ''}{fmt(asset.change)} ({asset.changePct >= 0 ? '+' : ''}{fmt(asset.changePct)}%)
                </div>
              </div>
            </div>

            {/* Rango 52 Semanas Barra de Progreso */}
            <div className="flex flex-col gap-1.5 pt-2 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text2">
                <span>52S Mín: ${fmt(asset.week52Low)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Rango 52 Semanas</span>
                <span>52S Máx: ${fmt(asset.week52High)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-[#C5961A] rounded-full transition-all"
                  style={{ width: `${rangePct}%` }}
                />
              </div>
            </div>

            {/* Métricas clave */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                <span className="text-[10px] t-text3 uppercase font-semibold">Volumen del Día</span>
                <span className="font-bold font-mono-data t-text1">{fmtVol(asset.volume)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                <span className="text-[10px] t-text3 uppercase font-semibold">Capitalización</span>
                <span className="font-bold font-mono-data t-text1">{fmtCap(asset.marketCap)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                <span className="text-[10px] t-text3 uppercase font-semibold">Apertura</span>
                <span className="font-bold font-mono-data t-text1">${fmt(asset.open)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 flex flex-col">
                <span className="text-[10px] t-text3 uppercase font-semibold">Máx / Mín Día</span>
                <span className="font-bold font-mono-data t-text1">${fmt(asset.high)} / ${fmt(asset.low)}</span>
              </div>
            </div>
          </div>

          {/* 2. Libro de órdenes simplificado (5 Bid verde / 5 Ask rojo con barras proporcionales) */}
          <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b t-border">
              <h3 className="text-xs font-bold uppercase tracking-wider t-text1">Libro de Órdenes (Depth)</h3>
              <span className="text-[10px] font-semibold text-gray-400">Spread: $0.12</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>Oferta / Compra (Bid)</span>
              <span className="text-right">Demanda / Venta (Ask)</span>
            </div>

            {/* Asks (Venta) en Rojo */}
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-0.5">
                5 Niveles de Venta (Ask)
              </div>
              {book.asks.map((a, i) => {
                const widthPct = Math.round((a.qty / maxAskQty) * 100)
                return (
                  <div key={i} className="relative flex items-center justify-between py-1 px-2 rounded overflow-hidden text-xs font-mono-data">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="relative z-10 font-bold text-rose-600 dark:text-rose-400">${fmt(a.price)}</span>
                    <span className="relative z-10 t-text2 text-[11px]">{a.qty}</span>
                  </div>
                )
              })}
            </div>

            {/* Mid Price Separator */}
            <div className="py-1.5 px-3 bg-black/5 dark:bg-white/5 rounded-md flex items-center justify-between text-xs font-mono-data font-bold border t-border">
              <span className="t-text3 text-[10px]">PRECIO ACTUAL</span>
              <span className="text-sm t-text1">${fmt(asset.price)}</span>
            </div>

            {/* Bids (Compra) en Verde */}
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">
                5 Niveles de Compra (Bid)
              </div>
              {book.bids.map((b, i) => {
                const widthPct = Math.round((b.qty / maxBidQty) * 100)
                return (
                  <div key={i} className="relative flex items-center justify-between py-1 px-2 rounded overflow-hidden text-xs font-mono-data">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 rounded transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="relative z-10 font-bold text-emerald-600 dark:text-emerald-400">${fmt(b.price)}</span>
                    <span className="relative z-10 t-text2 text-[11px]">{b.qty}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL (45% -> lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 3 & 4. Gráfico TradingView #131722 interactivo con velas, indicadores y selector de periodos */}
          <div className="h-[490px]">
            <TradingViewChart
              candles={candles}
              indicator={indicator}
              period={period}
              setPeriod={setPeriod}
              setIndicator={setIndicator}
            />
          </div>

          {/* 6. Historial de órdenes recientes del activo */}
          <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b t-border">
              <h3 className="text-xs font-bold uppercase tracking-wider t-text1">Órdenes Recientes del Activo</h3>
              <span className="text-[10px] t-text3">{orderHistory.length} transacciones</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" role="table">
                <thead>
                  <tr className="t-thead border-b t-border text-[10px] font-semibold t-text2 uppercase tracking-wide">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Tipo</th>
                    <th className="text-right py-2 px-2">Cantidad</th>
                    <th className="text-right py-2 px-2">Precio</th>
                    <th className="text-right py-2 px-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map(ord => (
                    <tr key={ord.id} className="border-b t-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono-data">
                      <td className="py-2 px-2 t-text2 text-[11px]">{ord.date}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          ord.side === 'compra' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}>
                          {ord.side.toUpperCase()} ({ord.type})
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold t-text1">{ord.qty}</td>
                      <td className="py-2 px-2 text-right t-text2">${fmt(ord.price)}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'Ejecutada'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-500/10 text-gray-500 border border-gray-500/30'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (25% -> lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* 5. Formulario de orden con validación en tiempo real */}
          <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider t-text1 pb-2 border-b t-border">
              Nueva Orden Bursátil
            </h3>

            {/* Tabs Compra / Venta con gradientes verde/rojo según guía */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => setSide('compra')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  side === 'compra'
                    ? 'text-white shadow-md'
                    : 't-text2 hover:t-text1'
                }`}
                style={{
                  background: side === 'compra' ? 'linear-gradient(135deg, #1B7E34 0%, #2E7D32 100%)' : 'transparent',
                }}
              >
                COMPRAR
              </button>
              <button
                type="button"
                onClick={() => setSide('venta')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  side === 'venta'
                    ? 'text-white shadow-md'
                    : 't-text2 hover:t-text1'
                }`}
                style={{
                  background: side === 'venta' ? 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)' : 'transparent',
                }}
              >
                VENDER
              </button>
            </div>

            <form onSubmit={handleExecuteOrder} className="flex flex-col gap-3.5">
              {/* Tipo de Orden */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold t-text2 uppercase tracking-wide">Tipo de Orden</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Mercado', 'Límite', 'Stop', 'Stop-Límite'] as OrderType[]).map(ot => (
                    <button
                      key={ot}
                      type="button"
                      onClick={() => setOrderType(ot)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-md border text-center transition-all ${
                        orderType === ot
                          ? 'border-[#1F3864] bg-[#1F3864] text-white dark:border-[#58A6FF] dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                          : 't-border t-text2 hover:t-text1 bg-transparent'
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Precio Límite */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px] font-semibold t-text2">
                  <span>Precio Límite ($)</span>
                  {orderType === 'Mercado' && (
                    <span className="text-[10px] text-gray-400 italic">Deshabilitado (Precio Mercado)</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  disabled={orderType === 'Mercado'}
                  value={orderType === 'Mercado' ? asset.price : limitPrice}
                  onChange={e => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className={`w-full py-2 px-3 text-xs font-mono-data rounded-lg border outline-none ${
                    orderType === 'Mercado'
                      ? 'bg-black/5 dark:bg-white/5 opacity-60 cursor-not-allowed border-dashed t-border'
                      : 'bg-transparent border-[#1F3864] dark:border-[#58A6FF]'
                  }`}
                />
              </div>

              {/* Campo Cantidad y botones rápidos 25%, 50%, 75%, 100% */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold t-text2">
                  <span>Cantidad de Acciones</span>
                  <span className="text-[10px] font-mono-data t-text3">Unidades</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2 px-3 text-xs font-mono-data font-bold rounded-lg border t-border bg-transparent outline-none focus:border-[#1F3864] dark:focus:border-[#58A6FF]"
                />
                
                {/* Botones de porcentaje del poder de compra ($68,420.00) */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[
                    { label: '25%', val: 0.25 },
                    { label: '50%', val: 0.50 },
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.00 },
                  ].map(b => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => handlePercentageClick(b.val)}
                      className="py-1 text-[10px] font-bold rounded bg-black/5 dark:bg-white/5 hover:bg-[#1F3864]/10 dark:hover:bg-[#58A6FF]/20 t-text1 transition-colors border t-border"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen de Costos y Poder de Compra */}
              <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border t-border flex flex-col gap-1.5 text-xs font-mono-data">
                <div className="flex justify-between t-text2 text-[11px]">
                  <span>Poder de Compra:</span>
                  <span className="font-bold t-text1">${fmt(BUYING_POWER)}</span>
                </div>
                <div className="flex justify-between t-text2 text-[11px]">
                  <span>Precio Estimado:</span>
                  <span>${fmt(effectivePrice)}</span>
                </div>
                <div className="h-[1px] bg-black/10 dark:bg-white/10 my-0.5" />
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="t-text1">Costo Estimado Total:</span>
                  <span className={exceedsPower ? 'text-rose-600 dark:text-rose-400 font-black' : 't-text1'}>
                    ${fmt(totalCost)}
                  </span>
                </div>
              </div>

              {/* Validación en tiempo real en ROJO si excede poder de compra ($68,420.00) */}
              {exceedsPower && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-start gap-2 text-xs animate-shake">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Fondos Insuficientes</span>
                    El costo total de <strong>${fmt(totalCost)}</strong> excede tu poder de compra disponible de <strong>${fmt(BUYING_POWER)}</strong>.
                  </div>
                </div>
              )}

              {/* Botón Grande "Ejecutar Orden" */}
              <button
                type="submit"
                disabled={exceedsPower}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  exceedsPower
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : side === 'compra'
                    ? 'hover:brightness-110 active:scale-[0.98]'
                    : 'hover:brightness-110 active:scale-[0.98]'
                }`}
                style={{
                  background: exceedsPower
                    ? '#6B7280'
                    : side === 'compra'
                    ? 'linear-gradient(135deg, #1B7E34 0%, #2E7D32 100%)'
                    : 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
                }}
              >
                <span>Ejecutar Orden de {side === 'compra' ? 'Compra' : 'Venta'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
