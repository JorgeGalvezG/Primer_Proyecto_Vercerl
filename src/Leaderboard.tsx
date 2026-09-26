import { useState, useMemo } from 'react'
import {
  Trophy, Award, Flame, Search, ChevronRight, Users,
  TrendingUp, TrendingDown, Star, Sparkles, Shield, Target,
  Zap, Clock, ArrowUpRight, ArrowDownRight, CheckCircle2,
  Share2, HelpCircle
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useMarket } from './context/MarketContext'

interface LeaderboardProps {
  dark?: boolean
  onTrade?: (ticker: string) => void
  onBackToDashboard?: () => void
}

interface Competitor {
  rank: number
  prevRank: number
  name: string
  handle: string
  avatar: string
  league: string
  portfolioValue: number
  pnlPct: number
  pnlUsd: number
  xp: number
  winRate: number
  tradesCount: number
  isCurrentUser?: boolean
  topAssets: { ticker: string; pct: number }[]
}

const COMPETITORS_DATA: Competitor[] = [
  {
    rank: 1,
    prevRank: 2,
    name: 'Market Wizards',
    handle: '@mwizards',
    avatar: '🧙‍♂️',
    league: 'Diamante',
    portfolioValue: 186543.20,
    pnlPct: 15.62,
    pnlUsd: 25210.40,
    xp: 8920,
    winRate: 78.4,
    tradesCount: 42,
    topAssets: [{ ticker: 'NVDA', pct: 40 }, { ticker: 'MSFT', pct: 35 }, { ticker: 'AAPL', pct: 25 }]
  },
  {
    rank: 2,
    prevRank: 1,
    name: 'Bullish Titans',
    handle: '@bulltitans',
    avatar: '🐂',
    league: 'Diamante',
    portfolioValue: 167892.10,
    pnlPct: 12.45,
    pnlUsd: 18620.10,
    xp: 7450,
    winRate: 71.2,
    tradesCount: 38,
    topAssets: [{ ticker: 'TSLA', pct: 45 }, { ticker: 'NVDA', pct: 30 }, { ticker: 'AMZN', pct: 25 }]
  },
  {
    rank: 3,
    prevRank: 4,
    name: 'Alpha Traders',
    handle: '@alphatrader',
    avatar: '⚡',
    league: 'Diamante',
    portfolioValue: 155320.50,
    pnlPct: 10.21,
    pnlUsd: 14380.00,
    xp: 6800,
    winRate: 68.5,
    tradesCount: 29,
    topAssets: [{ ticker: 'AAPL', pct: 50 }, { ticker: 'GOOGL', pct: 30 }, { ticker: 'META', pct: 20 }]
  },
  {
    rank: 4,
    prevRank: 3,
    name: 'Quantum Hedge',
    handle: '@quantum_h',
    avatar: '🧠',
    league: 'Diamante',
    portfolioValue: 149810.00,
    pnlPct: 9.85,
    pnlUsd: 13450.20,
    xp: 6310,
    winRate: 66.0,
    tradesCount: 34,
    topAssets: [{ ticker: 'MSFT', pct: 40 }, { ticker: 'NVDA', pct: 35 }, { ticker: 'AMD', pct: 25 }]
  },
  {
    rank: 5,
    prevRank: 7,
    name: 'UNMSM Quant Lab',
    handle: '@unmsm_quant',
    avatar: '🏛️',
    league: 'Diamante',
    portfolioValue: 144210.80,
    pnlPct: 9.40,
    pnlUsd: 12400.00,
    xp: 5980,
    winRate: 64.8,
    tradesCount: 27,
    topAssets: [{ ticker: 'NVDA', pct: 50 }, { ticker: 'AAPL', pct: 30 }, { ticker: 'BTC', pct: 20 }]
  },
  {
    rank: 6,
    prevRank: 5,
    name: 'Starlight Capital',
    handle: '@starlight',
    avatar: '🌟',
    league: 'Diamante',
    portfolioValue: 139400.15,
    pnlPct: 8.95,
    pnlUsd: 11520.40,
    xp: 5540,
    winRate: 62.1,
    tradesCount: 23,
    topAssets: [{ ticker: 'AMZN', pct: 40 }, { ticker: 'META', pct: 35 }, { ticker: 'GOOGL', pct: 25 }]
  },
  {
    rank: 7,
    prevRank: 6,
    name: 'Delta Neutral',
    handle: '@deltaneutral',
    avatar: '⚖️',
    league: 'Diamante',
    portfolioValue: 135800.00,
    pnlPct: 8.70,
    pnlUsd: 10890.00,
    xp: 5210,
    winRate: 61.5,
    tradesCount: 31,
    topAssets: [{ ticker: 'SPY', pct: 50 }, { ticker: 'QQQ', pct: 30 }, { ticker: 'AAPL', pct: 20 }]
  },
  {
    rank: 128,
    prevRank: 135,
    name: 'Jorge Gálvez Garro (Tú)',
    handle: '@jgalvezg',
    avatar: '🎓',
    league: 'Diamante',
    portfolioValue: 125430.50,
    pnlPct: 8.45,
    pnlUsd: 2450.00,
    xp: 4850,
    winRate: 67.3,
    tradesCount: 19,
    isCurrentUser: true,
    topAssets: [{ ticker: 'BVN', pct: 35 }, { ticker: 'AAPL', pct: 30 }, { ticker: 'TSLA', pct: 20 }, { ticker: 'ABX.TO', pct: 15 }]
  }
]

