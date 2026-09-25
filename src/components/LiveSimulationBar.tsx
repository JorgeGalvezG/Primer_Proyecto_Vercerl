import React, { useState } from 'react'
import {
  Play, Pause, FastForward, Zap, RotateCcw, AlertTriangle,
  Flame, TrendingUp, TrendingDown, Radio, ChevronDown, Check, X
} from 'lucide-react'
import { useMarket } from '../context/MarketContext'

export default function LiveSimulationBar({ dark }: { dark?: boolean }) {
  const {
    isLive,
    simSpeed,
    toggleLive,
    setSpeed,
    triggerMarketEvent,
    resetToDefaults,
    assetList,
    currentNewsEvent,
    dismissNewsEvent
  } = useMarket()

  const [showEventMenu, setShowEventMenu] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const events = [
    {
      title: '⛏️ Boom de Metales: BVN y Mineras reportan superávit',
      impact: +5.2,
      tickers: ['BVN', 'FSM', 'ABX.TO'],
      label: 'Minería (+5.2%)'
    },
    {
      title: '🤖 Salto Tecnológico en IA: Demanda récord de Chips',
      impact: +3.8,
      tickers: ['NVDA', 'AAPL', 'TSLA', 'AMZN'],
      label: 'Rally Tech (+3.8%)'
    },
    {
      title: '📉 Decisión de la Fed: Tasas se mantienen restrictivas',
      impact: -2.3,
      tickers: [], // todos
      label: 'Caída Fed (-2.3%)'
    },
    {
      title: '🚀 Adopción Cripto Institucional: Nuevos fondos spot',
      impact: +4.9,
      tickers: ['BTC', 'ETH'],
      label: 'Cripto Rally (+4.9%)'
    }
  ]

  const fmt = (n: number) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="w-full flex flex-col border-b t-border text-xs select-none">
      {/* Breaking News Banner if active */}
      {currentNewsEvent && (
        <div className="w-full py-2 px-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white flex items-center justify-between shadow-inner animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/30 font-black text-[10px] tracking-wider uppercase animate-pulse">
              FLASH DE MERCADO
            </span>
            <span className="font-bold">{currentNewsEvent.title}</span>
            <span className="text-amber-200 text-[11px] font-mono">({currentNewsEvent.impact})</span>
          </div>
          <button
            onClick={dismissNewsEvent}
            className="p-1 hover:bg-black/20 rounded text-white"
            title="Cerrar noticia"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div
        className="px-4 py-2 flex flex-wrap items-center justify-between gap-3"
        style={{
          background: dark ? '#131922' : '#F8FAFC'
        }}
      >
        {/* Left: Simulation Live Status & Speed */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isLive ? 'animate-ping' : 'opacity-40'}`} />
            <span>{isLive ? 'MERCADO EN VIVO (EMULADO)' : 'SIMULACIÓN EN PAUSA'}</span>
          </div>

          {/* Speed Buttons */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border t-border">
            <button
              onClick={() => toggleLive()}
              className={`p-1 rounded text-xs transition-colors ${
                !isLive
                  ? 'bg-rose-500/20 text-rose-500 font-bold'
                  : 't-text2 hover:t-text1'
              }`}
              title={isLive ? 'Pausar simulación de precios' : 'Reanudar simulación'}
            >
              {isLive ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              onClick={() => setSpeed(1)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                isLive && simSpeed === 1
                  ? 'bg-[#1F3864] text-white dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                  : 't-text2 hover:t-text1'
              }`}
            >
              1x (1.6s)
            </button>
            <button
              onClick={() => setSpeed(2)}
              className={`flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                isLive && simSpeed === 2
                  ? 'bg-[#C5961A] text-white'
                  : 't-text2 hover:t-text1'
              }`}
              title="Velocidad Rápida"
            >
              <FastForward size={11} /> 2x Rápido
            </button>
          </div>
        </div>

        {/* Right: Volatility Event Trigger & Reset */}
        <div className="flex items-center gap-2">
          {/* Volatility Generator Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEventMenu(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              <Zap size={13} className="text-amber-500" />
              <span>Simular Volatilidad</span>
              <ChevronDown size={12} />
            </button>

            {showEventMenu && (
              <div
                className="absolute right-0 top-9 w-64 rounded-xl border t-border t-shadow p-2 z-50 flex flex-col gap-1 backdrop-blur"
                style={{ background: dark ? '#161B22' : '#FFFFFF' }}
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1">
                  Disparar Escenario de Mercado
                </span>
                {events.map((ev, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      triggerMarketEvent(ev.title, ev.impact, ev.tickers)
                      setShowEventMenu(false)
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold t-text1">{ev.label}</span>
                    <span className={`text-[11px] font-mono font-bold ${ev.impact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {ev.impact >= 0 ? '+' : ''}{ev.impact}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Baseline Guide Values */}
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold t-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5 border t-border transition-all"
              title="Restablecer los valores exactos iniciales de la Guía IHC ($125,430.50 y $68,420.00)"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Restablecer Guía</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-0.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px]">
              <span className="text-rose-600 dark:text-rose-400 font-bold px-1">¿Reiniciar valores?</span>
              <button
                onClick={() => {
                  resetToDefaults()
                  setShowResetConfirm(false)
                }}
                className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded hover:bg-rose-700"
              >
                Sí
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Live Ticker Tape (Marquee / Ribbon) */}
      <div
        className="w-full overflow-hidden border-t t-border py-1.5 px-2 flex items-center"
        style={{
          background: dark ? '#0B0E14' : '#ECEFF4'
        }}
      >
        <div className="flex items-center gap-6 whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth w-full px-2">
          {assetList.map(a => {
            const isUp = a.change >= 0
            const tickColor =
              a.tickDirection === 'up'
                ? 'bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 scale-105'
                : a.tickDirection === 'down'
                ? 'bg-rose-500/30 text-rose-600 dark:text-rose-400 scale-105'
                : ''

            return (
              <div
                key={a.ticker}
                className={`flex items-center gap-2 text-[11px] font-mono px-2 py-0.5 rounded transition-all duration-300 ${tickColor}`}
              >
                <span className="font-extrabold text-[var(--text1)]">{a.ticker}</span>
                <span className="font-bold text-[var(--text1)]">${fmt(a.price)}</span>
                <span className={`flex items-center text-[10px] font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isUp ? '+' : ''}{fmt(a.changePct)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
