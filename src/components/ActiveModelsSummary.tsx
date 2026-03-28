import React from 'react';
import { ModelPerformance } from '../types/models';
import { Activity } from 'lucide-react';

/**
 * Компонент сводки активных моделей.
 * Отображает 3 карточки с текущими рабочими моделями.
 */
interface ActiveModelsSummaryProps {
  performance?: ModelPerformance | null;
}

const ActiveModelsSummary: React.FC<ActiveModelsSummaryProps> = ({ performance }) => {
  const cards = [
    {
      title: "Детектор объектов",
      active: "RTMDet v1.3",
      stats: performance ? `FPS: ${performance.current_fps} | Latency: ${performance.inference_time}ms` : "mAP (demo): 0.82",
      status: "Работает",
      isLive: !!performance
    },
    {
      title: "Трекинг",
      active: "ByteTrack v2.1",
      stats: performance ? `VRAM: ${performance.vram_usage_mb}MB` : null,
      status: "Работает",
      isLive: !!performance
    },
    {
      title: "ProcessEngine",
      active: "FSM_v2",
      stats: "Правил: 12",
      status: "Работает",
      isLive: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="bg-[#1e293b] border border-zinc-800 p-5 rounded-lg shadow-sm relative overflow-hidden group"
        >
          {card.isLive && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Live</span>
            </div>
          )}
          <h3 className="text-[#9ca3af] text-xs uppercase font-bold tracking-wider mb-2">
            {card.title}
          </h3>
          <div className="text-[#e5e7eb] text-xl font-semibold mb-1">
            {card.active}
          </div>
          {card.stats && (
            <div className={`text-sm mb-2 ${card.isLive ? 'text-blue-400 font-mono' : 'text-[#38bdf8]'}`}>
              {card.stats}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${card.status === 'Работает' ? 'bg-emerald-500' : 'bg-zinc-500'}`}></div>
            <span className="text-emerald-500 text-xs font-medium">{card.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveModelsSummary;
