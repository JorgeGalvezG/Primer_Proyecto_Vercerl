import React, { useState, useEffect, useRef } from 'react'
import {
  Sun, Moon, Bell, Search, ChevronDown, TrendingUp, TrendingDown,
  User, Settings, LogOut, BarChart2, LayoutDashboard, Globe, Star,
  ArrowLeftRight, Clock, Sliders, X, CheckCircle2, Trophy, Smartphone,
  ExternalLink, ArrowUpRight
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

import Watchlist from './Watchlist'
import Trade from './Trade'
import Leaderboard from './Leaderboard'
import MobileView from './MobileView'

// ── Types ─────────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'watchlist' | 'trade' | 'leaderboard' | 'mobile'

interface Position {
  ticker: string
  name: string
  qty: number
  avgPrice: number
  curPrice: number
  changePct: number
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CANDLE_DATA = (() => {
  const dates = [
    '02 Sep', '03 Sep', '04 Sep', '05 Sep', '08 Sep', '09 Sep', '10 Sep',
    '11 Sep', '12 Sep', '15 Sep', '16 Sep', '17 Sep', '18 Sep', '19 Sep'
  ]
  const seed = [
    175.2, 177.8, 174.1, 179.5, 182.3, 180.6, 183.1,
    181.4, 185.2, 187.9, 184.3, 188.7, 191.2, 190.12
  ]
  return dates.map((date, i) => {
    const close = seed[i]
    const open  = i === 0 ? 173.5 : seed[i - 1]
    const high  = Math.max(open, close) + (Math.sin(i) * 0.5 + 1) * 1.5
    const low   = Math.min(open, close) - (Math.cos(i) * 0.5 + 1) * 1.5
    return { date, open, close, high, low, volume: Math.floor(8e6 + (Math.sin(i * 1.3) + 1) * 6e6) }
  })
})()

const TOP_MOVERS = [
  { ticker: 'NVDA', name: 'NVIDIA Corp.',   price: 875.32, change: +4.87, spark: [820, 835, 848, 861, 850, 863, 875] },
  { ticker: 'TSLA', name: 'Tesla Inc.',     price: 243.18, change: +3.21, spark: [228, 232, 235, 238, 233, 240, 243] },
  { ticker: 'AMZN', name: 'Amazon.com',     price: 192.74, change: +2.56, spark: [182, 185, 188, 190, 186, 190, 193] },
  { ticker: 'BVN',  name: 'Buenaventura',   price: 16.85,  change: +4.01, spark: [15.8, 16.1, 16.3, 16.2, 16.5, 16.85] },
  { ticker: 'AAPL', name: 'Apple Inc.',     price: 190.12, change: -0.70, spark: [196, 194, 193, 191, 195, 192, 190] },
  { ticker: 'META', name: 'Meta Platforms', price: 512.45, change: -0.87, spark: [520, 518, 515, 514, 516, 513, 512] },
]

// Exact 5 positions required by prompt: BVN, FSM, ABX.TO, AAPL, TSLA
const POSITIONS: Position[] = [
  { ticker: 'BVN',    name: 'Cía. de Minas Buenaventura', qty: 300, avgPrice: 14.20, curPrice: 16.85, changePct: 18.66 },
  { ticker: 'FSM',    name: 'Fortuna Mining Corp.',       qty: 450, avgPrice: 4.10,  curPrice: 4.92,  changePct: 20.00 },
  { ticker: 'ABX.TO', name: 'Barrick Gold Corporation',   qty: 200, avgPrice: 22.50, curPrice: 24.80, changePct: 10.22 },
  { ticker: 'AAPL',   name: 'Apple Inc.',                 qty: 150, avgPrice: 167.45,curPrice: 190.12,changePct: 13.54 },
  { ticker: 'TSLA',   name: 'Tesla Inc.',                 qty: 60,  avgPrice: 215.80,curPrice: 243.18,changePct: 12.69 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtSign = (n: number) => (n >= 0 ? '+' : '') + fmt(n)

// ── Candlestick SVG Chart for Dashboard ───────────────────────────────────────

function SvgCandlestick({ dark, chartType }: { dark: boolean; chartType: 'velas' | 'líneas' }) {
  const data = CANDLE_DATA
  const W = 620, H = 220
  const PAD = { top: 12, right: 10, bottom: 26, left: 54 }
  const lows = data.map(d => d.low)
  const highs = data.map(d => d.high)
  const yMin = Math.floor(Math.min(...lows) - 1)
  const yMax = Math.ceil(Math.max(...highs) + 1)
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom
  const toY = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * iH
  const slotW = iW / data.length
  const barW = Math.max(Math.floor(slotW * 0.65), 3)
  const ticks = [yMin, yMin + Math.round((yMax - yMin) / 2), yMax]
  const gain = dark ? '#238636' : '#1B7E34'
  const loss = dark ? '#DA3633' : '#C62828'
  const grid = dark ? '#21262D' : '#E2E6EF'
  const tick = dark ? '#8B949E' : '#6B7280'

  if (chartType === 'líneas') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: tick }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${fmt(v, 0)}`} />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text1)'
            }}
            formatter={(v: any) => [`$${fmt(v)}`, 'Precio']}
          />
          <Line dataKey="close" dot={false} strokeWidth={2.5} stroke="var(--accent)" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none">
      {ticks.map(t => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={toY(t)} y2={toY(t)} stroke={grid} strokeWidth={1} strokeDasharray="2 3" />
          <text x={PAD.left - 6} y={toY(t) + 4} textAnchor="end" fontSize={10} fill={tick} fontFamily="Consolas, monospace">
            ${fmt(t, 0)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = PAD.left + slotW * i + slotW / 2
        const bull = d.close >= d.open
        const color = bull ? gain : loss
        const bTop = Math.min(toY(d.open), toY(d.close))
        const bBot = Math.max(toY(d.open), toY(d.close))
        const bH = Math.max(bBot - bTop, 2)
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={toY(d.high)} y2={toY(d.low)} stroke={color} strokeWidth={1.5} />
            <rect x={cx - barW / 2} y={bTop} width={barW} height={bH} fill={color} rx={1} />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize={9} fill={tick} fontFamily="Consolas, monospace">
              {d.date}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Main App Component ────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState<boolean>(false)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [tradingTicker, setTradingTicker] = useState<string>('BVN')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

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

  // Render Mobile View directly if active
  if (currentView === 'mobile') {
    return <MobileView onBack={() => setCurrentView('dashboard')} />
  }

  return (
    <div className="min-h-screen flex flex-col t-bg text-[var(--text1)] selection:bg-[#C5961A]/30">
      {/* ── TOP NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full h-16 border-b t-border px-4 lg:px-6 flex items-center justify-between shadow-sm"
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
              <span className="font-extrabold text-base tracking-tight text-white">Ernesto Investing AI</span>
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
            placeholder="Buscar ticker (ej. BVN, FSM, AAPL)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white/10 text-white placeholder-blue-200/50 border border-white/20 outline-none focus:bg-white/20 focus:border-[#C5961A] transition-all"
          />

          {/* Quick search dropdown */}
          {searchFocused && searchQuery && (
            <div className="absolute top-12 left-0 right-0 rounded-xl bg-white dark:bg-[#161B22] border t-border text-gray-900 dark:text-gray-100 shadow-xl overflow-hidden z-50">
              {POSITIONS.filter(p => p.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div
                  key={p.ticker}
                  onMouseDown={() => {
                    navigateToTrade(p.ticker)
                    setSearchQuery('')
                  }}
                  className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400">{p.ticker} — {p.name}</span>
                  <span className="font-mono font-bold">${fmt(p.curPrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Mobile View Toggle + Sun/Moon + User */}
        <div className="flex items-center gap-3">
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
              <span className="font-bold block text-white">Jorge Gálvez G.</span>
              <span className="text-[10px] text-amber-300 font-mono">Trader Diamante</span>
            </div>
          </div>
        </div>
      </header>

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
            <span className="font-extrabold font-mono text-base t-text1">$68,420.00</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">● Simulación en vivo</span>
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                      ▲ +1.99% hoy
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-black font-mono-data t-text1 tracking-tight">$125,430.50</div>
                    <span className="text-[11px] t-text3">Capital inicial simulado: $100,000.00</span>
                  </div>
                  <div className="pt-2 border-t t-border flex justify-between text-xs font-semibold t-text2">
                    <span>Retorno Total:</span>
                    <span className="text-emerald-600 font-mono-data font-bold">+25.43%</span>
                  </div>
                </div>

                {/* KPI 2: +$2,450.00 Ganancia del Día */}
                <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider t-text2">
                    <span>Ganancia del Día</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold font-mono">
                      +$2,450.00
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-black font-mono-data text-emerald-600 tracking-tight">+$2,450.00</div>
                    <span className="text-[11px] t-text3">5 posiciones cerradas con profit</span>
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
                    <div className="text-3xl font-black font-mono-data t-text1 tracking-tight">$68,420.00</div>
                    <span className="text-[11px] t-text3">Margen disponible para nuevas órdenes</span>
                  </div>
                  <div className="pt-2 border-t t-border flex justify-between text-xs font-semibold t-text2">
                    <span>Fondo en Efectivo:</span>
                    <span className="font-mono-data font-bold t-text1">$68,420.00</span>
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
                {/* Gráfico central de velas (lg:col-span-8) */}
                <div className="lg:col-span-8 t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between h-[360px]">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b t-border gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black t-text1">AAPL · S&P 500 Benchmark</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono-data flex items-center gap-1">
                        <TrendingUp size={14} /> $190.12 (+1.99%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {(['1D', '1W', '1M', '3M', '1Y'] as const).map(p => (
                        <button
                          key={p}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            p === '1M'
                              ? 'bg-[#1F3864] text-white dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                              : 't-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 my-2">
                    <SvgCandlestick dark={dark} chartType="velas" />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t t-border text-[11px] t-text3 font-mono-data">
                    <span>Fuente: NYSE / Market Data Live</span>
                    <span>Volumen promedio: 58.4M</span>
                  </div>
                </div>

                {/* Panel lateral Top Movers con Sparklines (lg:col-span-4) */}
                <div className="lg:col-span-4 t-card border t-border rounded-xl p-5 t-shadow flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b t-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider t-text1">Top Movers del Día</h3>
                    <span className="text-[10px] font-semibold text-emerald-600">En Vivo</span>
                  </div>

                  <div className="flex flex-col gap-2 my-1 overflow-y-auto max-h-[260px] pr-1">
                    {TOP_MOVERS.map(m => (
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
                            <span className="text-[10px] t-text3 block">{m.name}</span>
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
                              {fmtSign(m.change)}%
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
                    <p className="text-xs t-text3">Haz clic en cualquier activo o en 'Operar' para abrir la pantalla de Trading</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    5 Activos en Cartera
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
                      {POSITIONS.map(p => {
                        const totalVal = p.qty * p.curPrice
                        const pnl = (p.curPrice - p.avgPrice) * p.qty
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
                            <td className="py-3 px-3 text-right font-bold t-text1">${fmt(totalVal)}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                +{fmt(p.changePct)}%
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
