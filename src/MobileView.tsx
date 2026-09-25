import React, { useState } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import {
  ArrowLeft, TrendingUp, TrendingDown, ChevronRight,
  Sliders, Bell, CheckCircle2, Shield, Flame, Trophy,
  LayoutDashboard, Star, ArrowLeftRight, Search, Plus,
  Sun, Moon, AlertCircle, X, Maximize2, Minimize2, RotateCcw,
  BarChart2
} from 'lucide-react'
import { useMarket, Position as ContextPosition } from './context/MarketContext'

type MobileTab = 'dashboard' | 'watchlist' | 'trade' | 'leaderboard'
type Period = '1D' | '1W' | '1M' | '1A'
type Side = 'compra' | 'venta'
type OrderType = 'Mercado' | 'Límite' | 'Stop'

const fmt = (n: number, d = 2) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtSign = (n: number) => (n >= 0 ? '+' : '') + fmt(n)

export default function MobileView({ onBack }: { onBack?: () => void }) {
  const {
    assets,
    assetList,
    buyingPower,
    positions,
    portfolioValue,
    dayPnlUsd,
    dayPnlPct,
    totalReturnPct,
    executeOrder,
    orderHistory,
    alerts,
    addAlert,
    toggleAlert,
    deleteAlert,
    unreadCount,
    markNotificationsAsRead,
    resetToDefaults
  } = useMarket()

  const [activeTab, setActiveTab] = useState<MobileTab>('dashboard')
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL')
  const [isDark, setIsDark] = useState<boolean>(false)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
  const [showNewAlertModal, setShowNewAlertModal] = useState<boolean>(false)
  const [alertTicker, setAlertTicker] = useState<string>('AAPL')
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('195.00')
  const [alertCondition, setAlertCondition] = useState<'Mayor que' | 'Menor que'>('Mayor que')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Trade form state
  const [tradeSide, setTradeSide] = useState<Side>('compra')
  const [tradeOrderType, setTradeOrderType] = useState<OrderType>('Mercado')
  const [tradeQty, setTradeQty] = useState<number>(10)
  const [tradeLimitPrice, setTradeLimitPrice] = useState<number>(190.12)

  // Watchlist state
  const [watchlistFilter, setWatchlistFilter] = useState<'Todos' | 'Acciones' | 'Cripto' | 'ETFs'>('Todos')
  const [watchlistSearch, setWatchlistSearch] = useState<string>('')

  const activeAsset = assets[selectedTicker] || assets['AAPL'] || Object.values(assets)[0]
  const tradePrice = tradeOrderType === 'Mercado' ? activeAsset.price : (tradeLimitPrice || activeAsset.price)
  const tradeTotalCost = tradeQty * tradePrice
  const exceedsBuyingPower = tradeSide === 'compra' && tradeTotalCost > buyingPower

  const showNotification = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault()
    if (exceedsBuyingPower) return

    const res = executeOrder({
      ticker: activeAsset.ticker,
      side: tradeSide,
      type: tradeOrderType,
      qty: tradeQty,
      price: tradePrice
    })

    if (res.success) {
      showNotification(res.message)
    } else {
      showNotification(`✕ ${res.message}`)
    }
  }

  const handlePercentageClick = (pct: number) => {
    if (tradeSide === 'compra') {
      const budget = buyingPower * pct
      const calc = Math.floor(budget / tradePrice)
      setTradeQty(Math.max(1, calc))
    } else {
      const holding = positions.find(p => p.ticker === activeAsset.ticker)
      const owned = holding?.qty || 0
      const calc = Math.floor(owned * pct)
      setTradeQty(Math.max(1, calc || 1))
    }
  }

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault()
    addAlert({
      ticker: alertTicker,
      condition: alertCondition,
      value: parseFloat(alertTargetPrice) || 0,
      notif: 'Push',
      enabled: true
    })
    setShowNewAlertModal(false)
    showNotification(`Alerta activada para ${alertTicker} (${alertCondition} $${alertTargetPrice})`)
  }

  // Filtered assets for mobile watchlist
  const filteredAssets = assetList.filter(a => {
    const matchFilter = watchlistFilter === 'Todos' || a.type === watchlistFilter
    const matchSearch = a.ticker.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
                        a.name.toLowerCase().includes(watchlistSearch.toLowerCase())
    return matchFilter && matchSearch
  })

  // Chart data for mobile
  const chartData = [
    { t: '9:30', p: activeAsset.open * 0.99 },
    { t: '11:00', p: activeAsset.open * 1.005 },
    { t: '12:30', p: (activeAsset.open + activeAsset.price) / 2 },
    { t: '14:00', p: activeAsset.price * 0.995 },
    { t: '16:00', p: activeAsset.price },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0D1B2A] text-white p-4 sm:p-6 flex flex-col items-center select-none">
      {/* ── TOP CONTROLS OUTSIDE THE PHONE ───────────────────────────────────── */}
      <div className="w-full max-w-[900px] flex items-center justify-between mb-4 pb-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
            >
              <ArrowLeft size={14} /> Volver a Desktop
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-black text-white leading-tight">
              Ernesto Investing AI · Versión Móvil
            </h1>
            <p className="text-[11px] text-blue-200/80">Pantalla única 100% interactiva con todas las funciones</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
            title={isFullScreen ? 'Ver en Marco iPhone 14' : 'Ver a Pantalla Completa'}
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline">{isFullScreen ? 'Marco iPhone' : 'Pantalla Completa'}</span>
          </button>
          <button
            onClick={resetToDefaults}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            title="Restablecer Valores Guía IHC"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── PHONE CONTAINER ─────────────────────────────────────────────────── */}
      <div
        className={`relative transition-all duration-300 ${
          isFullScreen
            ? 'w-full max-w-[430px] h-[900px] rounded-[36px] border-4 border-gray-700 shadow-2xl p-2'
            : 'w-[390px] h-[844px] rounded-[52px] border-[5px] border-[#2B2B2E] shadow-2xl p-[10px]'
        } bg-[#121214]`}
        style={{
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.15)',
        }}
      >
        {/* Dynamic Island (iPhone Notch) */}
        {!isFullScreen && (
          <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[122px] h-[32px] bg-black rounded-full z-50 flex items-center justify-between px-3 shadow-md pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#181818]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#0a0a0a] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />
            </div>
          </div>
        )}

        {/* ── PHONE SCREEN CONTENT ────────────────────────────────────────────── */}
        <div
          className={`w-full h-full rounded-[42px] overflow-hidden flex flex-col relative font-sans text-xs ${
            isDark ? 'bg-[#0D1117] text-[#E6EDF3]' : 'bg-[#F0F2F6] text-[#1F2937]'
          }`}
        >
          {/* Toast Notification inside phone */}
          {toastMsg && (
            <div className="absolute top-14 left-4 right-4 z-50 p-3 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-2 text-[11px] font-bold animate-fadeIn">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span className="truncate">{toastMsg}</span>
            </div>
          )}

          {/* 1. Mobile Status Bar & Brand Header */}
          <div
            className="pt-10 px-4 pb-2.5 border-b flex items-center justify-between flex-shrink-0"
            style={{
              background: isDark ? '#161B22' : '#1F3864',
              borderColor: isDark ? '#30363D' : '#2A4A80',
              color: '#FFFFFF'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#C5961A] to-[#F59E0B] flex items-center justify-center shadow">
                <BarChart2 size={16} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xs tracking-tight text-white block leading-tight">
                  Ernesto Investing AI
                </span>
                <span className="text-[9px] text-blue-200/80 font-mono">IHC UNMSM · Mobile</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Alternar Modo Oscuro"
              >
                {isDark ? <Sun size={13} className="text-amber-300" /> : <Moon size={13} className="text-blue-200" />}
              </button>

              {/* Bell notifications */}
              <button
                onClick={() => {
                  markNotificationsAsRead()
                  showNotification('Notificaciones revisadas')
                }}
                className="relative p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Bell size={13} className={unreadCount > 0 ? 'text-amber-300' : 'text-white'} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User avatar */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow">
                JG
              </div>
            </div>
          </div>

          {/* 2. Real-Time Mini Ticker Tape */}
          <div
            className="w-full overflow-x-auto no-scrollbar py-1 px-3 border-b flex items-center gap-4 text-[10px] font-mono flex-shrink-0"
            style={{
              background: isDark ? '#0B0E14' : '#E5E9F0',
              borderColor: isDark ? '#21262D' : '#D1D5DB'
            }}
          >
            {assetList.map(a => (
              <div
                key={a.ticker}
                onClick={() => {
                  setSelectedTicker(a.ticker)
                  setActiveTab('trade')
                }}
                className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:opacity-80"
              >
                <span className="font-extrabold">{a.ticker}</span>
                <span className="font-bold">${fmt(a.price)}</span>
                <span className={a.changePct >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                  {a.changePct >= 0 ? '+' : ''}{fmt(a.changePct)}%
                </span>
              </div>
            ))}
          </div>

          {/* 3. Screen Scrollable Body per Active Tab */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3.5 pb-20">
            {/* ── TAB 1: DASHBOARD MOBILE ──────────────────────────────────── */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                {/* Main Portfolio Card with Chart */}
                <div
                  className="rounded-2xl p-4 text-white shadow-lg flex flex-col gap-2"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, #161B22 0%, #1F2937 100%)'
                      : 'linear-gradient(135deg, #1F3864 0%, #172D53 70%, #112240 100%)'
                  }}
                >
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-blue-200/80">
                    <span>Valor del Portafolio</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      {dayPnlPct >= 0 ? '▲ +' : '▼ '}{dayPnlPct.toFixed(2)}% hoy
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono tracking-tight">${fmt(portfolioValue)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-blue-200/90 font-medium">
                    <span>Ganancia Día: <strong className="text-emerald-400 font-mono">{fmtSign(dayPnlUsd)}</strong></span>
                    <span>Poder: <strong className="text-amber-300 font-mono">${fmt(buyingPower)}</strong></span>
                  </div>

                  {/* Sparkline Area chart */}
                  <div className="h-[60px] my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="mobGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C5961A" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#C5961A" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="p" stroke="#C5961A" strokeWidth={2} fill="url(#mobGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                    <button
                      onClick={() => {
                        setTradeSide('compra')
                        setActiveTab('trade')
                      }}
                      className="py-2 rounded-xl font-bold bg-[#1B7E34] text-white shadow text-center active:scale-95 transition-transform"
                    >
                      + Comprar Acciones
                    </button>
                    <button
                      onClick={() => {
                        setTradeSide('venta')
                        setActiveTab('trade')
                      }}
                      className="py-2 rounded-xl font-bold bg-[#C62828] text-white shadow text-center active:scale-95 transition-transform"
                    >
                      - Vender Activos
                    </button>
                  </div>
                </div>

                {/* 4 Mini KPI Chips */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-3 rounded-xl border flex flex-col gap-0.5 ${isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Poder de Compra</span>
                    <span className="font-extrabold font-mono text-sm">${fmt(buyingPower)}</span>
                    <span className="text-[10px] text-blue-500 font-bold">Disponible</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('leaderboard')}
                    className={`p-3 rounded-xl border flex flex-col gap-0.5 cursor-pointer ${isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200 shadow-sm'}`}
                  >
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Posición en Liga</span>
                    <span className="font-extrabold font-mono text-sm text-[#C5961A]">Rango #128</span>
                    <span className="text-[10px] text-[#C5961A] font-bold">💎 Diamante</span>
                  </div>
                </div>

                {/* Top Movers Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-xs">Top Movers del Día</span>
                    <span className="text-[10px] text-emerald-500 font-bold">● En Vivo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {assetList.slice(0, 3).map(m => (
                      <div
                        key={m.ticker}
                        onClick={() => {
                          setSelectedTicker(m.ticker)
                          setActiveTab('trade')
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-transform active:scale-95 ${
                          isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200 shadow-sm'
                        }`}
                      >
                        <span className="font-extrabold text-xs">{m.ticker}</span>
                        <span className="font-mono font-bold text-xs">${fmt(m.price)}</span>
                        <span className={`text-[10px] font-mono font-bold ${m.changePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {m.changePct >= 0 ? '+' : ''}{fmt(m.changePct)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mis Posiciones Activas */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-xs">Mis Posiciones ({positions.length})</span>
                    <span className="text-[10px] text-gray-400">Toca para operar</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {positions.map(p => (
                      <div
                        key={p.ticker}
                        onClick={() => {
                          setSelectedTicker(p.ticker)
                          setActiveTab('trade')
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99] ${
                          isDark ? 'bg-[#161B22] border-[#30363D] hover:bg-white/5' : 'bg-white border-gray-200 shadow-sm hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-xs">
                            {p.ticker.slice(0, 2)}
                          </span>
                          <div>
                            <span className="font-extrabold text-xs block">{p.ticker}</span>
                            <span className="text-[10px] text-gray-400 block">{p.qty} acciones</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-xs block">${fmt(p.totalValue)}</span>
                          <span className={`text-[10px] font-mono font-bold ${p.pnlPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {p.pnlPct >= 0 ? '+' : ''}{fmt(p.pnlPct)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: WATCHLIST MOBILE ──────────────────────────────────── */}
            {activeTab === 'watchlist' && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                {/* Search & Add Alert Header */}
                <div className="flex items-center gap-2">
                  <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'
                  }`}>
                    <Search size={14} className="text-gray-400" />
                    <input
                      type="text"
                      value={watchlistSearch}
                      onChange={e => setWatchlistSearch(e.target.value)}
                      placeholder="Buscar ticker (ej. BVN, BTC)..."
                      className="w-full bg-transparent outline-none text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setShowNewAlertModal(true)}
                    className="p-2 rounded-xl bg-[#C5961A] text-white shadow active:scale-95"
                    title="Nueva Alerta"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {(['Todos', 'Acciones', 'Cripto', 'ETFs'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setWatchlistFilter(f)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        watchlistFilter === f
                          ? 'bg-[#1F3864] text-white'
                          : isDark ? 'bg-[#161B22] text-gray-400 border border-[#30363D]' : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Watchlist Asset Cards */}
                <div className="flex flex-col gap-2">
                  {filteredAssets.map(a => (
                    <div
                      key={a.ticker}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200 shadow-sm'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedTicker(a.ticker)
                          setActiveTab('trade')
                        }}
                        className="flex items-center gap-2.5 flex-1 cursor-pointer"
                      >
                        <span className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-xs">
                          {a.ticker.slice(0, 2)}
                        </span>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-xs">{a.ticker}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-gray-400">{a.type}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 truncate max-w-[130px] block">{a.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs block">${fmt(a.price)}</span>
                          <span className={`text-[10px] font-mono font-bold ${a.changePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {a.changePct >= 0 ? '+' : ''}{fmt(a.changePct)}%
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicker(a.ticker)
                            setActiveTab('trade')
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1F3864] text-white text-[11px] font-bold shadow active:scale-95"
                        >
                          Operar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Alerts Panel */}
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-xs">Alertas de Precio Activas ({alerts.length})</span>
                    <button
                      onClick={() => setShowNewAlertModal(true)}
                      className="text-[10px] text-[#C5961A] font-bold"
                    >
                      + Añadir Alerta
                    </button>
                  </div>

                  {alerts.map(al => (
                    <div
                      key={al.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bell size={13} className={al.enabled ? 'text-[#C5961A]' : 'text-gray-400'} />
                        <div>
                          <span className="font-bold">{al.ticker} {al.condition} ${fmt(al.value)}</span>
                          <span className="text-[9px] text-gray-400 block">{al.status}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAlert(al.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          al.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {al.enabled ? 'Activa' : 'Pausada'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 3: OPERAR / TRADING MOBILE ───────────────────────────── */}
            {activeTab === 'trade' && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                {/* Ticker Switcher Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {Object.keys(assets).map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTicker(t)
                        setTradeLimitPrice(assets[t].price)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                        selectedTicker === t
                          ? 'bg-[#1F3864] text-white shadow'
                          : isDark ? 'bg-[#161B22] text-gray-400 border border-[#30363D]' : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Asset Header Info */}
                <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                  isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-base font-extrabold">{activeAsset.name}</h2>
                      <span className="text-[10px] text-gray-400 font-semibold">{activeAsset.ticker} · {activeAsset.sector}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black font-mono block">${fmt(activeAsset.price)}</span>
                      <span className={`text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                        activeAsset.changePct >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {activeAsset.changePct >= 0 ? '▲ +' : '▼ '}{fmt(activeAsset.changePct)}%
                      </span>
                    </div>
                  </div>

                  {/* Range & Volume stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase">Rango Diario</span>
                      <span className="font-mono font-bold">${fmt(activeAsset.low)} - ${fmt(activeAsset.high)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase">Poder Disponible</span>
                      <span className="font-mono font-bold text-blue-500">${fmt(buyingPower)}</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Order Form */}
                <form
                  onSubmit={handleExecuteTrade}
                  className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                    isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <span className="font-extrabold text-xs uppercase tracking-wide">Nueva Orden Bursátil</span>

                  {/* Compra / Venta Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTradeSide('compra')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        tradeSide === 'compra'
                          ? 'bg-[#1B7E34] text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      COMPRAR
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeSide('venta')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        tradeSide === 'venta'
                          ? 'bg-[#C62828] text-white shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      VENDER
                    </button>
                  </div>

                  {/* Tipo de orden chips */}
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(['Mercado', 'Límite', 'Stop'] as OrderType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTradeOrderType(t)}
                        className={`py-1.5 rounded-lg font-bold border transition-colors ${
                          tradeOrderType === t
                            ? 'border-[#1F3864] bg-[#1F3864] text-white dark:border-[#58A6FF] dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Cantidad Input + Slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-400">Cantidad</span>
                      <span className="font-mono font-bold text-sm">{tradeQty} acc.</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={tradeQty}
                      onChange={e => setTradeQty(parseInt(e.target.value) || 1)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#1B7E34]"
                    />
                    {/* Quick percentage buttons */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[0.25, 0.50, 0.75, 1.00].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handlePercentageClick(pct)}
                          className="py-1 text-[10px] font-bold rounded bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-700 hover:bg-blue-600/10"
                        >
                          {pct * 100}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost Summary Box */}
                  <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>Precio unitario:</span>
                      <span className="font-mono">${fmt(tradePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-sm">
                      <span>Costo Total:</span>
                      <span className={`font-mono ${exceedsBuyingPower ? 'text-rose-500 font-black' : 'text-emerald-500'}`}>
                        ${fmt(tradeTotalCost)}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Validation Error */}
                  {exceedsBuyingPower && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[11px] font-bold flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>Excede tu poder de compra (${fmt(buyingPower)})</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={exceedsBuyingPower}
                    className={`w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-lg transition-transform active:scale-95 ${
                      exceedsBuyingPower
                        ? 'opacity-40 cursor-not-allowed bg-gray-500'
                        : tradeSide === 'compra'
                        ? 'bg-gradient-to-r from-[#1B7E34] to-[#2E7D32]'
                        : 'bg-gradient-to-r from-[#C62828] to-[#B71C1C]'
                    }`}
                  >
                    Confirmar {tradeSide === 'compra' ? 'Compra' : 'Venta'} — ${fmt(tradeTotalCost)}
                  </button>
                </form>

                {/* Recent Orders in Mobile */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="font-bold text-xs px-1">Historial Reciente</span>
                  <div className="flex flex-col gap-1.5">
                    {orderHistory.slice(0, 4).map(o => (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                          isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                            o.side === 'compra' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                          }`}>
                            {o.side.toUpperCase()}
                          </span>
                          <span className="font-bold">{o.qty} {o.ticker}</span>
                        </div>
                        <span className="font-mono font-bold">${fmt(o.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: LIGA / LEADERBOARD MOBILE ─────────────────────────── */}
            {activeTab === 'leaderboard' && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                {/* Tournament Header */}
                <div
                  className="rounded-2xl p-4 text-white shadow-lg flex items-center justify-between"
                  style={{
                    background: 'linear-gradient(135deg, #C5961A 0%, #D97706 100%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Trophy size={32} className="text-white drop-shadow" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">Temporada 2026-II</span>
                      <h2 className="text-base font-black leading-tight">Liga Diamante IHC</h2>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-black/25 font-bold">1,420 Traders</span>
                </div>

                {/* Current User Jorge Gálvez Garro Card */}
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md ${
                  isDark ? 'bg-[#1F2937] border-amber-500/40' : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1F3864] to-[#C5961A] flex items-center justify-center text-white font-bold text-sm shadow">
                      🎓
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs">Jorge Gálvez (Tú)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black">#128</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block">Diamante · 4,850 XP</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-xs block">${fmt(portfolioValue)}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-500">+{dayPnlPct.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Top 3 Podium Mini */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  {[
                    { rank: '🥈 2', name: 'Bullish Titans', val: '$167.8k', change: '+12.4%' },
                    { rank: '🥇 1', name: 'Market Wizards', val: '$186.5k', change: '+15.6%' },
                    { rank: '🥉 3', name: 'Alpha Traders', val: '$155.3k', change: '+10.2%' },
                  ].map(c => (
                    <div
                      key={c.name}
                      className={`p-2.5 rounded-xl border flex flex-col gap-0.5 ${
                        c.rank.includes('1')
                          ? 'border-amber-400 bg-amber-400/10'
                          : isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'
                      }`}
                    >
                      <span className="text-xs font-black">{c.rank}</span>
                      <span className="text-[10px] font-bold truncate">{c.name}</span>
                      <span className="text-[10px] font-mono font-bold">{c.val}</span>
                      <span className="text-[9px] text-emerald-500 font-bold">{c.change}</span>
                    </div>
                  ))}
                </div>

                {/* Badges showcase */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="font-bold text-xs px-1">Logros & Medallas IHC</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { icon: '🦈', title: 'Tiburón Wall St.', desc: '+15% en 24h' },
                      { icon: '🎯', title: 'Francotirador', desc: '5 órdenes win' },
                      { icon: '🛡️', title: 'Gestor Prudente', desc: 'Drawdown < 3%' },
                      { icon: '⚡', title: 'Leyenda Cripto', desc: 'Top Volatilidad' }
                    ].map(b => (
                      <div
                        key={b.title}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{b.icon}</span>
                        <div>
                          <span className="font-bold block text-[11px] leading-tight">{b.title}</span>
                          <span className="text-[9px] text-gray-400 block">{b.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 4. FIXED BOTTOM NAVIGATION BAR ───────────────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[64px] border-t flex items-center justify-around px-2 z-40 flex-shrink-0"
            style={{
              background: isDark ? '#161B22' : '#FFFFFF',
              borderColor: isDark ? '#30363D' : '#E5E7EB'
            }}
          >
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'watchlist', label: 'Watchlist', icon: Star },
              { id: 'trade', label: 'Operar', icon: ArrowLeftRight },
              { id: 'leaderboard', label: 'Liga', icon: Trophy },
            ].map(item => {
              const Icon = item.icon
              const isSelected = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as MobileTab)}
                  className={`flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-xl transition-all ${
                    isSelected
                      ? 'text-[#1F3864] dark:text-[#58A6FF] font-black'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={18} strokeWidth={isSelected ? 2.5 : 1.8} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── 5. MODAL NUEVA ALERTA BOTTOM SHEET ──────────────────────────── */}
          {showNewAlertModal && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fadeIn">
              <div
                className={`p-4 rounded-t-[28px] border-t flex flex-col gap-3 animate-slideUp ${
                  isDark ? 'bg-[#161B22] border-[#30363D]' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm">Nueva Alerta de Precio</span>
                  <button onClick={() => setShowNewAlertModal(false)} className="p-1 text-gray-400">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveAlert} className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Activo</label>
                    <select
                      value={alertTicker}
                      onChange={e => setAlertTicker(e.target.value)}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-bold ${
                        isDark ? 'bg-[#0D1117] border-[#30363D]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {assetList.map(a => (
                        <option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Condición</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Mayor que', 'Menor que'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAlertCondition(c)}
                          className={`py-1.5 rounded-lg font-bold text-xs border ${
                            alertCondition === c
                              ? 'bg-[#1F3864] text-white border-[#1F3864]'
                              : 'border-gray-200 text-gray-400'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Precio Umbral ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={alertTargetPrice}
                      onChange={e => setAlertTargetPrice(e.target.value)}
                      className={`w-full py-2 px-3 rounded-lg border font-mono font-bold text-xs ${
                        isDark ? 'bg-[#0D1117] border-[#30363D]' : 'bg-gray-50 border-gray-200'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#C5961A] text-white font-extrabold text-xs shadow mt-1"
                  >
                    Guardar y Activar Alerta
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
