import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetType = 'Acciones' | 'ETFs' | 'Cripto' | 'Índices'
export type Side = 'compra' | 'venta'
export type OrderType = 'Mercado' | 'Límite' | 'Stop' | 'Stop-Límite'
export type AlertCondition = 'Mayor que' | 'Menor que' | 'Variación %'
export type NotifType = 'Email' | 'Push' | 'Ambas'

export interface AssetData {
  ticker: string
  name: string
  sector: string
  type: AssetType
  price: number
  prevPrice: number
  open: number
  high: number
  low: number
  change: number
  changePct: number
  week52High: number
  week52Low: number
  volume: number
  marketCap: number
  spark: number[]
  tickDirection: 'up' | 'down' | 'none'
}

export interface Position {
  ticker: string
  name: string
  qty: number
  avgPrice: number
  curPrice: number
  totalValue: number
  pnlUsd: number
  pnlPct: number
  dayPnl: number
}

export interface OrderRecord {
  id: number
  timestamp: string
  ticker: string
  side: Side
  type: OrderType
  qty: number
  price: number
  total: number
  status: 'Ejecutada' | 'Pendiente' | 'Cancelada'
}

export interface AlertItem {
  id: number
  ticker: string
  condition: AlertCondition
  value: number
  notif: NotifType
  status: 'activa' | 'disparada'
  enabled: boolean
  createdAt: string
  lastTriggered?: string
}

export interface NotificationItem {
  id: number
  title: string
  message: string
  time: string
  type: 'trade' | 'alert' | 'news'
  ticker?: string
}

export interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface DepthLevel {
  price: number
  qty: number
  total: number
}

export interface MarketContextType {
  // Market Assets
  assets: Record<string, AssetData>
  assetList: AssetData[]
  
  // Live controls
  isLive: boolean
  simSpeed: 1 | 2 | 0
  toggleLive: () => void
  setSpeed: (speed: 1 | 2 | 0) => void
  triggerMarketEvent: (title: string, impactPct: number, affectedTickers?: string[]) => void
  resetToDefaults: () => void
  
  // Portfolio
  buyingPower: number
  positions: Position[]
  portfolioValue: number
  dayPnlUsd: number
  dayPnlPct: number
  totalReturnPct: number
  
  // Trading
  orderHistory: OrderRecord[]
  executeOrder: (order: {
    ticker: string
    side: Side
    type?: OrderType
    orderType?: OrderType
    qty: number
    price?: number
  }) => { success: boolean; message: string }
  
  // Alerts
  alerts: AlertItem[]
  addAlert: (alert: Omit<AlertItem, 'id' | 'status' | 'createdAt'>) => void
  toggleAlert: (id: number) => void
  deleteAlert: (id: number) => void
  
  // Notifications
  notifications: NotificationItem[]
  unreadCount: number
  markNotificationsAsRead: () => void
  clearNotifications: () => void
  
  // Live Candlesticks & Depth Book helper
  getCandlesForTicker: (ticker: string) => Candle[]
  getOrderBookForTicker: (ticker: string) => { asks: DepthLevel[]; bids: DepthLevel[] }
  
  // Active Flash Event
  currentNewsEvent: { title: string; impact: string; time: string } | null
  dismissNewsEvent: () => void
}

// ── Initial Baseline Data (Exact numbers from IHC Lab 04 Guide) ───────────────

const BASE_BUYING_POWER = 68420.00

