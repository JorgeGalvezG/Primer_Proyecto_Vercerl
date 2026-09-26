import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Sun, Moon, Bell, Search, ChevronDown, TrendingUp, TrendingDown,
  User, Settings, LogOut, BarChart2, LayoutDashboard, Globe, Star,
  ArrowLeftRight, Clock, Sliders, X, CheckCircle2, Trophy, Smartphone,
  ExternalLink, ArrowUpRight
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

import Watchlist from './Watchlist'
import Trade from './Trade'
import Leaderboard from './Leaderboard'
import MobileView from './MobileView'
import { MarketProvider, useMarket, Candle } from './context/MarketContext'
import LiveSimulationBar from './components/LiveSimulationBar'
import NotificationsDropdown from './components/NotificationsModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'watchlist' | 'trade' | 'leaderboard' | 'mobile'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtSign = (n: number) => (n >= 0 ? '+' : '') + fmt(n)

// ── Candlestick SVG Live Chart for Dashboard ──────────────────────────────────

function SvgCandlestickLive({
  dark,
  candles,
  livePrice
}: {
  dark: boolean
  candles: Candle[]
  livePrice: number
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const W = 620, H = 220
  const PAD = { top: 14, right: 65, bottom: 25, left: 15 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  const visibleCandles = candles.slice(-24)
  const lows = visibleCandles.map(d => d.low)
  const highs = visibleCandles.map(d => d.high)
  const yMin = Math.floor(Math.min(...lows, livePrice) - 0.5)
  const yMax = Math.ceil(Math.max(...highs, livePrice) + 0.5)
  const toY = (v: number) => PAD.top + ((yMax - v) / Math.max(0.1, yMax - yMin)) * iH
  const slotW = iW / Math.max(1, visibleCandles.length)
  const barW = Math.max(Math.floor(slotW * 0.65), 3)

  const ticks = [yMin, yMin + (yMax - yMin) * 0.5, yMax]
  const gain = dark ? '#238636' : '#1B7E34'
  const loss = dark ? '#DA3633' : '#C62828'
  const grid = dark ? '#21262D' : '#E2E6EF'
  const tick = dark ? '#8B949E' : '#6B7280'

  return (
    <div className="relative w-full h-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none">
        {ticks.map(t => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={toY(t)} y2={toY(t)} stroke={grid} strokeWidth={1} strokeDasharray="2 3" />
            <text x={W - PAD.right + 6} y={toY(t) + 4} fontSize={10} fill={tick} fontFamily="Consolas, monospace">
              ${fmt(t, 0)}
            </text>
          </g>
        ))}

        {/* Live Price Line */}
        <line x1={PAD.left} x2={W - PAD.right} y1={toY(livePrice)} y2={toY(livePrice)} stroke="#2962FF" strokeWidth={1.5} strokeDasharray="3 2" />
        <g transform={`translate(${W - PAD.right}, ${toY(livePrice) - 8})`}>
          <rect x={0} y={0} width={58} height={16} rx={3} fill="#2962FF" />
          <text x={29} y={11.5} fill="#FFFFFF" fontSize={9} fontWeight="bold" textAnchor="middle" fontFamily="Consolas, monospace">
            ${fmt(livePrice, 1)}
          </text>
        </g>

        {visibleCandles.map((d, i) => {
          const cx = PAD.left + slotW * i + slotW / 2
          const bull = d.close >= d.open
          const color = bull ? gain : loss
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
              <line x1={cx} x2={cx} y1={toY(d.high)} y2={toY(d.low)} stroke={color} strokeWidth={1.5} />
              <rect x={cx - barW / 2} y={bTop} width={barW} height={bH} fill={color} rx={1} />
              {i % 4 === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={9} fill={tick} fontFamily="Consolas, monospace">
                  {d.time}
                </text>
              )}

              {/* Trade badges if present */}
              {d.trades && d.trades.map((tr, trIdx) => {
                const isBuy = tr.side === 'compra'
                const yPos = isBuy ? toY(d.low) + 8 : toY(d.high) - 8
                const badgeY = isBuy ? toY(d.low) + 14 : toY(d.high) - 28
                const badgeColor = isBuy ? '#1B7E34' : '#C62828'
                return (
                  <g key={tr.id || trIdx} className="pointer-events-none">
                    <polygon
                      points={isBuy
                        ? `${cx},${yPos} ${cx - 4},${yPos + 6} ${cx + 4},${yPos + 6}`
                        : `${cx},${yPos} ${cx - 4},${yPos - 6} ${cx + 4},${yPos - 6}`
                      }
                      fill={badgeColor}
                    />
                    <rect x={cx - 30} y={badgeY} width={60} height={14} rx={3} fill={badgeColor} />
                    <text x={cx} y={badgeY + 10} fill="#FFF" fontSize={7.5} fontWeight="bold" textAnchor="middle" fontFamily="Consolas, monospace">
                      {isBuy ? '▲ BUY' : '▼ SELL'} {tr.qty}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>

      {hoveredIdx !== null && visibleCandles[hoveredIdx] && (
        <div className="absolute top-2 left-3 bg-[#161B22]/90 border border-gray-700 rounded px-2.5 py-1 text-[11px] text-gray-200 pointer-events-none font-mono flex items-center gap-2 backdrop-blur shadow">
          <span>{visibleCandles[hoveredIdx].time}</span>
          <span>O: <strong>${fmt(visibleCandles[hoveredIdx].open)}</strong></span>
          <span>C: <strong>${fmt(visibleCandles[hoveredIdx].close)}</strong></span>
        </div>
      )}
    </div>
  )
}

// ── Dashboard Live Chart with Mode Switcher (Portafolio Equity vs Velas Activo) ──

function DashboardLiveChart({
  dark,
  activeTicker = 'AAPL',
  onOperate
}: {
  dark: boolean
  activeTicker?: string
  onOperate?: (ticker: string) => void
}) {
  const { portfolioHistory, getCandlesForTicker, assets } = useMarket()
  const [chartMode, setChartMode] = useState<'equity' | 'velas'>('equity')
  const [period, setPeriod] = useState<'15m' | '1H' | '4H' | '1D' | '1W' | '1M'>('1D')

  const asset = assets[activeTicker] || assets['AAPL'] || Object.values(assets)[0]
  const candles = useMemo(() => getCandlesForTicker(asset.ticker, period), [getCandlesForTicker, asset.ticker, period, asset.price])

  // Reactive multi-timeframe equity curve that transforms visibly based on timeframe
  const displayPortfolioHistory = useMemo(() => {
    const currentVal = portfolioHistory[portfolioHistory.length - 1]?.value || 125430.5
    const currentBP = portfolioHistory[portfolioHistory.length - 1]?.buyingPower || 68420.0

    if (period === '15m') {
      return Array.from({ length: 15 }, (_, i) => {
        const minAgo = 14 - i
        const d = new Date(Date.now() - minAgo * 60000)
        const wave = Math.sin(i * 0.8) * 90 + Math.cos(i * 0.5) * 60
        return {
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Number((currentVal - (14 - i) * 12 + wave).toFixed(2)),
          buyingPower: currentBP
        }
      })
    }
    if (period === '1H') {
      return Array.from({ length: 12 }, (_, i) => {
        const minAgo = (11 - i) * 5
        const d = new Date(Date.now() - minAgo * 60000)
        const wave = Math.sin(i * 0.7) * 240 + Math.cos(i * 0.4) * 130
        return {
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Number((currentVal - (11 - i) * 50 + wave).toFixed(2)),
          buyingPower: currentBP
        }
      })
    }
    if (period === '4H') {
      return Array.from({ length: 16 }, (_, i) => {
        const minAgo = (15 - i) * 15
        const d = new Date(Date.now() - minAgo * 60000)
        const wave = Math.sin(i * 0.6) * 480 + Math.cos(i * 0.3) * 260
        return {
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Number((currentVal - (15 - i) * 140 + wave).toFixed(2)),
          buyingPower: currentBP
        }
      })
    }
    if (period === '1D') {
      return portfolioHistory
    }
    if (period === '1W') {
      const days = ['Jue', 'Vie', 'Sáb', 'Dom', 'Lun', 'Mar', 'Hoy']
      return days.map((day, idx) => ({
        time: day,
        value: Number((currentVal - (6 - idx) * 380 + Math.sin(idx * 1.5) * 420).toFixed(2)),
        buyingPower: currentBP
      }))
    }
    if (period === '1M') {
      const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
      return weeks.map((w, idx) => ({
        time: w,
        value: Number((currentVal - (3 - idx) * 1800 + Math.sin(idx * 2) * 650).toFixed(2)),
        buyingPower: currentBP
      }))
    }
    return portfolioHistory
  }, [portfolioHistory, period])

  const grid = dark ? '#21262D' : '#E2E6EF'
  const tick = dark ? '#8B949E' : '#6B7280'
  const strokeColor = dark ? '#58A6FF' : '#1F3864'

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b t-border gap-2">
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5 border t-border text-xs">
            <button
              onClick={() => setChartMode('equity')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                chartMode === 'equity'
                  ? 'bg-[#1F3864] text-white dark:bg-[#58A6FF] dark:text-black shadow'
                  : 't-text2 hover:t-text1'
              }`}
            >
              📈 Portafolio Dinámico (Equity)
            </button>
            <button
              onClick={() => setChartMode('velas')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                chartMode === 'velas'
                  ? 'bg-[#1F3864] text-white dark:bg-[#58A6FF] dark:text-black shadow'
                  : 't-text2 hover:t-text1'
              }`}
            >
              🕯️ Velas {asset.ticker}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data font-bold t-text1">
              {chartMode === 'equity'
                ? `$${fmt(displayPortfolioHistory[displayPortfolioHistory.length - 1]?.value || 125430.5)}`
                : `$${fmt(asset.price)} (${fmtSign(asset.changePct)}%)`}
            </span>
            {chartMode === 'velas' && onOperate && (
              <button
                onClick={() => onOperate(asset.ticker)}
                className="text-[10px] font-bold text-blue-500 hover:underline"
              >
                Operar {asset.ticker} →
              </button>
            )}
          </div>
        </div>

        {/* Timeframes with Spanish Tooltips */}
        <div className="flex items-center gap-1">
          {[
            { id: '15m', label: '15m', title: 'Hace 15 min' },
            { id: '1H', label: '1H', title: 'Hace 1 hora' },
            { id: '4H', label: '4H', title: 'Hace 4 horas' },
            { id: '1D', label: '1D', title: 'Hace 1 día' },
            { id: '1W', label: '1W', title: 'Hace 1 semana' },
            { id: '1M', label: '1M', title: 'Hace 1 mes' },
          ].map(p => (
            <button
              key={p.id}
              title={p.title}
              onClick={() => setPeriod(p.id as any)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                period === p.id
                  ? 'bg-[#1F3864] text-white dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                  : 't-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 my-2 min-h-[200px]">
        {chartMode === 'equity' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayPortfolioHistory} margin={{ top: 10, right: 15, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: tick }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={v => `$${fmt(v, 0)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="p-2.5 rounded-lg border t-border bg-white dark:bg-[#161B22] shadow-lg text-xs font-mono">
                        <div className="text-gray-400 text-[10px]">{data.time}</div>
                        <div className="font-bold text-sm t-text1">${fmt(data.value)}</div>
                        <div className="text-blue-500 text-[11px]">Poder de Compra: ${fmt(data.buyingPower)}</div>
                        {data.event && (
                          <div className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            data.side === 'compra' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            ⚡ {data.event}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2.5}
                fill="url(#equityGrad)"
                dot={(props: any) => {
                  if (props.payload.event) {
                    const isBuy = props.payload.side === 'compra'
                    return (
                      <circle
                        key={props.cx + '-' + props.cy}
                        cx={props.cx}
                        cy={props.cy}
                        r={5}
                        fill={isBuy ? '#1B7E34' : '#C62828'}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    )
                  }
                  return <React.Fragment key={props.cx + '-' + props.cy} />
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <SvgCandlestickLive
            dark={dark}
            candles={candles}
            livePrice={asset.price}
          />
        )}
      </div>

      {/* Chart Footer with Live Status */}
      <div className="flex justify-between items-center pt-2 border-t t-border text-[11px] t-text3 font-mono-data">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {chartMode === 'equity'
            ? 'Curva de Portafolio en vivo · Actualiza dinámicamente con compras, ventas y cotizaciones'
            : `Velas japonesas de ${asset.name} con órdenes marcadas`}
        </span>
        <span>
          {chartMode === 'equity'
            ? `${portfolioHistory.length} puntos registrados`
            : `Volumen: ${fmt(asset.volume || 58432100, 0)}`}
        </span>
      </div>
    </div>
  )
}

// ── App Content Component with Full Market Context Integration ────────────────

function AppContent() {
  const [dark, setDark] = useState<boolean>(false)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [tradingTicker, setTradingTicker] = useState<string>('BVN')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [showNotifs, setShowNotifs] = useState(false)

  const {
    assets,
    assetList,
    buyingPower,
    positions,
    portfolioValue,
    dayPnlUsd,
    dayPnlPct,
    totalReturnPct,
    unreadCount,
    markNotificationsAsRead
  } = useMarket()

  // Toggle Theme
  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [dark])

  const navigateToTrade = (ticker: string) => {
    setTradingTicker(ticker)
    setCurrentView('trade')
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'watchlist', label: 'Watchlist & Alertas', icon: Star },
    { id: 'trade', label: 'Operar / Trading', icon: ArrowLeftRight },
    { id: 'leaderboard', label: 'Liga / Leaderboard', icon: Trophy },
  ]

  // Top movers sorted by absolute change
  const topMovers = useMemo(() => {
    return [...assetList]
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, 6)
  }, [assetList])

  const aaplAsset = assets['AAPL'] || { price: 190.12, changePct: -0.70 }

  // Render Mobile View directly if active
  if (currentView === 'mobile') {
    return <MobileView onBack={() => setCurrentView('dashboard')} />
  }

  return (
    <div className="min-h-screen flex flex-col t-bg text-[var(--text1)] selection:bg-[#C5961A]/30">
      {/* ── TOP NAVBAR ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 w-full h-16 border-b t-border px-4 lg:px-6 flex items-center justify-between shadow-sm"
        style={{
          background: dark ? '#0D1117' : '#1F3864',
          color: '#FFFFFF'
        }}
      >
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C5961A] to-[#F59E0B] flex items-center justify-center shadow-md">
            <BarChart2 size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Emulador_Bolsa_IHC</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white font-mono uppercase">
                PRO v4.0
              </span>
            </div>
            <span className="text-[11px] text-blue-200/80 block -mt-0.5">Plataforma Bursátil IHC UNMSM</span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative hidden md:flex items-center w-72 lg:w-96">
          <Search size={15} className="absolute left-3.5 text-blue-200/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Buscar ticker (ej. BVN, FSM, AAPL, BTC)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white/10 text-white placeholder-blue-200/50 border border-white/20 outline-none focus:bg-white/20 focus:border-[#C5961A] transition-all"
          />

          {/* Quick search dropdown */}
          {searchFocused && searchQuery && (
            <div className="absolute top-12 left-0 right-0 rounded-xl bg-white dark:bg-[#161B22] border t-border text-gray-900 dark:text-gray-100 shadow-xl overflow-hidden z-50">
              {assetList.filter(p => p.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div
                  key={p.ticker}
                  onMouseDown={() => {
                    navigateToTrade(p.ticker)
                    setSearchQuery('')
                  }}
                  className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400">{p.ticker} — {p.name}</span>
                  <span className="font-mono font-bold">${fmt(p.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Notifications + Mobile View Toggle + Sun/Moon + User */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell with Unread Badge */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifs(v => !v)
                markNotificationsAsRead()
              }}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center"
              title="Notificaciones y Alertas en Vivo"
            >
              <Bell size={17} className={unreadCount > 0 ? 'text-amber-300 animate-bounce' : 'text-blue-200'} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && <NotificationsDropdown dark={dark} onClose={() => setShowNotifs(false)} />}
          </div>

          {/* Botón Destacado "Vista Mobile (390x844px)" */}
          <button
            onClick={() => setCurrentView('mobile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#C5961A] to-[#D97706] text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
            title="Ver las 3 pantallas móviles iPhone 14"
          >
            <Smartphone size={15} />
            <span className="hidden sm:inline">Vista Mobile (390x844px)</span>
            <span className="sm:hidden">Móvil</span>
          </button>

          {/* Toggle Sol / Luna Tema Claro y Modo Oscuro en tiempo real */}
          <button
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Cambiar a Tema Claro' : 'Cambiar a Modo Oscuro'}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center"
            title={dark ? 'Activar Tema Claro' : 'Activar Modo Oscuro'}
          >
            {dark ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} className="text-blue-200" />}
          </button>

          {/* User profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
              JG
            </div>
            <div className="hidden xl:block text-left text-xs">
              <span className="font-bold block text-white">Jorge Galvez</span>
              <span className="text-[10px] text-amber-300 font-mono">Trader Diamante</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── LIVE SIMULATION ENGINE TOOLBAR ─────────────────────────────────── */}
      <LiveSimulationBar dark={dark} />

      {/* ── MAIN LAYOUT: SIDEBAR + CONTENT ───────────────────────────────────── */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar Menu */}
        <aside
          className="w-56 lg:w-64 border-r t-border flex flex-col justify-between p-3 flex-shrink-0 transition-colors hidden md:flex"
          style={{
            background: dark ? '#0D1117' : '#FFFFFF',
          }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
              Menú Principal
            </span>
            {sidebarItems.map(item => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-[#1F3864] text-white shadow-sm dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                      : 't-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              )
            })}

            <div className="my-2 border-t t-border" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
              Herramientas IHC
            </span>
            <button
              onClick={() => setCurrentView('mobile')}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#C5961A] hover:bg-[#C5961A]/10 transition-colors"
            >
              <Smartphone size={16} />
              <span>3 Pantallas Mobile</span>
            </button>
          </div>

          {/* User Quick Card at sidebar bottom */}
          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border t-border flex flex-col gap-1 text-xs">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Poder Disponible</span>
            <span className="font-extrabold font-mono text-base t-text1">${fmt(buyingPower)}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Simulación en vivo
            </span>
          </div>
        </aside>

        {/* Center / Right Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
              <CheckCircle2 size={18} />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* VIEW ROUTING */}
          {currentView === 'watchlist' && (
            <Watchlist
              dark={dark}
              onTrade={ticker => navigateToTrade(ticker)}
            />
          )}

          {currentView === 'trade' && (
            <Trade
              initialTicker={tradingTicker}
              dark={dark}
              onBackToDashboard={() => setCurrentView('dashboard')}
              onOrderSuccess={msg => showToast(msg)}
            />
          )}

          {currentView === 'leaderboard' && (
            <Leaderboard
              dark={dark}
              onTrade={ticker => navigateToTrade(ticker)}
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'dashboard' && (
            <div className="flex flex-col gap-5 p-4 lg:p-6 w-full max-w-[1520px] mx-auto">
              
              {/* ── 4 KPI CARDS SEGÚN GUÍA EXACTA ──────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* KPI 1: $125,430.50 Valor Portafolio */}
                <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider t-text2">
                    <span>Valor del Portafolio</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      dayPnlPct >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {dayPnlPct >= 0 ? '▲ +' : '▼ '}{dayPnlPct.toFixed(2)}% hoy
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-black font-mono-data t-text1 tracking-tight">${fmt(portfolioValue)}</div>
                    <span className="text-[11px] t-text3">Capital inicial simulado: $100,000.00</span>
                  </div>
                  <div className="pt-2 border-t t-border flex justify-between text-xs font-semibold t-text2">
                    <span>Retorno Total:</span>
                    <span className={`font-mono-data font-bold ${
                      totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* KPI 2: +$2,450.00 Ganancia del Día */}
                <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider t-text2">
                    <span>Ganancia del Día</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                      dayPnlUsd >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {dayPnlUsd >= 0 ? '+$' : '-$'}{fmt(Math.abs(dayPnlUsd))}
                    </span>
                  </div>
                  <div className="my-2">
                    <div className={`text-3xl font-black font-mono-data tracking-tight ${
                      dayPnlUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {dayPnlUsd >= 0 ? '+$' : '-$'}{fmt(Math.abs(dayPnlUsd))}
                    </div>
                    <span className="text-[11px] t-text3">Posiciones activas calculadas en vivo</span>
                  </div>
                  <div className="pt-2 border-t t-border flex justify-between text-xs font-semibold t-text2">
                    <span>Efectividad (Win Rate):</span>
                    <span className="text-emerald-600 font-mono-data font-bold">67.3%</span>
                  </div>
                </div>

                {/* KPI 3: $68,420.00 Poder de Compra */}
                <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider t-text2">
                    <span>Poder de Compra</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                      Disponible
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-black font-mono-data t-text1 tracking-tight">${fmt(buyingPower)}</div>
                    <span className="text-[11px] t-text3">Margen disponible para nuevas órdenes</span>
                  </div>
                  <div className="pt-2 border-t t-border flex justify-between text-xs font-semibold t-text2">
                    <span>Fondo en Efectivo:</span>
                    <span className="font-mono-data font-bold t-text1">${fmt(buyingPower)}</span>
                  </div>
                </div>

                {/* KPI 4: Rango #128 */}
                <div
                  onClick={() => setCurrentView('leaderboard')}
                  className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between cursor-pointer hover:border-[#C5961A] transition-colors"
                >
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider t-text2">
                    <span>Posición en Liga</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5961A]/15 text-[#C5961A] font-bold">
                      💎 Diamante
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-black font-mono-data text-[#C5961A] tracking-tight">Rango #128</div>
                    <span className="text-[11px] t-text3">Entre 1,420 participantes activos</span>
                  </div>
                  <div className="pt-2 border-t t-border flex justify-between text-xs font-semibold text-[#C5961A]">
                    <span>Ver Leaderboard completo</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>

              {/* ── GRÁFICO CANDLESTICK + TOP MOVERS ───────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Gráfico central interactivo: Portafolio Equity vs Velas Japonesas (lg:col-span-8) */}
                <div className="lg:col-span-8 t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between min-h-[380px]">
                  <DashboardLiveChart
                    dark={dark}
                    activeTicker="AAPL"
                    onOperate={ticker => navigateToTrade(ticker)}
                  />
                </div>

                {/* Panel lateral Top Movers con Sparklines (lg:col-span-4) */}
                <div className="lg:col-span-4 t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b t-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider t-text1">Top Movers del Día</h3>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      En Vivo
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 my-1 overflow-y-auto max-h-[260px] pr-1">
                    {topMovers.map(m => (
                      <div
                        key={m.ticker}
                        onClick={() => navigateToTrade(m.ticker)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                            {m.ticker.slice(0, 2)}
                          </span>
                          <div>
                            <span className="font-bold text-xs t-text1 block">{m.ticker}</span>
                            <span className="text-[10px] t-text3 block truncate max-w-[100px]">{m.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-14 h-7">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={m.spark.map((v, i) => ({ i, v }))}>
                                <Line
                                  dataKey="v"
                                  dot={false}
                                  strokeWidth={1.5}
                                  stroke={m.change >= 0 ? '#1B7E34' : '#C62828'}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-right">
                            <span className="font-mono-data font-bold text-xs t-text1 block">${fmt(m.price)}</span>
                            <span className={`font-mono-data font-bold text-[10px] ${
                              m.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {fmtSign(m.changePct)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentView('watchlist')}
                    className="w-full py-2 mt-2 rounded-lg border t-border text-xs font-bold t-text2 hover:t-text1 hover:bg-black/5 transition-colors text-center"
                  >
                    Ver Watchlist Completa →
                  </button>
                </div>
              </div>

              {/* ── TABLA INFERIOR DE POSICIONES: BVN, FSM, ABX.TO, AAPL, TSLA ── */}
              <div className="t-card border t-border rounded-xl p-5 t-shadow">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b t-border gap-2">
                  <div>
                    <h3 className="text-sm font-bold t-text1">Mis Posiciones Activas</h3>
                    <p className="text-xs t-text3">Haz clic en cualquier activo o en 'Operar' para ejecutar órdenes en tiempo real</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {positions.length} Activos en Cartera
                  </span>
                </div>

                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs" role="table">
                    <thead>
                      <tr className="t-thead border-b t-border text-[10px] font-bold t-text2 uppercase tracking-wider">
                        <th className="text-left py-2.5 px-3">Ticker</th>
                        <th className="text-left py-2.5 px-3">Nombre</th>
                        <th className="text-right py-2.5 px-3">Cantidad</th>
                        <th className="text-right py-2.5 px-3">Precio Compra</th>
                        <th className="text-right py-2.5 px-3">Precio Actual</th>
                        <th className="text-right py-2.5 px-3">Valor Total</th>
                        <th className="text-right py-2.5 px-3">Retorno (%)</th>
                        <th className="text-center py-2.5 px-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(p => {
                        const isProfit = p.pnlPct >= 0
                        return (
                          <tr
                            key={p.ticker}
                            onClick={() => navigateToTrade(p.ticker)}
                            className="border-b t-border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors font-mono-data"
                          >
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                                {p.ticker}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-sans font-medium t-text1">{p.name}</td>
                            <td className="py-3 px-3 text-right font-bold t-text1">{p.qty}</td>
                            <td className="py-3 px-3 text-right t-text2">${fmt(p.avgPrice)}</td>
                            <td className="py-3 px-3 text-right font-bold t-text1">${fmt(p.curPrice)}</td>
                            <td className="py-3 px-3 text-right font-bold t-text1">${fmt(p.totalValue)}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isProfit ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'
                              }`}>
                                {isProfit ? '+' : ''}{fmt(p.pnlPct)}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  navigateToTrade(p.ticker)
                                }}
                                className="px-3 py-1 rounded-md text-[11px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                                style={{ background: 'var(--accent)' }}
                              >
                                Operar
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ── Root App Component wrapped in MarketProvider ──────────────────────────────

export default function App() {
  return (
    <MarketProvider>
      <AppContent />
    </MarketProvider>
  )
}
