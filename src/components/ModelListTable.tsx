import React from 'react';
import { Model, ModelStatus } from '../types/models';

interface ModelListTableProps {
  models: Model[];
  selectedModelId: string | null;
  onSelectModel: (model: Model) => void;
}

/**
 * Таблица списка версий моделей.
 */
const ModelListTable: React.FC<ModelListTableProps> = ({ models, selectedModelId, onSelectModel }) => {
  
  const getStatusColor = (status: ModelStatus) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'candidate': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'deprecated': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
      case 'testing': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-zinc-400';
    }
  };

  const formatMetrics = (metrics: Model['metrics']) => {
    return Object.entries(metrics)
      .map(([key, val]) => `${key}=${val}`)
      .join(', ');
  };

  if (models.length === 0) {
    return (
      <div className="bg-[#1e293b] rounded-lg p-12 text-center border border-zinc-800">
        <p className="text-[#9ca3af]">Нет доступных моделей для данного типа</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b] rounded-lg border border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px] md:min-w-full">
          <thead className="bg-[#0f172a]/50 text-[#9ca3af] text-xs uppercase font-bold tracking-wider border-b border-zinc-800">
            <tr>
              <th className="px-4 md:px-6 py-4">Имя модели</th>
              <th className="px-4 md:px-6 py-4">Версия</th>
              <th className="px-4 md:px-6 py-4">Метрики</th>
              <th className="px-4 md:px-6 py-4">Статус</th>
              <th className="px-4 md:px-6 py-4">Дата обучения</th>
              <th className="px-4 md:px-6 py-4">Примечание</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {models.map((model) => (
              <tr 
                key={model.id}
                onClick={() => onSelectModel(model)}
                className={`cursor-pointer transition-colors ${
                  selectedModelId === model.id 
                    ? 'bg-[#38bdf8]/10' 
                    : 'hover:bg-[#0f172a]/30'
                }`}
              >
                <td className="px-4 md:px-6 py-4 font-medium text-[#e5e7eb] whitespace-nowrap">{model.name}</td>
                <td className="px-4 md:px-6 py-4 text-[#9ca3af] font-mono whitespace-nowrap">{model.version}</td>
                <td className="px-4 md:px-6 py-4 text-[#38bdf8] text-xs">{formatMetrics(model.metrics)}</td>
                <td className="px-4 md:px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-4 text-[#9ca3af] text-xs whitespace-nowrap">{model.trainedAt}</td>
                <td className="px-4 md:px-6 py-4 text-[#9ca3af] text-xs truncate max-w-[150px]">{model.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelListTable;