const INITIAL_ASSETS_MAP: Record<string, AssetData> = {
  BVN: {
    ticker: 'BVN',
    name: 'Cía. de Minas Buenaventura',
    sector: 'Minería / Metales',
    type: 'Acciones',
    price: 16.85,
    prevPrice: 16.85,
    open: 16.20,
    high: 17.10,
    low: 16.15,
    change: +0.65,
    changePct: +4.01,
    week52High: 18.90,
    week52Low: 9.80,
    volume: 3820000,
    marketCap: 4280000000,
    spark: [15.8, 16.1, 16.3, 16.2, 16.5, 16.7, 16.85],
    tickDirection: 'none'
  },
  FSM: {
    ticker: 'FSM',
    name: 'Fortuna Mining Corp.',
    sector: 'Metales Preciosos',
    type: 'Acciones',
    price: 4.92,
    prevPrice: 4.92,
    open: 4.64,
    high: 5.05,
    low: 4.60,
    change: +0.28,
    changePct: +6.03,
    week52High: 6.10,
    week52Low: 2.85,
    volume: 8120000,
    marketCap: 1510000000,
    spark: [4.5, 4.6, 4.7, 4.65, 4.8, 4.85, 4.92],
    tickDirection: 'none'
  },
  'ABX.TO': {
    ticker: 'ABX.TO',
    name: 'Barrick Gold Corporation',
    sector: 'Minería / Oro',
    type: 'Acciones',
    price: 24.80,
    prevPrice: 24.80,
    open: 24.35,
    high: 25.10,
    low: 24.20,
    change: +0.45,
    changePct: +1.85,
    week52High: 27.50,
    week52Low: 18.20,
    volume: 12400000,
    marketCap: 43600000000,
    spark: [24.1, 24.3, 24.2, 24.5, 24.4, 24.6, 24.8],
    tickDirection: 'none'
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Tecnología',
    type: 'Acciones',
    price: 190.12,
    prevPrice: 190.12,
    open: 191.46,
    high: 192.18,
    low: 189.75,
    change: -1.34,
    changePct: -0.70,
    week52High: 237.23,
    week52Low: 164.08,
    volume: 58432100,
    marketCap: 2910000000000,
    spark: [196, 194, 193, 192, 195, 192, 190.12],
    tickDirection: 'none'
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Automotriz / Tech',
    type: 'Acciones',
    price: 243.18,
    prevPrice: 243.18,
    open: 235.62,
    high: 245.80,
    low: 234.10,
    change: +7.56,
    changePct: +3.21,
    week52High: 271.00,
    week52Low: 138.80,
    volume: 89100000,
    marketCap: 774000000000,
    spark: [228, 232, 235, 238, 233, 240, 243.18],
    tickDirection: 'none'
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    sector: 'Semiconductores / IA',
    type: 'Acciones',
    price: 875.32,
    prevPrice: 875.32,
    open: 834.45,
    high: 882.00,
    low: 832.00,
    change: +40.87,
    changePct: +4.90,
    week52High: 974.00,
    week52Low: 392.00,
    volume: 143210000,
    marketCap: 2150000000000,
    spark: [820, 835, 848, 861, 850, 865, 875.32],
    tickDirection: 'none'
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Comercio / Cloud',
    type: 'Acciones',
    price: 192.74,
    prevPrice: 192.74,
    open: 187.93,
    high: 194.20,
    low: 187.10,
    change: +4.81,
    changePct: +2.56,
    week52High: 201.20,
    week52Low: 118.35,
    volume: 48900000,
    marketCap: 2010000000000,
    spark: [182, 185, 188, 190, 186, 190, 192.74],
    tickDirection: 'none'
  },
  META: {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Redes Sociales / IA',
    type: 'Acciones',
    price: 512.45,
    prevPrice: 512.45,
    open: 516.97,
    high: 520.10,
    low: 510.30,
    change: -4.52,
    changePct: -0.87,
    week52High: 542.80,
    week52Low: 279.40,
    volume: 21400000,
    marketCap: 1300000000000,
    spark: [520, 518, 515, 514, 516, 513, 512.45],
    tickDirection: 'none'
  },
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF',
    sector: 'Fondo Indexado',
    type: 'ETFs',
    price: 512.84,
    prevPrice: 512.84,
    open: 509.72,
    high: 514.20,
    low: 508.90,
    change: +3.12,
    changePct: +0.61,
    week52High: 518.00,
    week52Low: 410.00,
    volume: 72300000,
    marketCap: 520000000000,
    spark: [505, 507, 508, 510, 509, 511, 512.84],
    tickDirection: 'none'
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ ETF',
    sector: 'Nasdaq 100 Tech',
    type: 'ETFs',
    price: 441.20,
    prevPrice: 441.20,
    open: 435.40,
    high: 443.50,
    low: 434.80,
    change: +5.80,
    changePct: +1.33,
    week52High: 450.00,
    week52Low: 345.00,
    volume: 44100000,
    marketCap: 260000000000,
    spark: [430, 433, 436, 438, 435, 439, 441.20],
    tickDirection: 'none'
  },
  BTC: {
    ticker: 'BTC',
    name: 'Bitcoin',
    sector: 'Criptodivisa',
    type: 'Cripto',
    price: 63420.50,
    prevPrice: 63420.50,
    open: 61600.20,
    high: 64150.00,
    low: 61200.00,
    change: +1820.30,
    changePct: +2.95,
    week52High: 73750.00,
    week52Low: 25900.00,
    volume: 34100000000,
    marketCap: 1250000000000,
    spark: [60200, 61400, 62000, 61800, 62500, 63100, 63420.5],
    tickDirection: 'none'
  },
  ETH: {
    ticker: 'ETH',
    name: 'Ethereum',
    sector: 'Smart Contracts',
    type: 'Cripto',
    price: 2481.70,
    prevPrice: 2481.70,
    open: 2524.90,
    high: 2550.00,
    low: 2460.00,
    change: -43.20,
    changePct: -1.71,
    week52High: 4090.00,
    week52Low: 1520.00,
    volume: 14200000000,
    marketCap: 298000000000,
    spark: [2580, 2540, 2520, 2505, 2490, 2470, 2481.7],
    tickDirection: 'none'
  },
  SP500: {
    ticker: 'SP500',
    name: 'S&P 500 Index',
    sector: 'Índice de Mercado',
    type: 'Índices',
    price: 5702.31,
    prevPrice: 5702.31,
    open: 5674.17,
    high: 5715.00,
    low: 5665.00,
    change: +28.14,
    changePct: +0.50,
    week52High: 5720.00,
    week52Low: 4100.00,
    volume: 0,
    marketCap: 45000000000000,
    spark: [5630, 5655, 5668, 5674, 5660, 5688, 5702.31],
    tickDirection: 'none'
  },
}

