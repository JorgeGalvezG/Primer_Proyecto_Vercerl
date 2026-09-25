import React, { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import {
  ArrowLeft, ArrowRight, TrendingUp, TrendingDown, ChevronRight,
  Sliders, Bell, CheckCircle2, Shield, Flame, Trophy
} from 'lucide-react'
import { useMarket } from './context/MarketContext'

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = '1D' | '1S' | '1M' | '3M' | '1A'
type DetailTab = 'Resumen' | 'Técnico' | 'Noticias' | 'Fundamentales'

interface Position {
  ticker: string
  name: string
  shares: number
  value: number
  change: number
  color: string
  emoji: string
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const portfolioHistory = [
  { d: '1', v: 118200 }, { d: '2', v: 118450 }, { d: '3', v: 118100 },
  { d: '4', v: 118900 }, { d: '5', v: 119200 }, { d: '6', v: 118700 },
  { d: '7', v: 119500 }, { d: '8', v: 120100 }, { d: '9', v: 119800 },
  { d: '10', v: 120400 }, { d: '11', v: 121200 }, { d: '12', v: 120900 },
  { d: '13', v: 121500 }, { d: '14', v: 122100 }, { d: '15', v: 121800 },
  { d: '16', v: 122600 }, { d: '17', v: 123100 }, { d: '18', v: 122800 },
  { d: '19', v: 123400 }, { d: '20', v: 124200 }, { d: '21', v: 123900 },
  { d: '22', v: 124500 }, { d: '23', v: 125100 }, { d: '24', v: 124800 },
  { d: '25', v: 125200 }, { d: '26', v: 125300 }, { d: '27', v: 124900 },
  { d: '28', v: 125100 }, { d: '29', v: 125350 }, { d: '30', v: 125430 },
]

const positions: Position[] = [
  { ticker: 'BVN',   name: 'Cía. de Minas Buenaventura', shares: 300, value: 5055.00, change: 4.01,  color: '#1B7E34', emoji: '⛏️' },
  { ticker: 'AAPL',  name: 'Apple Inc.',                 shares: 150, value: 28518.00,change: -0.70, color: '#C62828', emoji: '🍎' },
  { ticker: 'TSLA',  name: 'Tesla Inc.',                 shares: 60,  value: 14590.80,change: 3.21,  color: '#1B7E34', emoji: '🚗' },
  { ticker: 'ABX.TO',name: 'Barrick Gold Corp.',         shares: 200, value: 4960.00, change: 1.85,  color: '#1B7E34', emoji: '🥇' },
  { ticker: 'FSM',   name: 'Fortuna Mining Corp.',       shares: 450, value: 2214.00, change: 6.03,  color: '#1B7E34', emoji: '🪙' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',               shares: 40,  value: 35012.80,change: 4.90,  color: '#1B7E34', emoji: '⚡' },
]

const candleData = [
  { t: '9:30', c: 181.2 }, { t: '10:00', c: 182.9 }, { t: '10:30', c: 184.8 },
  { t: '11:00', c: 183.9 }, { t: '11:30', c: 182.8 }, { t: '12:00', c: 183.0 },
  { t: '12:30', c: 185.4 }, { t: '13:00', c: 185.9 }, { t: '13:30', c: 186.7 },
  { t: '14:00', c: 185.5 }, { t: '14:30', c: 187.2 }, { t: '15:00', c: 190.12 },
]

// ── Phone Frame Component (390 x 844px) ───────────────────────────────────────

function PhoneFrame({
  label,
  stepNumber,
  arrow = false,
  children
}: {
  label: string
  stepNumber: string
  arrow?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex flex-col items-center">
        {/* Step Badge */}
        <div className="mb-3 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow">
          <span className="w-5 h-5 rounded-full bg-[#C5961A] text-black font-black flex items-center justify-center text-[10px]">
            {stepNumber}
          </span>
          <span>{label}</span>
        </div>

        {/* iPhone 14 Frame (390 x 844px exact) */}
        <div
          className="relative bg-[#1A1A1A] rounded-[52px] p-[12px] shadow-2xl border-[4px] border-[#333333]"
          style={{
            width: 390,
            height: 844,
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-50 flex items-center justify-between px-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]" />
            <div className="w-3 h-3 rounded-full bg-[#0a0a0a] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#05051a]" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="w-full h-full rounded-[42px] overflow-hidden bg-[#F8F9FB] relative select-none">
            {children}
          </div>
        </div>
      </div>

      {/* Flow Arrow to Next Screen */}
      {arrow && (
        <div className="hidden xl:flex flex-col items-center justify-center gap-1 px-2 text-[#C5961A]">
          <div className="w-8 h-8 rounded-full bg-[#C5961A]/20 border border-[#C5961A]/40 flex items-center justify-center">
            <ArrowRight size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Flujo</span>
        </div>
      )}
    </div>
  )
}

// ── Screen 1: Mi Portafolio ───────────────────────────────────────────────────

function MobilePortfolioScreen({ onSelect }: { onSelect?: (p: any) => void }) {
  const { portfolioValue, dayPnlUsd, dayPnlPct, positions } = useMarket()
  const intVal = Math.floor(portfolioValue).toLocaleString('es-PE')
  const decVal = (portfolioValue % 1).toFixed(2).substring(1)

  return (
    <div className="h-full overflow-y-auto bg-[#F8F9FB] pb-20 font-sans">
      {/* Status Bar spacing & greeting */}
      <div className="pt-12 px-5 pb-3 flex justify-between items-center">
        <div>
          <span className="text-xs text-gray-500 font-medium">Buenos días,</span>
          <h2 className="text-xl font-extrabold text-[#0D1B2E]">Hola, Trader 👋</h2>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1F3864] to-[#C5961A] flex items-center justify-center text-white font-bold text-sm shadow">
          JG
        </div>
      </div>

      {/* Main Portfolio Card with Area Chart */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#1F3864] via-[#172D53] to-[#112240] p-5 text-white shadow-xl">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/70">
          Valor Total del Portafolio
        </span>
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-black font-mono tracking-tight">${intVal}</span>
          <span className="text-base text-blue-200 font-mono">{decVal}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="bg-emerald-500/25 text-emerald-400 font-bold text-xs px-2 py-0.5 rounded-full font-mono">
            {dayPnlUsd >= 0 ? '▲ +' : '▼ -'}${Math.abs(dayPnlUsd).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-blue-200/80 font-medium">{dayPnlPct >= 0 ? '+' : ''}{dayPnlPct.toFixed(2)}% hoy</span>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-[75px] my-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioHistory} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mPortGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C5961A" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#C5961A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#C5961A" strokeWidth={2.5} fill="url(#mPortGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Timeframe Selectors */}
        <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/10">
          {(['1D', '1S', '1M', '3M', '1A'] as Period[]).map(p => (
            <div
              key={p}
              className={`py-1 text-center text-[10px] font-bold rounded ${
                p === '1M' ? 'bg-[#C5961A] text-white' : 'text-blue-200/60 hover:text-white'
              }`}
            >
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Positions list header */}
      <div className="px-5 py-2 flex justify-between items-center">
        <span className="text-sm font-bold text-[#0D1B2E]">Mis Posiciones Activas</span>
        <span className="text-xs font-bold text-[#C5961A]">{positions.length} activos</span>
      </div>

      {/* Positions list items */}
      <div className="px-4 flex flex-col gap-2">
        {positions.map(p => {
          const isUp = p.pnlPct >= 0
          return (
            <div
              key={p.ticker}
              onClick={() => onSelect?.(p as any)}
              className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-xs shadow-inner">
                  {p.ticker.slice(0, 2)}
                </div>
                <div>
                  <span className="font-extrabold text-sm text-[#0D1B2E] block">{p.ticker}</span>
                  <span className="text-[10px] text-gray-400 block">{p.qty} acciones</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold font-mono text-sm text-[#0D1B2E] block">
                  ${p.totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-[10px] font-bold font-mono ${
                    isUp ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isUp ? '▲ +' : '▼ '}{p.pnlPct.toFixed(2)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around px-2 z-20">
        <div className="flex flex-col items-center gap-0.5 text-[#1F3864]">
          <span className="text-lg">🏠</span>
          <span className="text-[10px] font-bold">Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">📈</span>
          <span className="text-[10px]">Mercados</span>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1F3864] to-[#2B4A8A] text-white flex items-center justify-center -mt-6 shadow-lg text-2xl font-bold">
          +
        </div>
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">🏆</span>
          <span className="text-[10px]">Liga</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">⚡</span>
          <span className="text-[10px]">Más</span>
        </div>
      </div>
    </div>
  )
}

// ── Screen 2: Detalle del Activo (al tocar una acción) ─────────────────────────

function MobileDetailScreen({
  activeTab = 'Resumen',
  setActiveTab
}: {
  activeTab?: DetailTab
  setActiveTab?: (t: DetailTab) => void
}) {
  const [tab, setTab] = useState<DetailTab>(activeTab)
  const currentTab = setActiveTab ? activeTab : tab
  const handleTab = (t: DetailTab) => {
    setTab(t)
    setActiveTab?.(t)
  }

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] relative font-sans">
      {/* Top Header with Back button */}
      <div className="pt-12 px-4 pb-2 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <ArrowLeft size={16} className="text-gray-700" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-[#0D1B2E]">🍎 AAPL</span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              ▲ +1.82%
            </span>
          </div>
          <span className="text-xs text-gray-400">Apple Inc. · Nasdaq</span>
        </div>
      </div>

      {/* Large Price Display */}
      <div className="px-5 pt-1 pb-3">
        <span className="text-3xl font-black text-[#0D1B2E] font-mono tracking-tight">$190.12</span>
        <span className="text-xs text-gray-400 ml-2 font-mono">USD</span>
      </div>

      {/* Asset Interactive Chart Area */}
      <div className="h-[175px] px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={candleData} margin={{ top: 4, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="mDetailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1F3864" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1F3864" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#9BA3B2' }} axisLine={false} tickLine={false} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#9BA3B2' }} axisLine={false} tickLine={false} />
            <Area type="monotone" dataKey="c" stroke="#1F3864" strokeWidth={2.5} fill="url(#mDetailGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4 Tabs: Resumen / Técnico / Noticias / Fundamentales */}
      <div className="flex px-4 py-2 gap-1 border-b border-gray-200">
        {(['Resumen', 'Técnico', 'Noticias', 'Fundamentales'] as DetailTab[]).map(t => (
          <button
            key={t}
            onClick={() => handleTab(t)}
            className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-colors ${
              currentTab === t
                ? 'bg-[#1F3864] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Key Financial Metrics Table */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2.5 text-xs">
          {[
            ['Precio Actual', '$190.12'],
            ['Apertura', '$191.46'],
            ['Cierre Anterior', '$191.46'],
            ['Máximo del Día', '$192.18'],
            ['Mínimo del Día', '$189.75'],
            ['Volumen Diario', '58.43M'],
            ['Capitalización', '$2.91T'],
          ].map(([label, val], i) => (
            <div key={label} className={`flex justify-between py-1 ${i < 6 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-gray-500">{label}</span>
              <span className="font-bold font-mono text-[#0D1B2E]">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Buttons Comprar / Vender */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 flex gap-3 z-30">
        <button
          className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg text-center"
          style={{ background: 'linear-gradient(135deg, #1B7E34 0%, #22A041 100%)' }}
        >
          COMPRAR
        </button>
        <button
          className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg text-center"
          style={{ background: 'linear-gradient(135deg, #C62828 0%, #E53535 100%)' }}
        >
          VENDER
        </button>
      </div>
    </div>
  )
}

// ── Screen 3: Orden Rápida (Bottom Sheet with Backdrop Blur) ───────────────────

function MobileOrderScreen() {
  const { assets, executeOrder } = useMarket()
  const [side, setSide] = useState<'Comprar' | 'Vender'>('Comprar')
  const [qty, setQty] = useState(15)
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null)
  const asset = assets['AAPL'] || Object.values(assets)[0]
  const price = asset.price
  const total = (qty * price).toFixed(2)

  const handleConfirm = () => {
    const res = executeOrder({
      ticker: asset.ticker,
      side: side === 'Comprar' ? 'compra' : 'venta',
      orderType: 'Mercado',
      qty,
      price
    })
    if (res.success) {
      setConfirmedMsg(`✓ ${qty} ${asset.ticker} ${side === 'Comprar' ? 'Compradas' : 'Vendidas'}`)
      setTimeout(() => setConfirmedMsg(null), 3000)
    } else {
      setConfirmedMsg(`✕ ${res.message}`)
      setTimeout(() => setConfirmedMsg(null), 3000)
    }
  }

  return (
    <div className="h-full bg-[#F8F9FB] relative font-sans overflow-hidden">
      {/* Background with blurred underlay */}
      <div className="absolute inset-0 bg-[#0D1B2E]/60 backdrop-blur-md z-10" />

      {/* Bottom Sheet Modal */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-[32px] p-5 pb-8 shadow-2xl flex flex-col gap-3.5 animate-slideUp"
        style={{ maxHeight: '90%' }}
      >
        {/* Handle Pill */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-[#0D1B2E]">Orden Rápida</h3>
            <span className="text-xs text-gray-500 font-medium">🍎 AAPL · ${price.toFixed(2)} USD</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
            ✕
          </div>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setSide('Comprar')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              side === 'Comprar' ? 'bg-[#1B7E34] text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Comprar
          </button>
          <button
            onClick={() => setSide('Vender')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              side === 'Vender' ? 'bg-[#C62828] text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Vender
          </button>
        </div>

        {/* Order Type Chips */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Tipo de Orden
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {['Mercado', 'Límite', 'Stop'].map(t => (
              <div
                key={t}
                className={`py-1.5 text-center font-bold rounded-lg border ${
                  t === 'Mercado'
                    ? 'border-[#1F3864] bg-[#1F3864]/10 text-[#1F3864]'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Quantity Slider */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cantidad</span>
            <span className="font-extrabold font-mono text-base text-[#0D1B2E]">{qty} acc.</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={qty}
            onChange={e => setQty(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B7E34]"
          />
          <div className="flex justify-between text-[9px] text-gray-400 font-mono">
            <span>1</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Cost Summary Box */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Precio estimado:</span>
            <span className="font-mono font-semibold">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Cantidad:</span>
            <span className="font-mono font-semibold">× {qty}</span>
          </div>
          <div className="h-[1px] bg-gray-200 my-0.5" />
          <div className="flex justify-between font-bold text-sm">
            <span className="text-[#0D1B2E]">Total Estimado:</span>
            <span className="font-mono text-emerald-600">${Number(total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Confirm Order Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-xl text-center active:scale-95 transition-transform"
          style={{
            background: side === 'Comprar'
              ? 'linear-gradient(135deg, #1B7E34 0%, #22A041 100%)'
              : 'linear-gradient(135deg, #C62828 0%, #E53535 100%)'
          }}
        >
          {confirmedMsg ? confirmedMsg : `Confirmar ${side} — $${Number(total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
        </button>
      </div>
    </div>
  )
}

// ── Main Mobile View Container ────────────────────────────────────────────────

export default function MobileView({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2E] via-[#1F3864] to-[#16284D] text-white p-6 flex flex-col items-center">
      {/* Top Bar with back button */}
      <div className="w-full max-w-[1400px] flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/20"
            >
              <ArrowLeft size={16} /> Volver a Vista Desktop
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-white">Vista Mobile (390×844px) · iPhone 14</h1>
            <p className="text-xs text-blue-200/80">3 Pantallas interconectadas del flujo bursátil móvil</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
          <Trophy size={14} /> Prototipo Mobile IHC UNMSM
        </div>
      </div>

      {/* 3 iPhone 14 Frames Side by Side */}
      <div className="flex flex-wrap items-center justify-center gap-6 w-full max-w-[1440px]">
        {/* Frame 1: Mi Portafolio */}
        <PhoneFrame label="Mi Portafolio" stepNumber="1" arrow>
          <MobilePortfolioScreen />
        </PhoneFrame>

        {/* Frame 2: Detalle del Activo */}
        <PhoneFrame label="Detalle del Activo" stepNumber="2" arrow>
          <MobileDetailScreen />
        </PhoneFrame>

        {/* Frame 3: Orden Rápida */}
        <PhoneFrame label="Orden Rápida" stepNumber="3">
          <MobileOrderScreen />
        </PhoneFrame>
      </div>

      {/* Footer Info */}
      <p className="text-xs text-white/40 mt-8">
        Ernesto Investing AI · Versión Móvil Responsive 390×844px · Sistema IHC
      </p>
    </div>
  )
}
