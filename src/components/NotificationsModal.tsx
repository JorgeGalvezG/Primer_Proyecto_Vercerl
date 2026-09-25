import React from 'react'
import { Bell, CheckCircle2, AlertTriangle, Zap, Trash2, X } from 'lucide-react'
import { useMarket } from '../context/MarketContext'

export default function NotificationsDropdown({
  dark,
  onClose
}: {
  dark?: boolean
  onClose: () => void
}) {
  const { notifications, clearNotifications } = useMarket()

  return (
    <div
      className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border t-border shadow-2xl p-4 z-50 flex flex-col gap-3 backdrop-blur animate-fadeIn"
      style={{
        background: dark ? '#161B22' : '#FFFFFF'
      }}
    >
      <div className="flex items-center justify-between pb-2 border-b t-border">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#C5961A]" />
          <span className="font-bold text-xs uppercase tracking-wider t-text1">Notificaciones en Vivo</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-mono font-bold">
            {notifications.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="text-[11px] text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
              title="Borrar todas las notificaciones"
            >
              <Trash2 size={12} />
              <span>Limpiar</span>
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-gray-400">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <Bell size={24} className="opacity-30" />
            <span>Sin notificaciones pendientes</span>
          </div>
        ) : (
          notifications.map(n => {
            const isTrade = n.type === 'trade'
            const isAlert = n.type === 'alert'
            return (
              <div
                key={n.id}
                className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border t-border flex items-start gap-2.5 text-xs transition-all hover:brightness-105"
              >
                <div className="mt-0.5">
                  {isTrade ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : isAlert ? (
                    <AlertTriangle size={16} className="text-amber-500" />
                  ) : (
                    <Zap size={16} className="text-blue-500" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold t-text1 text-[11px]">{n.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{n.time}</span>
                  </div>
                  <p className="text-[11px] t-text2 leading-relaxed">{n.message}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