// Exact 5 Positions from Guide
const INITIAL_POSITIONS_CONFIG = [
  { ticker: 'BVN', name: 'Cía. de Minas Buenaventura', qty: 300, avgPrice: 14.20, prevDayClose: 16.20 },
  { ticker: 'FSM', name: 'Fortuna Mining Corp.', qty: 450, avgPrice: 4.10, prevDayClose: 4.64 },
  { ticker: 'ABX.TO', name: 'Barrick Gold Corporation', qty: 200, avgPrice: 22.50, prevDayClose: 24.35 },
  { ticker: 'AAPL', name: 'Apple Inc.', qty: 150, avgPrice: 167.45, prevDayClose: 191.46 },
  { ticker: 'TSLA', name: 'Tesla Inc.', qty: 60, avgPrice: 215.80, prevDayClose: 235.62 },
]

const INITIAL_ORDERS: OrderRecord[] = [
  { id: 1, timestamp: 'Hoy 10:45', ticker: 'AAPL', side: 'compra', type: 'Mercado', qty: 25, price: 189.80, total: 4745.00, status: 'Ejecutada' },
  { id: 2, timestamp: 'Hoy 09:32', ticker: 'TSLA', side: 'venta', type: 'Límite', qty: 15, price: 242.50, total: 3637.50, status: 'Ejecutada' },
  { id: 3, timestamp: 'Ayer 15:10', ticker: 'BVN', side: 'compra', type: 'Límite', qty: 50, price: 16.00, total: 800.00, status: 'Cancelada' },
  { id: 4, timestamp: 'Ayer 11:20', ticker: 'FSM', side: 'compra', type: 'Stop', qty: 100, price: 4.80, total: 480.00, status: 'Ejecutada' },
  { id: 5, timestamp: '23 Sep 14:05', ticker: 'ABX.TO', side: 'venta', type: 'Mercado', qty: 30, price: 24.50, total: 735.00, status: 'Ejecutada' },
]

