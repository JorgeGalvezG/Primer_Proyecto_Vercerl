import { useState, useMemo } from 'react'
import {
  Bell, BellOff, Plus, Search, TrendingUp, TrendingDown,
  Trash2, X, ChevronDown, Zap, SlidersHorizontal, ArrowUpDown,
  CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetType = 'Acciones' | 'ETFs' | 'Cripto' | 'Índices'
export type SortKey   = 'Nombre' | 'Precio' | 'Variación %' | 'Volumen'
export type Condition = 'Mayor que' | 'Menor que' | 'Variación %'
export type NotifType = 'Email' | 'Push' | 'Ambas'
export type AlertStatus = 'activa' | 'disparada'

export interface Asset {
  ticker: string
  name: string
  type: AssetType
  price: number
  change: number
  changePct: number
  volume: number
  spark: number[]
}

export interface Alert {
  id: number
  ticker: string
  condition: Condition
  value: number
  notif: NotifType
  status: AlertStatus
  enabled: boolean
}

export interface WatchlistProps {
  dark?: boolean
  onTrade?: (ticker: string) => void
  initialOpenModal?: boolean
}

// ── Data ──────────────────────────────────────────────────────────────────────

const INITIAL_ASSETS: Asset[] = [
  { ticker: 'BVN',   name: 'Cía. de Minas Buenaventura', type: 'Acciones', price: 16.85,    change: +0.65,    changePct: +4.01, volume: 3_820_000,    spark: [15.8, 16.1, 16.3, 16.2, 16.5, 16.7, 16.85] },
  { ticker: 'FSM',   name: 'Fortuna Mining Corp.',       type: 'Acciones', price: 4.92,     change: +0.28,    changePct: +6.03, volume: 8_120_000,    spark: [4.5, 4.6, 4.7, 4.65, 4.8, 4.85, 4.92] },
  { ticker: 'ABX.TO',name: 'Barrick Gold Corporation',   type: 'Acciones', price: 24.80,    change: +0.45,    changePct: +1.85, volume: 12_400_000,   spark: [24.1, 24.3, 24.2, 24.5, 24.4, 24.6, 24.8] },
  { ticker: 'AAPL',  name: 'Apple Inc.',                 type: 'Acciones', price: 190.12,   change: -1.34,    changePct: -0.70, volume: 58_432_100,   spark: [196, 194, 193, 192, 195, 192, 190] },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',               type: 'Acciones', price: 875.32,   change: +40.87,   changePct: +4.90, volume: 143_210_000,  spark: [820, 835, 848, 861, 850, 865, 875] },
  { ticker: 'TSLA',  name: 'Tesla Inc.',                 type: 'Acciones', price: 243.18,   change: +7.56,    changePct: +3.21, volume: 89_100_000,   spark: [228, 232, 235, 238, 233, 240, 243] },
  { ticker: 'BTC',   name: 'Bitcoin',                    type: 'Cripto',   price: 63_420.50,change: +1820.30, changePct: +2.95, volume: 34_100_000_000,spark: [60200, 61400, 62000, 61800, 62500, 63100, 63420] },
  { ticker: 'ETH',   name: 'Ethereum',                   type: 'Cripto',   price: 2_481.70, change: -43.20,   changePct: -1.71, volume: 14_200_000_000,spark: [2580, 2540, 2520, 2505, 2490, 2470, 2482] },
  { ticker: 'SPY',   name: 'SPDR S&P 500 ETF',           type: 'ETFs',     price: 512.84,   change: +3.12,    changePct: +0.61, volume: 72_300_000,   spark: [505, 507, 508, 510, 509, 511, 513] },
  { ticker: 'QQQ',   name: 'Invesco QQQ ETF',            type: 'ETFs',     price: 441.20,   change: +5.80,    changePct: +1.33, volume: 44_100_000,   spark: [430, 433, 436, 438, 435, 439, 441] },
  { ticker: 'SP500', name: 'S&P 500 Index',              type: 'Índices',  price: 5_702.31, change: +28.14,   changePct: +0.50, volume: 0,            spark: [5630, 5655, 5668, 5674, 5660, 5688, 5702] },
  { ticker: 'META',  name: 'Meta Platforms',             type: 'Acciones', price: 512.45,   change: -4.52,    changePct: -0.87, volume: 21_400_000,   spark: [520, 518, 515, 514, 516, 513, 512] },
]

const INITIAL_ALERTS: Alert[] = [
  { id: 1, ticker: 'AAPL', condition: 'Mayor que', value: 195.00, notif: 'Ambas', status: 'activa', enabled: true },
  { id: 2, ticker: 'NVDA', condition: 'Mayor que', value: 900.00, notif: 'Push', status: 'disparada', enabled: true },
  { id: 3, ticker: 'TSLA', condition: 'Menor que', value: 230.00, notif: 'Email', status: 'activa', enabled: false },
  { id: 4, ticker: 'BTC',  condition: 'Mayor que', value: 65000.00, notif: 'Push', status: 'activa', enabled: true },
]

const FILTER_TYPES: Array<'Todos' | AssetType> = ['Todos', 'Acciones', 'ETFs', 'Cripto', 'Índices']
const SORT_KEYS: SortKey[] = ['Nombre', 'Precio', 'Variación %', 'Volumen']

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtVol = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return fmt(v, 0)
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Spark({ data, positive }: { data: number[]; positive: boolean }) {
  const pts = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={pts}>
        <Line
          dataKey="v"
          dot={false}
          strokeWidth={2}
          stroke={positive ? '#1B7E34' : '#C62828'}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Asset Card with Hover Elevation ───────────────────────────────────────────

function AssetCard({
  asset, onAlert, onTrade, hasAlert
}: {
  asset: Asset
  onAlert: (ticker: string) => void
  onTrade: (ticker: string) => void
  hasAlert: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const pos = asset.change >= 0

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="t-card border t-border rounded-xl p-4 flex flex-col justify-between transition-all duration-200"
      style={{
        boxShadow: hovered
          ? '0 12px 28px -4px rgba(31,56,100,0.18), 0 4px 12px -2px rgba(0,0,0,0.08)'
          : 'var(--shadow)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        borderColor: hovered ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black px-2 py-0.5 rounded-md"
              style={{
                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: 'var(--accent)',
              }}
            >
              {asset.ticker}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border t-border t-text2 bg-black/5 dark:bg-white/5">
              {asset.type}
            </span>
          </div>
          <button
            onClick={() => onAlert(asset.ticker)}
            aria-label={`Configurar alerta para ${asset.ticker}`}
            title="Crear Alerta"
            className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: hasAlert ? 'var(--gold)' : 'var(--text3)' }}
          >
            <Bell size={15} fill={hasAlert ? 'var(--gold)' : 'none'} />
          </button>
        </div>

        <h3 className="text-xs font-semibold t-text1 truncate mb-3">{asset.name}</h3>

        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xl font-black font-mono-data t-text1">
            ${fmt(asset.price)}
          </span>
          <span
            className="text-xs font-bold font-mono-data flex items-center gap-0.5 px-2 py-0.5 rounded-full"
            style={{
              color: pos ? 'var(--gain)' : 'var(--loss)',
              background: pos ? 'rgba(27,126,52,0.12)' : 'rgba(198,40,40,0.12)',
            }}
          >
            {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {pos ? '+' : ''}{fmt(asset.changePct)}%
          </span>
        </div>

        {/* Sparkline chart */}
        <div className="my-2">
          <Spark data={asset.spark} positive={pos} />
        </div>
      </div>

      <div className="pt-3 border-t t-border flex items-center justify-between mt-1">
        <span className="text-[11px] t-text3 font-mono-data">
          Vol: <strong className="t-text2">{fmtVol(asset.volume)}</strong>
        </span>
        <button
          onClick={() => onTrade(asset.ticker)}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: 'var(--accent)' }}
        >
          <span>Operar</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Modal Centrado "Nueva Alerta" con Overlay Oscuro ───────────────────────────

function NewAlertModal({
  initialTicker = 'AAPL',
  assets,
  onClose,
  onSave
}: {
  initialTicker?: string
  assets: Asset[]
  onClose: () => void
  onSave: (alert: Omit<Alert, 'id' | 'status'>) => void
}) {
  const [ticker, setTicker] = useState(initialTicker)
  const [condition, setCondition] = useState<Condition>('Mayor que')
  const [value, setValue] = useState(
    assets.find(a => a.ticker === initialTicker)?.price.toString() || '195.00'
  )
  const [notif, setNotif] = useState<NotifType>('Ambas')

  const selectedAsset = assets.find(a => a.ticker === ticker)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ticker,
      condition,
      value: parseFloat(value) || 0,
      notif,
      enabled: true,
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="t-card border t-border rounded-2xl w-full max-w-md p-6 t-shadow-lg flex flex-col gap-4 relative">
        <div className="flex items-center justify-between pb-3 border-b t-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C5961A]/15 text-[#C5961A] flex items-center justify-center">
              <Bell size={18} />
            </div>
            <h2 id="alert-modal-title" className="text-base font-bold t-text1">Nueva Alerta de Precio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md t-text3 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Selector de Ticker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold t-text2 uppercase tracking-wide text-[10px]">Activo Bursátil</label>
            <select
              value={ticker}
              onChange={e => {
                setTicker(e.target.value)
                const found = assets.find(a => a.ticker === e.target.value)
                if (found) setValue(found.price.toString())
              }}
              className="py-2.5 px-3 rounded-lg border t-border t-card t-text1 outline-none font-semibold focus:border-[#1F3864]"
            >
              {assets.map(a => (
                <option key={a.ticker} value={a.ticker}>
                  {a.ticker} — {a.name} (${fmt(a.price)})
                </option>
              ))}
            </select>
          </div>

          {/* Condición */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold t-text2 uppercase tracking-wide text-[10px]">Condición de Disparo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Mayor que', 'Menor que', 'Variación %'] as Condition[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`py-2 px-2 rounded-lg border text-center font-bold text-xs transition-all ${
                    condition === c
                      ? 'border-[#1F3864] bg-[#1F3864] text-white dark:border-[#58A6FF] dark:bg-[#58A6FF]/20 dark:text-[#58A6FF]'
                      : 't-border t-text2 bg-transparent hover:t-text1'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Valor Umbral */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold t-text2 uppercase tracking-wide text-[10px]">
                {condition === 'Variación %' ? 'Porcentaje de Variación (%)' : 'Precio Umbral ($ USD)'}
              </label>
              {selectedAsset && (
                <span className="text-[10px] font-mono-data t-text3">
                  Actual: ${fmt(selectedAsset.price)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              required
              value={value}
              onChange={e => setValue(e.target.value)}
              className="py-2.5 px-3 rounded-lg border t-border t-card t-text1 font-mono-data font-bold text-sm outline-none focus:border-[#1F3864]"
              placeholder="Ej. 195.50"
            />
          </div>

          {/* Método de Notificación */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold t-text2 uppercase tracking-wide text-[10px]">Canal de Notificación</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Email', 'Push', 'Ambas'] as NotifType[]).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNotif(n)}
                  className={`py-2 px-2 rounded-lg border text-center font-semibold text-xs transition-all ${
                    notif === n
                      ? 'border-[#C5961A] bg-[#C5961A]/15 text-[#C5961A]'
                      : 't-border t-text2 bg-transparent hover:t-text1'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t t-border mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold t-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white shadow-md transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Guardar Alerta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Watchlist Component ──────────────────────────────────────────────────

export default function Watchlist({
  dark = false,
  onTrade,
  initialOpenModal = false
}: WatchlistProps) {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS)
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS)
  const [activeFilter, setActiveFilter] = useState<'Todos' | AssetType>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(initialOpenModal)
  const [modalTicker, setModalTicker] = useState('AAPL')
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchType = activeFilter === 'Todos' || a.type === activeFilter
      const matchSearch =
        a.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchType && matchSearch
    })
  }, [assets, activeFilter, searchQuery])

  // Open modal with specific ticker
  const handleOpenAlertModal = (ticker: string = 'AAPL') => {
    setModalTicker(ticker)
    setModalOpen(true)
  }

  // Toggle Alert enabled status
  const handleToggleAlert = (id: number) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }

  // Delete Alert
  const handleDeleteAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  // Add Alert
  const handleAddAlert = (alertData: Omit<Alert, 'id' | 'status'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: Date.now(),
      status: 'activa',
    }
    setAlerts([newAlert, ...alerts])
    setSuccessToast(`Alerta configurada para ${alertData.ticker} (${alertData.condition} ${alertData.value})`)
    setTimeout(() => setSuccessToast(null), 3500)
  }

  const tickersWithAlerts = new Set(alerts.filter(a => a.enabled).map(a => a.ticker))

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 w-full max-w-[1520px] mx-auto min-h-screen">
      {/* Top Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b t-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black t-text1">Watchlist & Alertas Bursátiles</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#1F3864]/10 dark:bg-[#58A6FF]/20 text-[#1F3864] dark:text-[#58A6FF] border t-border">
              {filteredAssets.length} de {assets.length} Activos
            </span>
          </div>
          <p className="text-xs t-text2 mt-1">
            Supervisa tus activos favoritos en tiempo real y gestiona notificaciones de fluctuación de mercado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAlertModal('AAPL')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={16} />
            <span>+ Agregar Alerta</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTER_TYPES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeFilter === cat
                  ? 'bg-[#1F3864] text-white shadow-sm'
                  : 't-card border t-border t-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 t-text3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por ticker o nombre..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border t-border t-card t-text1 outline-none focus:border-[#1F3864]"
          />
        </div>
      </div>

      {/* 2-Column Main Layout: Grid of Cards (Left ~75%) + Active Alerts Panel (Right ~25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Grid of Asset Cards (lg:col-span-8 or 9) */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAssets.map(asset => (
              <AssetCard
                key={asset.ticker}
                asset={asset}
                hasAlert={tickersWithAlerts.has(asset.ticker)}
                onAlert={t => handleOpenAlertModal(t)}
                onTrade={t => onTrade?.(t)}
              />
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="p-12 text-center t-card border t-border rounded-xl">
              <p className="text-sm font-semibold t-text2">No se encontraron activos para los filtros seleccionados.</p>
              <button
                onClick={() => { setActiveFilter('Todos'); setSearchQuery('') }}
                className="mt-3 text-xs font-bold text-blue-600 underline"
              >
                Restablecer filtros
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Active Alerts Panel (lg:col-span-4 or 3) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          <div className="t-card border t-border rounded-xl p-5 t-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b t-border">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#C5961A]" />
                <h2 className="text-xs font-bold uppercase tracking-wider t-text1">Alertas Activas</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C5961A]/10 text-[#C5961A]">
                {alerts.filter(a => a.enabled).length} Activas
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1">
              {alerts.map(al => (
                <div
                  key={al.id}
                  className={`p-3 rounded-xl border transition-all ${
                    al.enabled
                      ? 't-card t-border t-shadow'
                      : 'bg-black/5 dark:bg-white/5 opacity-60 border-dashed t-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black" style={{ color: 'var(--accent)' }}>
                          {al.ticker}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          al.status === 'disparada'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {al.status}
                        </span>
                      </div>
                      <p className="text-[11px] t-text2 font-medium mt-1">
                        {al.condition} <strong>${fmt(al.value)}</strong>
                      </p>
                      <span className="text-[10px] t-text3">Canal: {al.notif}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Toggle On/Off switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={al.enabled}
                        onClick={() => handleToggleAlert(al.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                          al.enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            al.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteAlert(al.id)}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors"
                        title="Eliminar Alerta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {alerts.length === 0 && (
                <div className="p-6 text-center text-xs t-text3">
                  No tienes alertas configuradas. Haz clic en "+ Agregar Alerta" para crear una.
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenAlertModal('AAPL')}
              className="w-full py-2.5 rounded-lg border border-dashed t-border text-xs font-bold t-text2 hover:t-text1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Configurar Otra Alerta</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal Nueva Alerta */}
      {modalOpen && (
        <NewAlertModal
          initialTicker={modalTicker}
          assets={assets}
          onClose={() => setModalOpen(false)}
          onSave={handleAddAlert}
        />
      )}
    </div>
  )
}
