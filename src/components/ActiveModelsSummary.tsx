import React from 'react';

/**
 * Компонент сводки активных моделей.
 * Отображает 3 карточки с текущими рабочими моделями.
 */
const ActiveModelsSummary: React.FC = () => {
  const cards = [
    {
      title: "Детектор объектов",
      active: "RTMDet v1.3",
      stats: "mAP (demo): 0.82",
      status: "Работает"
    },
    {
      title: "Трекинг",
      active: "ByteTrack v2.1",
      stats: null,
      status: "Работает"
    },
    {
      title: "ProcessEngine",
      active: "FSM_v2",
      stats: "Правил: 12",
      status: "Работает"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="bg-[#1e293b] border border-zinc-800 p-5 rounded-lg shadow-sm"
        >
          <h3 className="text-[#9ca3af] text-xs uppercase font-bold tracking-wider mb-2">
            {card.title}
          </h3>
          <div className="text-[#e5e7eb] text-xl font-semibold mb-1">
            {card.active}
          </div>
          {card.stats && (
            <div className="text-[#38bdf8] text-sm mb-2">
              {card.stats}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-emerald-500 text-xs font-medium">{card.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveModelsSummary;