const INITIAL_ALERTS: AlertItem[] = [
  { id: 1, ticker: 'AAPL', condition: 'Mayor que', value: 192.00, notif: 'Ambas', status: 'activa', enabled: true, createdAt: 'Hoy 09:00' },
  { id: 2, ticker: 'NVDA', condition: 'Mayor que', value: 890.00, notif: 'Push', status: 'activa', enabled: true, createdAt: 'Hoy 09:15' },
  { id: 3, ticker: 'BVN', condition: 'Mayor que', value: 17.50, notif: 'Push', status: 'activa', enabled: true, createdAt: 'Hoy 09:30' },
  { id: 4, ticker: 'TSLA', condition: 'Menor que', value: 240.00, notif: 'Email', status: 'activa', enabled: false, createdAt: 'Ayer 16:00' },
  { id: 5, ticker: 'BTC', condition: 'Mayor que', value: 64000.00, notif: 'Push', status: 'activa', enabled: true, createdAt: 'Hoy 08:30' },
]

// Audio synthesizer for real-time sound feedback (Web Audio API)
function playSound(type: 'trade' | 'alert' | 'event') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'trade') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } else if (type === 'alert') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1) // D6
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    }
  } catch {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

// ── Context Creation ──────────────────────────────────────────────────────────

const MarketContext = createContext<MarketContextType | undefined>(undefined)

export function MarketProvider({ children }: { children: React.ReactNode }) {
  // State
  const [assets, setAssets] = useState<Record<string, AssetData>>(() => {
    const saved = localStorage.getItem('ernesto_market_assets')
    return saved ? JSON.parse(saved) : INITIAL_ASSETS_MAP
  })

  const [buyingPower, setBuyingPower] = useState<number>(() => {
    const saved = localStorage.getItem('ernesto_buying_power')
    return saved ? parseFloat(saved) : BASE_BUYING_POWER
  })

  const [holdings, setHoldings] = useState<typeof INITIAL_POSITIONS_CONFIG>(() => {
    const saved = localStorage.getItem('ernesto_holdings')
    return saved ? JSON.parse(saved) : INITIAL_POSITIONS_CONFIG
  })

  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem('ernesto_orders')
    return saved ? JSON.parse(saved) : INITIAL_ORDERS
  })

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem('ernesto_alerts')
    return saved ? JSON.parse(saved) : INITIAL_ALERTS
  })

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'Mercado Abierto',
      message: 'Sesión bursátil en curso con cotizaciones en tiempo real.',
      time: '09:30',
      type: 'news'
    }
  ])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const [isLive, setIsLive] = useState<boolean>(true)
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 0>(1) // 1=normal, 2=rápido, 0=pausado
  const [currentNewsEvent, setCurrentNewsEvent] = useState<{ title: string; impact: string; time: string } | null>(null)

  // Local storage auto-sync
  useEffect(() => {
    localStorage.setItem('ernesto_market_assets', JSON.stringify(assets))
  }, [assets])

  useEffect(() => {
    localStorage.setItem('ernesto_buying_power', buyingPower.toString())
  }, [buyingPower])

  useEffect(() => {
    localStorage.setItem('ernesto_holdings', JSON.stringify(holdings))
  }, [holdings])

  useEffect(() => {
    localStorage.setItem('ernesto_orders', JSON.stringify(orderHistory))
  }, [orderHistory])

  useEffect(() => {
    localStorage.setItem('ernesto_alerts', JSON.stringify(alerts))
  }, [alerts])

  // Derive Positions with live prices and calculations
  const positions: Position[] = holdings.map(h => {
    const liveAsset = assets[h.ticker]
    const curPrice = liveAsset ? liveAsset.price : h.avgPrice
    const totalValue = h.qty * curPrice
    const pnlUsd = (curPrice - h.avgPrice) * h.qty
    const pnlPct = ((curPrice - h.avgPrice) / h.avgPrice) * 100
    const dayPnl = (curPrice - h.prevDayClose) * h.qty
    return {
      ticker: h.ticker,
      name: h.name,
      qty: h.qty,
      avgPrice: h.avgPrice,
      curPrice,
      totalValue,
      pnlUsd,
      pnlPct,
      dayPnl
    }
  })

  const holdingsValue = positions.reduce((acc, p) => acc + p.totalValue, 0)
  const portfolioValue = buyingPower + holdingsValue
  const dayPnlUsd = positions.reduce((acc, p) => acc + p.dayPnl, 0)
  const dayPnlPct = portfolioValue > 0 ? (dayPnlUsd / (portfolioValue - dayPnlUsd)) * 100 : 0
  const totalReturnPct = ((portfolioValue - 100000) / 100000) * 100

  // ── Emulated Real-Time Tick Loop ────────────────────────────────────────────

  useEffect(() => {
    if (!isLive || simSpeed === 0) return

    const intervalMs = simSpeed === 2 ? 800 : 1600

    const timer = setInterval(() => {
      setAssets(prev => {
        const next = { ...prev }
        // Pick 2-4 random tickers each tick to fluctuate naturally
        const tickers = Object.keys(next)
        const countToUpdate = Math.floor(Math.random() * 3) + 2
        const chosen = [...tickers].sort(() => 0.5 - Math.random()).slice(0, countToUpdate)

        chosen.forEach(t => {
          const item = next[t]
          // Brownian micro-jump: -0.22% to +0.24%
          const pctStep = (Math.random() - 0.485) * 0.005
          const newPrice = Math.max(0.1, Number((item.price * (1 + pctStep)).toFixed(2)))
          const tickDir: 'up' | 'down' = newPrice >= item.price ? 'up' : 'down'
          const newHigh = Math.max(item.high, newPrice)
          const newLow = Math.min(item.low, newPrice)
          const newChange = Number((newPrice - item.open).toFixed(2))
          const newChangePct = Number(((newChange / item.open) * 100).toFixed(2))
          const newVol = item.volume + Math.floor(Math.random() * 400 + 50)
          const newSpark = [...item.spark.slice(-9), newPrice]

          next[t] = {
            ...item,
            prevPrice: item.price,
            price: newPrice,
            high: newHigh,
            low: newLow,
            change: newChange,
            changePct: newChangePct,
            volume: newVol,
            spark: newSpark,
            tickDirection: tickDir
          }

          // Check live alerts for this ticker
          alerts.forEach(al => {
            if (!al.enabled || al.status === 'disparada' || al.ticker !== t) return
            const conditionMet =
              (al.condition === 'Mayor que' && newPrice >= al.value) ||
              (al.condition === 'Menor que' && newPrice <= al.value)

            if (conditionMet) {
              // Trigger Alert!
              playSound('alert')
              setAlerts(currAlerts =>
                currAlerts.map(a =>
                  a.id === al.id
                    ? { ...a, status: 'disparada', lastTriggered: 'Ahora mismo' }
                    : a
                )
              )
              setNotifications(prevNotifs => [
                {
                  id: Date.now(),
                  title: `🚨 Alerta Disparada: ${t}`,
                  message: `${item.name} alcanzó $${newPrice.toFixed(2)} (${al.condition} $${al.value.toFixed(2)})`,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'alert',
                  ticker: t
                },
                ...prevNotifs
              ])
              setUnreadCount(c => c + 1)
            }
          })
        })

        return next
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isLive, simSpeed, alerts])

  // Reset tick direction highlight after 800ms
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      setAssets(prev => {
        let changed = false
        const next = { ...prev }
        Object.keys(next).forEach(k => {
          if (next[k].tickDirection !== 'none') {
            next[k] = { ...next[k], tickDirection: 'none' }
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 700)
    return () => clearTimeout(resetTimer)
  }, [assets])

  // ── Trading Execution ───────────────────────────────────────────────────────

  const executeOrder = ({
    ticker,
    side,
    orderType,
    type,
    qty,
    price
  }: {
    ticker: string
    side: Side
    orderType?: OrderType
    type?: OrderType
    qty: number
    price?: number
  }) => {
    const finalOrderType: OrderType = orderType || type || 'Mercado'
    const asset = assets[ticker]
    if (!asset) return { success: false, message: 'Activo no encontrado' }

    const execPrice = price && price > 0 ? price : asset.price
    const totalCost = Number((qty * execPrice).toFixed(2))

    if (side === 'compra') {
      if (totalCost > buyingPower) {
        return {
          success: false,
          message: `Fondos insuficientes. Se requiere $${totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })} y tu poder es $${buyingPower.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
        }
      }

      // Deduct buying power
      setBuyingPower(bp => Number((bp - totalCost).toFixed(2)))

      // Update holdings
      setHoldings(prevHoldings => {
        const existingIdx = prevHoldings.findIndex(h => h.ticker === ticker)
        if (existingIdx >= 0) {
          const existing = prevHoldings[existingIdx]
          const newQty = existing.qty + qty
          const newAvgPrice = Number(((existing.qty * existing.avgPrice + totalCost) / newQty).toFixed(2))
          const updated = [...prevHoldings]
          updated[existingIdx] = { ...existing, qty: newQty, avgPrice: newAvgPrice }
          return updated
        } else {
          return [
            ...prevHoldings,
            {
              ticker,
              name: asset.name,
              qty,
              avgPrice: execPrice,
              prevDayClose: asset.open
            }
          ]
        }
      })
    } else {
      // Venta
      const existingHolding = holdings.find(h => h.ticker === ticker)
      if (!existingHolding || existingHolding.qty < qty) {
        return {
          success: false,
          message: `No posees suficientes acciones de ${ticker}. Disponibles: ${existingHolding?.qty || 0} acciones`
        }
      }

      // Add to buying power
      setBuyingPower(bp => Number((bp + totalCost).toFixed(2)))

      // Reduce holdings
      setHoldings(prevHoldings => {
        return prevHoldings
          .map(h => {
            if (h.ticker === ticker) {
              return { ...h, qty: h.qty - qty }
            }
            return h
          })
          .filter(h => h.qty > 0)
      })
    }

    // Add order record
    const newRecord: OrderRecord = {
      id: Date.now(),
      timestamp: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ticker,
      side,
      type: finalOrderType,
      qty,
      price: execPrice,
      total: totalCost,
      status: 'Ejecutada'
    }

    setOrderHistory(prev => [newRecord, ...prev])
    playSound('trade')

    // Add Notification
    setNotifications(prev => [
      {
        id: Date.now(),
        title: `Orden de ${side.toUpperCase()} Ejecutada`,
        message: `${qty} ${ticker} a $${execPrice.toFixed(2)} (Total: $${totalCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'trade',
        ticker
      },
      ...prev
    ])
    setUnreadCount(c => c + 1)

    return {
      success: true,
      message: `Orden de ${side.toUpperCase()} de ${qty} ${ticker} ejecutada con éxito a $${execPrice.toFixed(2)}`
    }
  }

  // ── Alert Methods ───────────────────────────────────────────────────────────

  const addAlert = (alertData: Omit<AlertItem, 'id' | 'status' | 'createdAt'>) => {
    const newAlert: AlertItem = {
      ...alertData,
      id: Date.now(),
      status: 'activa',
      createdAt: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setAlerts(prev => [newAlert, ...prev])
    playSound('event')
  }

  const toggleAlert = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  const deleteAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  // ── Notification Helpers ────────────────────────────────────────────────────

  const markNotificationsAsRead = () => {
    setUnreadCount(0)
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  // ── Market Event Trigger (Simulate Volatility / News) ───────────────────────

  const triggerMarketEvent = (title: string, impactPct: number, affectedTickers?: string[]) => {
    playSound('event')
    setCurrentNewsEvent({
      title,
      impact: impactPct >= 0 ? `+${impactPct.toFixed(1)}%` : `${impactPct.toFixed(1)}%`,
      time: 'Hace un instante'
    })

    setAssets(prev => {
      const next = { ...prev }
      const targets = affectedTickers && affectedTickers.length > 0
        ? affectedTickers
        : Object.keys(next)

      targets.forEach(t => {
        if (!next[t]) return
        const item = next[t]
        const multiplier = 1 + (impactPct / 100)
        const newPrice = Number((item.price * multiplier).toFixed(2))
        const newChange = Number((newPrice - item.open).toFixed(2))
        const newChangePct = Number(((newChange / item.open) * 100).toFixed(2))
        next[t] = {
          ...item,
          prevPrice: item.price,
          price: newPrice,
          high: Math.max(item.high, newPrice),
          low: Math.min(item.low, newPrice),
          change: newChange,
          changePct: newChangePct,
          spark: [...item.spark.slice(-8), newPrice],
          tickDirection: impactPct >= 0 ? 'up' : 'down'
        }
      })
      return next
    })

    setNotifications(prev => [
      {
        id: Date.now(),
        title: `📰 Flash Informativo: ${title}`,
        message: `Impacto en mercado estimado: ${impactPct >= 0 ? '+' : ''}${impactPct}%`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'news'
      },
      ...prev
    ])
    setUnreadCount(c => c + 1)
  }

  const dismissNewsEvent = () => {
    setCurrentNewsEvent(null)
  }

  // ── Reset to Guide Baseline ─────────────────────────────────────────────────

  const resetToDefaults = () => {
    localStorage.removeItem('ernesto_market_assets')
    localStorage.removeItem('ernesto_buying_power')
    localStorage.removeItem('ernesto_holdings')
    localStorage.removeItem('ernesto_orders')
    localStorage.removeItem('ernesto_alerts')

    setAssets(INITIAL_ASSETS_MAP)
    setBuyingPower(BASE_BUYING_POWER)
    setHoldings(INITIAL_POSITIONS_CONFIG)
    setOrderHistory(INITIAL_ORDERS)
    setAlerts(INITIAL_ALERTS)
    setCurrentNewsEvent(null)
    setNotifications([
      {
        id: Date.now(),
        title: 'Restablecimiento Completo',
        message: 'Valores base de la Guía de Laboratorio 04 IHC restaurados con éxito.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'news'
      }
    ])
  }

  // ── Candlesticks & Depth Generators ─────────────────────────────────────────

  const getCandlesForTicker = (ticker: string): Candle[] => {
    const asset = assets[ticker] || assets['AAPL']
    const base = asset.price * 0.97
    const result: Candle[] = []
    let price = base
    for (let i = 0; i < 30; i++) {
      const d = (Math.sin(i * 0.7) + Math.cos(i * 0.3)) * (asset.price * 0.008)
      const open = price
      const close = i === 29 ? asset.price : price + d
      const high = Math.max(open, close) + Math.abs(d) * 0.4 + 0.2
      const low = Math.min(open, close) - Math.abs(d) * 0.4 - 0.2
      const volume = Math.floor(1500000 + Math.abs(Math.sin(i * 1.5)) * 3000000)
      result.push({
        time: `${9 + Math.floor(i / 5)}:${(i % 5) * 12 || '00'}`,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume
      })
      price = close
    }
    return result
  }

  const getOrderBookForTicker = (ticker: string) => {
    const asset = assets[ticker] || assets['AAPL']
    const mid = asset.price
    const step = mid > 100 ? 0.25 : 0.05

    let cumAsk = 0
    const asks: DepthLevel[] = Array.from({ length: 5 }, (_, i) => {
      const p = Number((mid + (5 - i) * step).toFixed(2))
      const q = Math.floor(600 + Math.sin((5 - i) * 2.1) * 450 + 350)
      cumAsk += q
      return { price: p, qty: q, total: cumAsk }
    })

    let cumBid = 0
    const bids: DepthLevel[] = Array.from({ length: 5 }, (_, i) => {
      const p = Number((mid - (i + 1) * step).toFixed(2))
      const q = Math.floor(700 + Math.cos(i * 1.7) * 500 + 400)
      cumBid += q
      return { price: p, qty: q, total: cumBid }
    })

    return { asks, bids }
  }

  return (
    <MarketContext.Provider
      value={{
        assets,
        assetList: Object.values(assets),
        isLive,
        simSpeed,
        toggleLive: () => setIsLive(v => !v),
        setSpeed: (s: 1 | 2 | 0) => {
          setSimSpeed(s)
          setIsLive(s !== 0)
        },
        triggerMarketEvent,
        resetToDefaults,
        buyingPower,
        positions,
        portfolioValue,
        dayPnlUsd,
        dayPnlPct,
        totalReturnPct,
        orderHistory,
        executeOrder,
        alerts,
        addAlert,
        toggleAlert,
        deleteAlert,
        notifications,
        unreadCount,
        markNotificationsAsRead,
        clearNotifications,
        getCandlesForTicker,
        getOrderBookForTicker,
        currentNewsEvent,
        dismissNewsEvent
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const ctx = useContext(MarketContext)
  if (!ctx) {
    throw new Error('useMarket must be used within a MarketProvider')
  }
  return ctx
}
