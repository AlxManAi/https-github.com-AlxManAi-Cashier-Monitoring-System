import React, { useState } from 'react';
import { Model, ModelType } from '../types/models';
import ActiveModelsSummary from './ActiveModelsSummary';
import ModelTypeTabs from './ModelTypeTabs';
import ModelListTable from './ModelListTable';
import ModelDetails from './ModelDetails';
import SoftwareStackPanel from './SoftwareStackPanel';
import { Cpu, Layers } from 'lucide-react';

/**
 * Панель управления моделями и ПО (версии, статусы, метрики).
 * Основной контейнер раздела "Модели и конфигурации".
 */
const ModelsPanel: React.FC = () => {
  const [viewMode, setViewMode] = useState<'ml' | 'software'>('ml');
  const [activeTab, setActiveTab] = useState<ModelType>("detector");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Mock-данные моделей
  const MOCK_MODELS: Model[] = [
    // ... (keep existing mock models)
    {
      id: "det_1",
      name: "RTMDet",
      version: "v1.3",
      type: "detector",
      trainedAt: "2026-02-15 14:20",
      metrics: { mAP50: 0.82, f1: 0.75, latency: 45 },
      status: "active",
      notes: "Текущая рабочая модель. Оптимизирована под TensorRT."
    },
    {
      id: "det_2",
      name: "RTMDet",
      version: "v1.2",
      type: "detector",
      trainedAt: "2026-01-10 09:00",
      metrics: { mAP50: 0.79, f1: 0.72, latency: 42 },
      status: "deprecated",
      notes: "Предыдущая версия. Заменена на v1.3 из-за точности."
    },
    {
      id: "det_3",
      name: "YOLOv8-Nano",
      version: "v1.0",
      type: "detector",
      trainedAt: "2026-03-01 18:30",
      metrics: { mAP50: 0.75, f1: 0.68, latency: 15 },
      status: "candidate",
      notes: "Кандидат для мобильных устройств. Очень низкая задержка."
    },
    {
      id: "track_1",
      name: "ByteTrack",
      version: "v2.1",
      type: "tracker",
      trainedAt: "2026-02-20 11:15",
      metrics: { MOTA: 0.88, IDF1: 0.82 },
      status: "active",
      notes: "Основной трекер. Стабильная работа в толпе."
    },
    {
      id: "track_2",
      name: "OC-Sort",
      version: "v1.0",
      type: "tracker",
      trainedAt: "2026-03-05 10:00",
      metrics: { MOTA: 0.85, IDF1: 0.84 },
      status: "testing",
      notes: "Тестирование нового алгоритма устойчивости к окклюзиям."
    },
    {
      id: "pe_1",
      name: "FSM_Core",
      version: "v2.0",
      type: "process_engine",
      trainedAt: "2026-02-28 16:45",
      metrics: { rules_count: 12, avg_exec_ms: 2 },
      status: "active",
      notes: "Ядро логики контроля кассиров. Версия с поддержкой мульти-корзин."
    },
    {
      id: "pe_2",
      name: "FSM_Core",
      version: "v2.1-beta",
      type: "process_engine",
      trainedAt: "2026-03-06 12:00",
      metrics: { rules_count: 15, avg_exec_ms: 3 },
      status: "testing",
      notes: "Бета-версия с новыми правилами проверки весового товара."
    },
    {
      id: "act_1",
      name: "ActionRecog-3D",
      version: "v0.1",
      type: "action",
      trainedAt: "2026-03-04 14:00",
      metrics: { accuracy: 0.65 },
      status: "testing",
      notes: "Первая итерация распознавания действий (сканирование, упаковка)."
    }
  ];

  const filteredModels = MOCK_MODELS.filter(m => m.type === activeTab);

  const handleTabChange = (tab: ModelType) => {
    setActiveTab(tab);
    setSelectedModel(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-[#0f172a] min-h-screen text-[#e5e7eb]">
      <header className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Модели и конфигурации</h1>
          <p className="text-[#9ca3af] text-xs sm:text-sm">Управление версиями нейросетей и программным обеспечением системы.</p>
        </div>
        
        <div className="flex bg-[#1e293b] p-1 rounded-lg border border-[#334155] self-start md:self-auto">
          <button
            onClick={() => setViewMode('ml')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'ml' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            ML Модели
          </button>
          <button
            onClick={() => setViewMode('software')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'software' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            ПО и Сервисы
          </button>
        </div>
      </header>

      {viewMode === 'ml' ? (
        <div className="animate-in fade-in duration-500">
          {/* Сводка активных моделей */}
          <ActiveModelsSummary />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Левая часть: Табы и Таблица */}
            <div className="xl:col-span-2 space-y-4">
              <ModelTypeTabs activeTab={activeTab} onTabChange={handleTabChange} />
              <ModelListTable 
                models={filteredModels} 
                selectedModelId={selectedModel?.id || null}
                onSelectModel={setSelectedModel}
              />
            </div>

            {/* Правая часть: Детали */}
            <div className="xl:col-span-1">
              <ModelDetails model={selectedModel} />
            </div>
          </div>
        </div>
      ) : (
        <SoftwareStackPanel />
      )}
    </div>
  );
};

export default ModelsPanel;