const PERFORMANCE_CHART_DATA = [
  { day: '01 Sep', port: 100000, sp500: 100000 },
  { day: '04 Sep', port: 104200, sp500: 101200 },
  { day: '07 Sep', port: 108900, sp500: 101800 },
  { day: '10 Sep', port: 112400, sp500: 102500 },
  { day: '13 Sep', port: 110800, sp500: 101900 },
  { day: '16 Sep', port: 117500, sp500: 103400 },
  { day: '19 Sep', port: 121300, sp500: 104100 },
  { day: '22 Sep', port: 123800, sp500: 104800 },
  { day: '24 Sep', port: 125430, sp500: 105200 },
]

const BADGES = [
  {
    id: 'shark',
    title: 'Tiburón de Wall Street',
    desc: '+15% de rentabilidad en menos de 24 horas',
    icon: '🦈',
    status: 'unlocked',
    unlockedDate: '18 Sep 2026',
    xpReward: '+500 XP'
  },
  {
    id: 'sniper',
    title: 'Francotirador Bursátil',
    desc: '5 operaciones ganadoras consecutivas',
    icon: '🎯',
    status: 'unlocked',
    unlockedDate: '12 Sep 2026',
    xpReward: '+350 XP'
  },
  {
    id: 'risk',
    title: 'Gestor Prudente',
    desc: 'Mantener drawdown máximo menor al 3%',
    icon: '🛡️',
    status: 'unlocked',
    unlockedDate: '08 Sep 2026',
    xpReward: '+250 XP'
  },
  {
    id: 'crypto',
    title: 'Leyenda Cripto & Tech',
    desc: 'Opera 10 activos de alta volatilidad con profit',
    icon: '⚡',
    status: 'locked',
    progress: 70,
    progressLabel: '7 de 10 operaciones',
    xpReward: '+800 XP'
  }
]

