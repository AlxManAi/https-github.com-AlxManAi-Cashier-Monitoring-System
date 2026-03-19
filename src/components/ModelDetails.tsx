import React from 'react';
import { Model } from '../types/models';

interface ModelDetailsProps {
  model: Model | null;
}

/**
 * Блок детальной информации о выбранной модели.
 */
const ModelDetails: React.FC<ModelDetailsProps> = ({ model }) => {
  if (!model) {
    return (
      <div className="bg-[#1e293b] border border-zinc-800 rounded-lg p-8 flex items-center justify-center h-full min-h-[300px]">
        <p className="text-[#9ca3af] italic">Выберите модель из списка для просмотра деталей</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    detector: "Детектор объектов",
    tracker: "Трекинг",
    process_engine: "ProcessEngine",
    action: "Action"
  };

  return (
    <div className="bg-[#1e293b] border border-zinc-800 rounded-lg p-4 md:p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-[#e5e7eb] text-xl md:text-2xl font-bold mb-1">
          {model.name} <span className="text-[#9ca3af] font-normal text-base md:text-lg">({model.version})</span>
        </h2>
        <div className="text-[#38bdf8] text-sm font-medium">
          {typeLabels[model.type] || model.type}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <div>
          <h4 className="text-[#9ca3af] text-[10px] uppercase font-bold tracking-widest mb-3">Метрики</h4>
          <div className="bg-[#0f172a]/50 rounded border border-zinc-800 overflow-hidden">
            {Object.entries(model.metrics).map(([key, val], i) => (
              <div key={key} className={`flex justify-between px-4 py-2 text-sm ${i !== 0 ? 'border-t border-zinc-800' : ''}`}>
                <span className="text-[#9ca3af]">{key}</span>
                <span className="text-[#e5e7eb] font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[#9ca3af] text-[10px] uppercase font-bold tracking-widest mb-2">Описание</h4>
          <p className="text-[#e5e7eb] text-sm leading-relaxed">
            {model.notes}
          </p>
        </div>

        <div>
          <h4 className="text-[#9ca3af] text-[10px] uppercase font-bold tracking-widest mb-2">Статус</h4>
          <div className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#38bdf8]">
            {model.status}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
        <button 
          onClick={() => alert("Функция недоступна в демо")}
          className="flex-1 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-bold py-2.5 rounded transition-colors text-sm"
        >
          Сделать активной
        </button>
        <button 
          onClick={() => alert("Конфигурация модели: " + model.id)}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-[#e5e7eb] font-bold py-2.5 rounded transition-colors text-sm border border-zinc-700"
        >
          Подробнее
        </button>
      </div>
    </div>
  );
};

export default ModelDetails;