export default function Leaderboard({ dark = false, onTrade, onBackToDashboard }: LeaderboardProps) {
  const { portfolioValue, dayPnlUsd, dayPnlPct, orderHistory, positions } = useMarket()
  const [period, setPeriod] = useState<'semanal' | 'mensual' | 'all' | 'liga'>('semanal')
  const [activeTournament, setActiveTournament] = useState('diamante')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<Competitor | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const fmt = (n: number, d = 2) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })

  const liveCompetitors = useMemo(() => {
    return COMPETITORS_DATA.map(c => {
      if (c.isCurrentUser) {
        return {
          ...c,
          portfolioValue,
          pnlUsd: dayPnlUsd,
          pnlPct: Number(dayPnlPct.toFixed(2)),
          tradesCount: Math.max(c.tradesCount, orderHistory.length),
          topAssets: positions.slice(0, 4).map(p => ({
            ticker: p.ticker,
            pct: Math.round((p.totalValue / (portfolioValue || 1)) * 100)
          }))
        }
      }
      return c
    })
  }, [portfolioValue, dayPnlUsd, dayPnlPct, orderHistory, positions])

  const livePerformanceData = useMemo(() => {
    return [
      ...PERFORMANCE_CHART_DATA.slice(0, -1),
      { day: 'Hoy (En Vivo)', port: Number(portfolioValue.toFixed(0)), sp500: 105200 }
    ]
  }, [portfolioValue])

  const filteredCompetitors = liveCompetitors.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentUser = liveCompetitors.find(c => c.isCurrentUser) || liveCompetitors[0]

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4 t-bg min-h-0">
      {/* ── Banner Superior: Temporada y Liga Activa ───────────────────────── */}
      <div
        className="rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 t-shadow"
        style={{
          background: dark
            ? 'linear-gradient(135deg, #161B22 0%, #1F2937 100%)'
            : 'linear-gradient(135deg, #1F3864 0%, #172D53 70%, #112240 100%)',
          color: '#FFFFFF',
          border: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #C5961A 0%, #F59E0B 100%)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Temporada Oficial 2026-2
              </span>
              <span className="text-xs text-blue-200 flex items-center gap-1 font-mono-data">
                <Clock size={12} /> Finaliza en: <strong>5d 14h 32m</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
              Fantasy Trading League · Tabla de Posiciones
            </h1>
            <p className="text-xs text-blue-200/80">
              Compite en simulación bursátil con portafolio de $100K USD. Sube de categoría y gana badges oficiales IHC.
            </p>
          </div>
        </div>

        {/* Controles de torneos y acción */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="bg-black/30 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTournament('diamante')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTournament === 'diamante' ? 'bg-amber-500 text-white font-bold shadow' : 'text-blue-100 hover:text-white'
              }`}
            >
              💎 Liga Diamante
            </button>
            <button
              onClick={() => setActiveTournament('unmsm')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTournament === 'unmsm' ? 'bg-blue-600 text-white font-bold shadow' : 'text-blue-100 hover:text-white'
              }`}
            >
              🏛️ Torneo UNMSM
            </button>
            <button
              onClick={() => setActiveTournament('global')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTournament === 'global' ? 'bg-blue-600 text-white font-bold shadow' : 'text-blue-100 hover:text-white'
              }`}
            >
              🌍 Liga Global
            </button>
          </div>

          <button
            onClick={() => setShowJoinModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-white shadow"
            style={{ background: 'linear-gradient(135deg, #C5961A 0%, #D97706 100%)' }}
          >
            <Users size={14} /> + Crear / Unirse a Liga
          </button>
        </div>
      </div>

      {/* ── 4 Tarjetas KPI Superiores (Gamificación y Rendimiento) ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Portafolio Simulado */}
        <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium t-text2">Portafolio Simulado</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono-data">
              ▲ +8.45% sem
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold t-text1 font-mono-data tracking-tight">
              ${fmt(currentUser.portfolioValue)}
            </div>
            <p className="text-[11px] t-text3 mt-0.5">Capital inicial: $100,000.00 USD</p>
          </div>
          <div className="mt-3 pt-2.5 border-t t-border flex items-center justify-between text-[11px]">
            <span className="t-text2">Poder de compra:</span>
            <span className="font-semibold t-text1 font-mono-data">$68,420.00</span>
          </div>
        </div>

        {/* KPI 2: Ganancia Total PnL */}
        <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium t-text2">Ganancia Total Simulada (P&L)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono-data">
              +25.43% ROI
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 font-mono-data tracking-tight">
              +${fmt(currentUser.pnlUsd)}
            </div>
            <p className="text-[11px] t-text3 mt-0.5">Ganancia acumulada en 30 días</p>
          </div>
          <div className="mt-3 pt-2.5 border-t t-border flex items-center justify-between text-[11px]">
            <span className="t-text2">Win Rate:</span>
            <span className="font-semibold text-emerald-600 font-mono-data">67.3% (19 trades)</span>
          </div>
        </div>

        {/* KPI 3: Posición y Puntuación */}
        <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium t-text2">Rango & Posición Actual</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
              ⭐ Top 1%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 font-mono-data tracking-tight">
              #{currentUser.rank}
            </span>
            <span className="text-xs t-text3">de 5,432 participantes</span>
          </div>
          <div className="mt-3 pt-2.5 border-t t-border flex items-center justify-between text-[11px]">
            <span className="t-text2">Puntuación:</span>
            <span className="font-semibold text-amber-600 font-mono-data">4,850 XP (🔥 Racha 8)</span>
          </div>
        </div>

        {/* KPI 4: División y Ascenso */}
        <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium t-text2">Categoría de Liga</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
              💎 Diamante III
            </span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs font-semibold t-text1 mb-1">
              <span>Hacia Maestro</span>
              <span className="font-mono-data">82%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '82%', background: 'linear-gradient(90deg, #3B82F6, #C5961A)' }}
              />
            </div>
            <p className="text-[10px] t-text3 mt-1.5">Faltan 650 XP para ascender de división</p>
          </div>
          <div className="mt-3 pt-2.5 border-t t-border flex items-center justify-between text-[11px]">
            <span className="t-text2">Zona de descenso:</span>
            <span className="font-medium text-emerald-600 font-mono-data">+8 puestos de margen</span>
          </div>
        </div>
      </div>

      {/* ── CUERPO PRINCIPAL (2 Columnas: 65% Tabla / 35% Analítica & Badges) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMNA IZQUIERDA: Tabla de Clasificación en Vivo (65% -> 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Barra de Filtros y Búsqueda */}
          <div className="t-card t-border border rounded-xl p-3 t-shadow flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Pestañas de Temporalidad */}
            <div role="tablist" aria-label="Filtrar temporalidad del leaderboard" className="flex items-center p-1 rounded-lg t-tab border t-border w-full sm:w-auto">
              {(['semanal', 'mensual', 'all', 'liga'] as const).map(tabKey => {
                const labels: Record<string, string> = {
                  semanal: 'Semanal',
                  mensual: 'Mensual',
                  all: 'Histórico',
                  liga: 'Mi Red UNMSM'
                }
                return (
                  <button
                    key={tabKey}
                    role="tab"
                    aria-selected={period === tabKey}
                    aria-label={`Clasificación ${labels[tabKey]}`}
                    onClick={() => setPeriod(tabKey)}
                    className={`flex-1 sm:flex-initial px-3 py-1 text-xs font-medium rounded-md transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                      period === tabKey
                        ? 't-tab-act t-text1 font-bold shadow-sm'
                        : 't-text2 hover:t-text1'
                    }`}
                  >
                    {labels[tabKey]}
                  </button>
                )
              })}
            </div>

            {/* Búsqueda rápida */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 t-text3" aria-hidden="true" />
              <label htmlFor="leaderboard-search" className="sr-only">Buscar trader o equipo</label>
              <input
                id="leaderboard-search"
                type="text"
                aria-label="Buscar trader o equipo por nombre o identificador"
                placeholder="Buscar trader o equipo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg t-card t-border border t-text1 placeholder:t-text3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Podio Visual Top 3 */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* #2 Bullish Titans */}
            <div className="t-card t-border border rounded-xl p-3 t-shadow text-center flex flex-col items-center justify-between relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 t-text1 font-mono-data">
                #2
              </div>
              <div className="text-2xl mt-1">🥈</div>
              <div className="text-2xl my-1">{COMPETITORS_DATA[1].avatar}</div>
              <div className="text-xs font-bold t-text1 truncate w-full">{COMPETITORS_DATA[1].name}</div>
              <div className="text-[10px] t-text3">{COMPETITORS_DATA[1].handle}</div>
              <div className="text-sm font-bold text-emerald-600 font-mono-data mt-1">
                +{COMPETITORS_DATA[1].pnlPct}%
              </div>
              <div className="text-[10px] font-mono-data t-text2 mt-0.5">
                ${fmt(COMPETITORS_DATA[1].portfolioValue, 0)}
              </div>
            </div>

            {/* #1 Market Wizards (Corona y elevación) */}
            <div
              className="t-card rounded-xl p-3.5 t-shadow-lg text-center flex flex-col items-center justify-between relative overflow-hidden transform -translate-y-1"
              style={{
                border: '2px solid #C5961A',
                background: dark ? 'rgba(197,150,26,0.06)' : 'rgba(197,150,26,0.04)'
              }}
            >
              <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white font-mono-data shadow">
                LÍDER #1
              </div>
              <div className="text-3xl animate-bounce">👑</div>
              <div className="text-3xl my-1">{COMPETITORS_DATA[0].avatar}</div>
              <div className="text-xs font-extrabold t-text1 truncate w-full">{COMPETITORS_DATA[0].name}</div>
              <div className="text-[10px] text-amber-600 font-semibold">{COMPETITORS_DATA[0].handle}</div>
              <div className="text-base font-extrabold text-emerald-600 font-mono-data mt-1">
                +{COMPETITORS_DATA[0].pnlPct}%
              </div>
              <div className="text-[11px] font-mono-data font-bold t-text1 mt-0.5">
                ${fmt(COMPETITORS_DATA[0].portfolioValue, 0)}
              </div>
            </div>

            {/* #3 Alpha Traders */}
            <div className="t-card t-border border rounded-xl p-3 t-shadow text-center flex flex-col items-center justify-between relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-700/20 text-amber-700 dark:text-amber-300 font-mono-data">
                #3
              </div>
              <div className="text-2xl mt-1">🥉</div>
              <div className="text-2xl my-1">{COMPETITORS_DATA[2].avatar}</div>
              <div className="text-xs font-bold t-text1 truncate w-full">{COMPETITORS_DATA[2].name}</div>
              <div className="text-[10px] t-text3">{COMPETITORS_DATA[2].handle}</div>
              <div className="text-sm font-bold text-emerald-600 font-mono-data mt-1">
                +{COMPETITORS_DATA[2].pnlPct}%
              </div>
              <div className="text-[10px] font-mono-data t-text2 mt-0.5">
                ${fmt(COMPETITORS_DATA[2].portfolioValue, 0)}
              </div>
            </div>
          </div>

          {/* Tabla de Posiciones */}
          <div className="t-card t-border border rounded-xl t-shadow overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b t-border flex items-center justify-between t-thead">
              <span className="text-xs font-semibold t-text1 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" /> Clasificación General en Tiempo Real
              </span>
              <span className="text-[11px] t-text3">
                Mostrando {filteredCompetitors.length} participantes activos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" role="table" aria-label="Tabla de clasificación general en tiempo real">
                <thead>
                  <tr className="border-b t-border t-text2 text-[11px] uppercase tracking-wider">
                    <th scope="col" className="py-2.5 px-3">Rango</th>
                    <th scope="col" className="py-2.5 px-3">Trader / Equipo</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Rentabilidad P&L</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Portafolio Simulado</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Puntuación XP</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Win Rate</th>
                    <th scope="col" className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y t-border font-mono-data">
                  {filteredCompetitors.map(c => {
                    const isUser = c.isCurrentUser
                    const rankDiff = c.prevRank - c.rank
                    return (
                      <tr
                        key={c.rank}
                        className={`transition-all ${
                          isUser
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-l-amber-500'
                            : 't-hover'
                        }`}
                      >
                        {/* Rango */}
                        <td className="py-2.5 px-3 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-5 text-center ${c.rank <= 3 ? 'font-extrabold text-amber-600' : 't-text1'}`}>
                              #{c.rank}
                            </span>
                            {rankDiff > 0 && (
                              <span className="text-[10px] text-emerald-600 flex items-center" title={`Subió ${rankDiff} puestos`}>
                                ▲{rankDiff}
                              </span>
                            )}
                            {rankDiff < 0 && (
                              <span className="text-[10px] text-red-500 flex items-center" title={`Bajó ${Math.abs(rankDiff)} puestos`}>
                                ▼{Math.abs(rankDiff)}
                              </span>
                            )}
                            {rankDiff === 0 && <span className="text-[10px] t-text3">=</span>}
                          </div>
                        </td>

                        {/* Trader */}
                        <td className="py-2.5 px-3 font-sans">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                              {c.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold t-text1 truncate flex items-center gap-1.5">
                                {c.name}
                                {isUser && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold uppercase">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] t-text3 truncate">{c.handle}</div>
                            </div>
                          </div>
                        </td>

                        {/* Rentabilidad */}
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              c.pnlPct >= 0
                                ? 'text-emerald-600 bg-emerald-500/10'
                                : 'text-red-600 bg-red-500/10'
                            }`}
                          >
                            {c.pnlPct >= 0 ? '+' : ''}{c.pnlPct}%
                          </span>
                        </td>

                        {/* Portafolio */}
                        <td className="py-2.5 px-3 text-right font-medium t-text1">
                          ${fmt(c.portfolioValue)}
                        </td>

                        {/* XP */}
                        <td className="py-2.5 px-3 text-right font-medium text-amber-600">
                          {c.xp} XP
                        </td>

                        {/* Win Rate */}
                        <td className="py-2.5 px-3 text-right text-[11px] t-text2">
                          {c.winRate}%
                        </td>

                        {/* Acción */}
                        <td className="py-2.5 px-3 text-center font-sans">
                          <button
                            onClick={() => setSelectedUser(c)}
                            className="px-2.5 py-1 rounded text-[11px] font-medium t-tab t-text1 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Ver Cartera
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Fila Fija / Sticky destacada para el usuario (Heurística 1 de Nielsen) */}
            <div
              className="p-3 border-t-2 border-t-amber-500 flex items-center justify-between text-xs font-mono-data"
              style={{
                background: dark ? 'rgba(31, 56, 100, 0.4)' : 'rgba(235, 243, 255, 0.95)'
              }}
            >
              <div className="flex items-center gap-2 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold t-text1 text-sm">Tu Posición Actual:</span>
                <span className="font-extrabold text-blue-600 font-mono-data text-sm">#{currentUser.rank}</span>
                <span className="t-text2 text-[11px]">de 5,432 participantes</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="t-text3 text-[11px]">Portafolio:</span>
                  <span className="font-bold t-text1">${fmt(currentUser.portfolioValue)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="t-text3 text-[11px]">P&L:</span>
                  <span className="font-bold text-emerald-600">+{currentUser.pnlPct}%</span>
                </div>
                <button
                  onClick={() => onTrade?.('AAPL')}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow transition-all font-sans"
                  style={{ background: 'linear-gradient(135deg, #1B7E34, #2E7D32)' }}
                >
                  🚀 Operar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Analítica del Portafolio & Badges (35% -> 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Tarjeta de Rendimiento Histórico (Gráfico) */}
          <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold t-text1 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-600" /> Rendimiento vs S&P 500
              </span>
              <span className="text-[10px] font-mono-data text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                +20.2% Alfa
              </span>
            </div>
            <p className="text-[11px] t-text3 mb-3">
              Comparativa de tu portafolio simulado contra el benchmark del mercado en el mes.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={livePerformanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#30363D' : '#E2E6EF'} vertical={false} />
                  <XAxis dataKey="day" stroke={dark ? '#8B949E' : '#9CA3AF'} tick={{ fontSize: 9 }} />
                  <YAxis stroke={dark ? '#8B949E' : '#9CA3AF'} tick={{ fontSize: 9 }} domain={['dataMin - 2000', 'dataMax + 2000']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: dark ? '#161B22' : '#FFFFFF',
                      borderColor: dark ? '#30363D' : '#E2E6EF',
                      fontSize: '11px',
                      borderRadius: '8px'
                    }}
                    formatter={(val: any) => [`$${fmt(Number(val))}`, '']}
                  />
                  <Line type="monotone" dataKey="port" name="Tu Cartera" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] t-text2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Tu Cartera (+25.4%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> S&P 500 (+5.2%)
              </span>
            </div>
          </div>

          {/* Top Holdings del Portafolio Simulado */}
          <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold t-text1">Top Holdings Simulados</span>
              <button
                onClick={() => onBackToDashboard?.()}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Ver Portafolio <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { ticker: 'AAPL', name: 'Apple Inc.', pct: 35, returnVal: '+14.2%', color: '#3B82F6' },
                { ticker: 'NVDA', name: 'NVIDIA Corp.', pct: 25, returnVal: '+32.8%', color: '#10B981' },
                { ticker: 'TSLA', name: 'Tesla Inc.', pct: 20, returnVal: '-4.1%', color: '#F59E0B' },
                { ticker: 'AMZN', name: 'Amazon.com', pct: 20, returnVal: '+8.6%', color: '#8B5CF6' }
              ].map(asset => (
                <div key={asset.ticker} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold t-text1">{asset.ticker}</span>
                      <span className="text-[10px] t-text3">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono-data">
                      <span className="t-text2">{asset.pct}%</span>
                      <span className={asset.returnVal.startsWith('+') ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {asset.returnVal}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${asset.pct}%`, backgroundColor: asset.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vitrina de Badges de Logros (Gamificación IHC) */}
          <div className="t-card t-border border rounded-xl p-3.5 t-shadow flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold t-text1 flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" /> Vitrina de Logros & Badges
              </span>
              <span className="text-[10px] font-semibold text-amber-600 font-mono-data bg-amber-500/10 px-2 py-0.5 rounded">
                3 / 4 Desbloqueados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              {BADGES.map(badge => {
                const isUnlocked = badge.status === 'unlocked'
                return (
                  <div
                    key={badge.id}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all group relative ${
                      isUnlocked
                        ? 't-border bg-amber-500/5 hover:border-amber-400'
                        : 'border-dashed border-gray-300 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="text-[9px] font-bold text-amber-600 font-mono-data bg-amber-400/10 px-1 py-0.5 rounded">
                        {badge.xpReward}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="text-[11px] font-bold t-text1 leading-snug line-clamp-1">
                        {badge.title}
                      </div>
                      <p className="text-[9px] t-text3 mt-0.5 line-clamp-2">
                        {badge.desc}
                      </p>
                    </div>

                    {isUnlocked ? (
                      <div className="mt-2 pt-1 border-t t-border flex items-center gap-1 text-[9px] text-emerald-600 font-medium">
                        <CheckCircle2 size={10} /> {badge.unlockedDate}
                      </div>
                    ) : (
                      <div className="mt-2 pt-1 border-t t-border">
                        <div className="flex justify-between text-[8px] t-text3 mb-0.5">
                          <span>Progreso</span>
                          <span>{badge.progress}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${badge.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de Detalle de Cartera de Competidor ───────────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="competitor-modal-title">
          <div className="t-card t-border border rounded-2xl w-full max-w-md p-5 t-shadow-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl" aria-hidden="true">{selectedUser.avatar}</div>
                <div>
                  <h3 id="competitor-modal-title" className="font-bold text-base t-text1">{selectedUser.name}</h3>
                  <p className="text-xs t-text3">{selectedUser.handle} · Rango #{selectedUser.rank}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                aria-label="Cerrar modal de detalles del competidor"
                className="w-8 h-8 rounded-lg t-tab flex items-center justify-center t-text2 hover:t-text1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 rounded-xl t-tab">
                <div className="text-[10px] t-text2">Portafolio Simulado</div>
                <div className="text-lg font-bold t-text1 font-mono-data">${fmt(selectedUser.portfolioValue)}</div>
              </div>
              <div className="p-3 rounded-xl t-tab">
                <div className="text-[10px] t-text2">Retorno P&L</div>
                <div className="text-lg font-bold text-emerald-600 font-mono-data">+{selectedUser.pnlPct}%</div>
              </div>
              <div className="p-3 rounded-xl t-tab">
                <div className="text-[10px] t-text2">Puntos de Experiencia</div>
                <div className="text-base font-semibold text-amber-600 font-mono-data">{selectedUser.xp} XP</div>
              </div>
              <div className="p-3 rounded-xl t-tab">
                <div className="text-[10px] t-text2">Tasa de Aciertos</div>
                <div className="text-base font-semibold t-text1 font-mono-data">{selectedUser.winRate}%</div>
              </div>
            </div>

            <h4 className="text-xs font-bold t-text1 mb-2">Composición de Activos</h4>
            <div className="flex flex-col gap-2 mb-4">
              {selectedUser.topAssets.map(asset => (
                <div key={asset.ticker} className="flex items-center justify-between text-xs p-2 rounded-lg t-hover">
                  <span className="font-bold t-text1">{asset.ticker}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${asset.pct}%` }} />
                    </div>
                    <span className="font-mono-data t-text2 text-[11px] w-8 text-right">{asset.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedUser(null)
                if (onTrade) onTrade(selectedUser.topAssets[0].ticker)
              }}
              aria-label={`Copiar estrategia u operar activo ${selectedUser.topAssets[0].ticker}`}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              style={{ background: 'linear-gradient(135deg, #1F3864 0%, #2563EB 100%)' }}
            >
              Copiar Estrategia / Operar {selectedUser.topAssets[0].ticker}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Crear / Unirse a Liga Privada ─────────────────────────────── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-league-modal-title">
          <div className="t-card t-border border rounded-2xl w-full max-w-sm p-5 t-shadow-lg">
            <h3 id="join-league-modal-title" className="font-bold text-base t-text1 mb-1">Unirse a Liga Privada</h3>
            <p className="text-xs t-text3 mb-4">
              Ingresa el código de 6 caracteres proporcionado por tu profesor o equipo de laboratorio IHC.
            </p>
            <label htmlFor="join-league-code" className="sr-only">Código de 6 caracteres de la liga</label>
            <input
              id="join-league-code"
              type="text"
              aria-label="Código de la liga privada"
              placeholder="Ej: UNMSM-2026"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm rounded-xl t-card t-border border t-text1 font-mono-data uppercase tracking-widest text-center mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium t-tab t-text2 hover:t-text1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setFeedbackMsg(`¡Te has unido con éxito a la Liga [${joinCode || 'UNMSM-IHC'}]!`)
                  setTimeout(() => setFeedbackMsg(null), 3500)
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white shadow focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                style={{ background: 'linear-gradient(135deg, #C5961A, #D97706)' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedbackMsg}
        </div>
      )}
    </div>
  )
}
