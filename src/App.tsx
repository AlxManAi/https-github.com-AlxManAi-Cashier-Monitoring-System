/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, 
  AlertCircle, 
  History, 
  Settings, 
  Camera, 
  Cpu, 
  Terminal,
  ChevronRight,
  Filter,
  Info,
  Play,
  Clock,
  Layers,
  Upload,
  X,
  Database,
  Edit2,
  Download,
  Calendar,
  Search,
  Thermometer,
  Zap,
  Network,
  ShieldCheck,
  HardDrive,
  Video,
  Maximize2,
  ExternalLink,
  Tag,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModelsPanel from './components/ModelsPanel';
import LocalServerHealth from './components/LocalServerHealth';
import RealTimeAnalyzer from './components/RealTimeAnalyzer';
import ProcessGraphViewer from './components/ProcessGraphViewer';
import { useWebSocket, ConnectionStatus } from './hooks/useWebSocket';
import { SystemMetrics, ModelPerformance } from './types/models';

// --- Types ---
interface Incident {
  id: number | string;
  timestamp: string;
  cashier: string;
  operator: string;
  type: string;
  level: 'Critical' | 'High' | 'Medium';
  status: 'Новое' | 'В работе' | 'Ложное' | 'Закрыто';
  description?: string;
  videoUrl?: string;
  screenshotUrl?: string;
  detectedObjects?: string[];
}

interface NotebookData {
  incidents: Incident[];
  metadata?: {
    total: number;
    timestamp: string;
  };
}

// --- Helper Functions ---
const loadIncidentsFromJSON = async (file: File): Promise<Incident[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as NotebookData;
        if (json && Array.isArray(json.incidents)) {
          resolve(json.incidents);
        } else {
          reject(new Error('Неверный формат JSON: отсутствует массив incidents'));
        }
      } catch (err) {
        reject(new Error('Ошибка парсинга JSON файла'));
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
};

// --- Mock Data ---
const MOCK_INCIDENTS: Incident[] = [
  { 
    id: 1, 
    timestamp: '2026-03-06 12:45:12', 
    cashier: 'Касса №4', 
    operator: 'Иванов И.И.', 
    type: 'Выдача до проверки', 
    level: 'Critical', 
    status: 'Новое',
    description: 'Система зафиксировала выдачу наличных клиенту до завершения процедуры проверки документов. Вероятность нарушения: 98%.',
    screenshotUrl: 'https://picsum.photos/seed/incident1/800/450',
    detectedObjects: ['Client', 'Cashier', 'Banknote', 'Document']
  },
  { 
    id: 2, 
    timestamp: '2026-03-06 12:44:05', 
    cashier: 'Касса №2', 
    operator: 'Петров П.П.', 
    type: 'Нет проверки подлинности', 
    level: 'High', 
    status: 'В работе',
    description: 'Кассир пропустил этап проверки подлинности купюры крупного номинала через детектор.',
    screenshotUrl: 'https://picsum.photos/seed/incident2/800/450',
    detectedObjects: ['Banknote', 'Detector', 'Cashier']
  },
  { 
    id: 3, 
    timestamp: '2026-03-06 12:40:30', 
    cashier: 'Касса №1', 
    operator: 'Сидоров С.С.', 
    type: 'Подозрительная активность', 
    level: 'Medium', 
    status: 'Закрыто',
    description: 'Зафиксированы повторяющиеся движения рук в зоне кассового ящика без проведения транзакции.',
    screenshotUrl: 'https://picsum.photos/seed/incident3/800/450',
    detectedObjects: ['Cash Drawer', 'Hands']
  },
  { 
    id: 4, 
    timestamp: '2026-03-06 12:38:15', 
    cashier: 'Касса №4', 
    operator: 'Иванов И.И.', 
    type: 'Отмена операции без менеджера', 
    level: 'Critical', 
    status: 'Новое',
    description: 'Произведена полная отмена операции на сумму > 50000 руб. без авторизации старшего смены.',
    screenshotUrl: 'https://picsum.photos/seed/incident4/800/450',
    detectedObjects: ['Monitor', 'Receipt']
  },
  { 
    id: 5, 
    timestamp: '2026-03-06 12:35:00', 
    cashier: 'Касса №3', 
    operator: 'Кузнецов А.А.', 
    type: 'Лишняя купюра', 
    level: 'High', 
    status: 'Ложное',
    description: 'Детектор зафиксировал передачу средств, которые не были учтены в текущей операции.',
    screenshotUrl: 'https://picsum.photos/seed/incident5/800/450',
    detectedObjects: ['Banknote', 'Receipt']
  },
];

const MOCK_MODELS = [
  { name: 'CashierActionDetector', version: 'v2.4.1', map: 0.89, status: 'Active' },
  { name: 'DocumentOCR', version: 'v1.0.5', map: 0.94, status: 'Active' },
];

// --- Components ---

const Badge = ({ level }: { level: Incident['level'] }) => {
  const colors = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    Medium: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${colors[level]}`}>
      {level}
    </span>
  );
};

const MonitoringTab = ({ 
  onSwitchTab, 
  mode, 
  incidents,
  alertFlash,
  systemMetrics,
  modelPerf
}: { 
  onSwitchTab: (tab: string) => void, 
  mode: 'demo' | 'realtime',
  incidents: Incident[],
  alertFlash?: boolean,
  systemMetrics: SystemMetrics | null,
  modelPerf: ModelPerformance | null
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Always show the latest incident if none selected
  const activeIncident = selectedIncident || incidents[0];

  const stats = [
    { label: 'Инцидентов сегодня', value: incidents.length, icon: AlertCircle, color: 'text-red-400' },
    { label: 'Критических', value: incidents.filter(i => i.level === 'Critical').length, icon: Shield, color: 'text-orange-400' },
    { label: 'Нагрузка GPU', value: systemMetrics ? `${systemMetrics.gpu_load}%` : '24%', icon: Cpu, color: 'text-blue-400' },
    { label: 'FPS Анализа', value: modelPerf ? modelPerf.fps.toFixed(1) : '15.4', icon: Zap, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
            <div className={`p-2 bg-zinc-800 rounded-lg ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detailed View of Selected Incident */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Детали нарушения
            </h2>
            {activeIncident && (
              <div className="flex items-center gap-2">
                <Badge level={activeIncident.level} />
                <span className="text-xs text-zinc-500 font-mono">ID: {activeIncident.id}</span>
              </div>
            )}
          </div>

          {activeIncident ? (
            <div className={`bg-zinc-900 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${alertFlash ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-zinc-800'}`}>
              <div className="aspect-video relative bg-black group">
                <img 
                  src={activeIncident.screenshotUrl || `https://picsum.photos/seed/${activeIncident.id}/1280/720`} 
                  alt="Incident"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                
                {/* Overlay Info */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
                      <Clock className="w-3 h-3" />
                      {activeIncident.timestamp}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{activeIncident.type}</h3>
                    <p className="text-zinc-300 max-w-xl text-sm italic">
                      "{activeIncident.description || 'Обнаружено отклонение от стандартного протокола обслуживания.'}"
                    </p>
                  </div>
                  <button className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl shadow-blue-600/20 transition-transform hover:scale-110">
                    <Play className="w-6 h-6 fill-white" />
                  </button>
                </div>

                <div className="absolute top-6 right-6 flex flex-col gap-2">
                  <div className="px-3 py-1.5 bg-red-600/20 backdrop-blur-md border border-red-500/50 rounded text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                    Incident Detected
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-800">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Объект контроля</p>
                  <p className="text-sm font-medium text-zinc-200">{activeIncident.cashier}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Оператор ИИ</p>
                  <p className="text-sm font-medium text-zinc-200">{activeIncident.operator}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Статус</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-sm font-medium text-zinc-200">{activeIncident.status}</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex gap-2">
                  {activeIncident.detectedObjects?.map((obj, i) => (
                    <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400 border border-zinc-700">
                      {obj}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => onSwitchTab('incidents')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  Открыть в журнале
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
              <ShieldCheck className="w-16 h-16 opacity-20 mb-4" />
              <p>Инцидентов не зафиксировано</p>
            </div>
          )}
        </div>

        {/* Right: Live Feed of Incidents */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-red-400" />
              Лента событий
            </h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
              Live
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {incidents.map((incident) => (
              <motion.div 
                key={incident.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedIncident(incident)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:translate-x-1 ${
                  activeIncident?.id === incident.id 
                    ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge level={incident.level} />
                  <span className="text-[10px] text-zinc-500 font-mono">{incident.timestamp.split(' ')[1]}</span>
                </div>
                <h3 className={`text-sm font-bold truncate ${activeIncident?.id === incident.id ? 'text-blue-400' : 'text-zinc-200'}`}>
                  {incident.type}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-zinc-500">{incident.cashier}</span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Info className="w-3 h-3" />
                    Подробнее
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => onSwitchTab('incidents')}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-all border border-zinc-700 flex items-center justify-center gap-2"
          >
            Архив инцидентов
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const IncidentsTab = ({ incidents, onUpload }: { incidents: Incident[], onUpload: (data: Incident[]) => void }) => {
  const [levelFilter, setLevelFilter] = useState('Все');
  const [statusFilter, setStatusFilter] = useState('Все');
  const [typeFilter, setTypeFilter] = useState('Все');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const types = ['Все', ...Array.from(new Set(incidents.map(inc => inc.type)))];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await loadIncidentsFromJSON(file);
        onUpload(data);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Ошибка загрузки файла');
      }
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const levelMatch = levelFilter === 'Все' || inc.level === levelFilter;
    const statusMatch = statusFilter === 'Все' || inc.status === statusFilter;
    const typeMatch = typeFilter === 'Все' || inc.type === typeFilter;
    return levelMatch && statusMatch && typeMatch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Журнал инцидентов</h2>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
          >
            <Upload className="w-4 h-4" />
            Импорт JSON
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-zinc-900/50 p-3 sm:p-4 rounded-lg border border-zinc-800">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Фильтр по уровню</label>
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Все</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Фильтр по типу</label>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {types.map(type => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Фильтр по статусу</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Все</option>
            <option>Новое</option>
            <option>В работе</option>
            <option>Ложное</option>
            <option>Закрыто</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredIncidents.map((inc) => (
          <motion.div 
            key={inc.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative bg-zinc-900 rounded-xl border overflow-hidden transition-all hover:shadow-2xl hover:shadow-black/50 ${
              inc.level === 'Critical' ? 'border-red-500/30' : 
              inc.level === 'High' ? 'border-orange-500/30' : 'border-blue-500/30'
            }`}
          >
            {/* Severity Accent Line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              inc.level === 'Critical' ? 'bg-red-500' : 
              inc.level === 'High' ? 'bg-orange-500' : 'bg-blue-500'
            }`} />

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge level={inc.level} />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">#{inc.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{inc.type}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {inc.timestamp}
                    </div>
                    <div className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {inc.cashier}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                  inc.status === 'Новое' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                  inc.status === 'В работе' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                  inc.status === 'Закрыто' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {inc.status}
                </div>
              </div>

              {/* Media Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Screenshot */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 group/media">
                  <img 
                    src={inc.screenshotUrl || `https://picsum.photos/seed/${inc.id}/800/450`} 
                    alt="Incident Screenshot"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                    Screenshot
                  </div>
                </div>

                {/* Video Placeholder/Player */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center group/video">
                  <Video className="w-8 h-8 text-zinc-700 group-hover/video:text-blue-500 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 opacity-0 group-hover/video:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">
                    Video Feed
                  </div>
                </div>
              </div>

              {/* Description & Objects */}
              <div className="space-y-3">
                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed italic">
                  "{inc.description || 'Система зафиксировала отклонение от стандартного протокола обслуживания. Требуется проверка видеозаписи.'}"
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {inc.detectedObjects?.map((obj, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded-md text-[10px] text-zinc-400 border border-zinc-700/50">
                      <Tag className="w-2.5 h-2.5" />
                      {obj}
                    </span>
                  )) || (
                    ['Person', 'Cashier', 'Banknote'].map((obj, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded-md text-[10px] text-zinc-400 border border-zinc-700/50">
                        <Tag className="w-2.5 h-2.5" />
                        {obj}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-zinc-500">{inc.operator.charAt(0)}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{inc.operator}</span>
                </div>
                <button 
                  onClick={() => setSelectedIncident(inc)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all border border-zinc-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Детали
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-md p-6 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Badge level={selectedIncident.level} />
                  <h3 className="text-xl font-bold">Инцидент #{selectedIncident.id}</h3>
                </div>
                <button 
                  onClick={() => setSelectedIncident(null)} 
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Media Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Видеозапись инцидента</label>
                    <div className="aspect-video bg-black rounded-xl border border-zinc-800 flex items-center justify-center relative group overflow-hidden">
                      <Play className="w-16 h-16 text-white/20 group-hover:text-blue-500 transition-all group-hover:scale-110" />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button className="p-2 bg-black/60 rounded-lg border border-white/10 text-white hover:bg-black/80">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-black/60 rounded-lg border border-white/10 text-white hover:bg-black/80">
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ключевой кадр (Screenshot)</label>
                    <div className="aspect-video bg-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
                      <img 
                        src={selectedIncident.screenshotUrl || `https://picsum.photos/seed/${selectedIncident.id}/800/450`}
                        alt="Screenshot"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Время события</p>
                    <p className="text-sm font-medium text-zinc-200">{selectedIncident.timestamp}</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Локация / Касса</p>
                    <p className="text-sm font-medium text-zinc-200">{selectedIncident.cashier}</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Ответственный</p>
                    <p className="text-sm font-medium text-zinc-200">{selectedIncident.operator}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Аналитический отчет</h4>
                  </div>
                  <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-800">
                    <p className="text-zinc-300 leading-relaxed">
                      {selectedIncident.description || 'Система зафиксировала отклонение от стандартного протокола обслуживания. Требуется проверка видеозаписи за указанный период. Автоматический детектор действий кассира подтвердил нарушение с высокой степенью вероятности.'}
                    </p>
                  </div>
                </div>

                {/* Detected Objects */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Обнаруженные объекты</h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedIncident.detectedObjects?.map((obj, i) => (
                      <div key={i} className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-medium text-zinc-300">{obj}</span>
                      </div>
                    )) || (
                      ['Person', 'Cashier', 'Product'].map((obj, i) => (
                        <div key={i} className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-xs font-medium text-zinc-300">{obj}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                    Подтвердить нарушение
                  </button>
                  <button className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-all border border-zinc-700">
                    Ложное срабатывание
                  </button>
                  <button className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 rounded-xl font-bold transition-all border border-zinc-800">
                    Экспорт отчета
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TechTab = ({ mode, metrics }: { mode: 'demo' | 'realtime', metrics: SystemMetrics | null }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [gpuThresholdTemp, setGpuThresholdTemp] = useState(85);
  const [gpuThresholdVram, setGpuThresholdVram] = useState(20.0);
  const [cameras, setCameras] = useState([
    { id: '01', name: 'Касса №4 (Основная)', url: 'rtsp://admin:secret@192.168.1.104:554/stream1', status: 'active' },
    { id: '02', name: 'Касса №2 (Резерв)', url: 'rtsp://admin:secret@192.168.1.102:554/stream1', status: 'offline' },
    { id: '03', name: 'Входная группа', url: 'rtsp://admin:secret@192.168.1.103:554/stream1', status: 'active' },
  ]);
  const [editingCamera, setEditingCamera] = useState<string | null>(null);

  const handleSaveThresholds = async () => {
    try {
      const response = await fetch('/api/config/gpu/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp: gpuThresholdTemp, vram: gpuThresholdVram }),
      });
      if (response.ok) {
        alert('Пороги GPU успешно сохранены');
      }
    } catch (err) {
      console.error('Ошибка при сохранении порогов:', err);
    }
  };

  const handleUpdateCamera = async (id: string, newUrl: string) => {
    try {
      const response = await fetch('/api/config/camera/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, url: newUrl }),
      });
      if (response.ok) {
        setCameras(prev => prev.map(cam => cam.id === id ? { ...cam, url: newUrl } : cam));
        setEditingCamera(null);
      }
    } catch (err) {
      console.error('Ошибка при обновлении камеры:', err);
    }
  };

  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/logs/export?level=SECURITY');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename.split('/').pop();
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Лог-файл пуст или не найден на сервере.');
      }
    } catch (err) {
      console.error('Ошибка при экспорте логов:', err);
      alert('Ошибка при экспорте логов. Убедитесь, что бэкенд запущен.');
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          if (config.gpu_thresholds) {
            setGpuThresholdTemp(config.gpu_thresholds.temp);
            setGpuThresholdVram(config.gpu_thresholds.vram);
          }
          if (config.cameras) {
            setCameras(config.cameras);
          }
        }
      } catch (err) {
        console.log('Backend config not available, using defaults');
      }
    };
    fetchConfig();
  }, []);

  // Use real metrics if available, otherwise mock
  const gpuLoad = metrics?.gpu.load ?? 42;
  const gpuTemp = metrics?.gpu.temp ?? 64;
  const vramUsed = metrics?.gpu.vram_used ?? 8.4;
  const vramTotal = metrics?.gpu.vram_total ?? 24;
  const netIn = metrics?.network.in_mbps ?? 84;
  const storageUsed = metrics?.storage.used_gb ?? 7200;
  const storageTotal = metrics?.storage.total_gb ?? 10000;
  const storagePercent = Math.round((storageUsed / storageTotal) * 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Системный мониторинг</h2>
          <p className="text-sm text-zinc-500">Управление аппаратными ресурсами и подключениями</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Node:</span>
            <span className="text-[10px] font-mono text-blue-400">SRV-LOCAL-01</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Air-Gap Active</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: GPU PERFORMANCE (Priority 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Производительность GPU (RTX 4090)
          </h3>
          <span className="text-[10px] font-bold text-zinc-600 uppercase">Hardware ID: PCI-E 01:00.0</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* GPU Load */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Загрузка ядра</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{gpuLoad}%</span>
              <span className="text-xs text-blue-400 font-medium">Stable</span>
            </div>
            <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${gpuLoad}%` }}
                className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
              />
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Температура</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">{gpuTemp}°C</span>
              <span className="text-[10px] text-zinc-600 font-medium">Limit: 85°C</span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 12 }).map((_, i) => {
                const activeBars = Math.round((gpuTemp / 100) * 12);
                return (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < activeBars ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
                );
              })}
            </div>
          </div>

          {/* VRAM */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Видеопамять (VRAM)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{vramUsed.toFixed(1)} GB</span>
              <span className="text-[10px] text-zinc-600 font-medium">/ {vramTotal} GB</span>
            </div>
            <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${(vramUsed / vramTotal) * 100}%` }} />
            </div>
          </div>

          {/* FPS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">FPS Системы</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-400">28.4</span>
              <span className="text-[10px] text-zinc-600 font-medium">Avg per cam</span>
            </div>
            <div className="mt-3 flex items-end gap-0.5 h-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-1 bg-orange-500/30 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* GPU Thresholds Panel (Task 4.2 requirement) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Settings className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Пороги GPU</span>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-500">Критическая Temp</span>
                <span className="text-orange-500">{gpuThresholdTemp}°C</span>
              </div>
              <input 
                type="range" 
                className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                min="60" max="100"
                value={gpuThresholdTemp}
                onChange={(e) => setGpuThresholdTemp(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-500">Лимит VRAM (GB)</span>
                <span className="text-blue-500">{gpuThresholdVram.toFixed(1)} GB</span>
              </div>
              <input 
                type="range" 
                className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                min="8" max="24" step="0.5"
                value={gpuThresholdVram}
                onChange={(e) => setGpuThresholdVram(parseFloat(e.target.value))}
              />
            </div>
          </div>
          <button 
            onClick={handleSaveThresholds}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-lg transition-colors uppercase tracking-widest shrink-0 border border-zinc-700"
          >
            Сохранить
          </button>
        </div>
      </section>

      {/* SECTION 2: CONNECTIVITY & CAMERAS (Priority 2) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Camera Management (Micro Admin) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              Управление камерами
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">12 / 12 ONLINE</span>
              <button className="text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-blue-600/20">
                + ДОБАВИТЬ
              </button>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-zinc-800">
              {cameras.map((cam) => (
                <div key={cam.id} className="p-4 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 font-mono text-xs border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
                    {cam.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-200 truncate">{cam.name}</p>
                    {editingCamera === cam.id ? (
                      <input 
                        type="text"
                        className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-[10px] font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                        defaultValue={cam.url}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCamera(cam.id, (e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') setEditingCamera(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{cam.url}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
                      <span className={`text-[10px] font-bold uppercase ${cam.status === 'active' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {cam.status}
                      </span>
                    </div>
                    <button 
                      onClick={() => setEditingCamera(editingCamera === cam.id ? null : cam.id)}
                      className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Network & Infrastructure (Priority 3) */}
        <div className="space-y-6">
          {/* Network Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Network className="w-4 h-4 text-orange-500" />
              Локальная сеть
            </h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Входящий трафик:</span>
                <span className="text-sm font-mono font-bold text-white">{netIn} Mbps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">IP Подсеть:</span>
                <span className="text-sm font-mono text-zinc-300">192.168.10.x</span>
              </div>
              <div className="h-px bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Пакеты (Drop):</span>
                <span className="text-sm font-mono text-emerald-500">0.02%</span>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              Хранилище
            </h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-zinc-500">Заполнено: {(storageUsed / 1000).toFixed(1)} TB / {(storageTotal / 1000).toFixed(1)} TB</span>
                <span className="text-blue-400 font-bold">{storagePercent}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${storagePercent}%` }} />
              </div>
              <div className="mt-4 flex justify-between items-center text-[10px] uppercase font-bold">
                <span className="text-zinc-600 tracking-wider">Глубина архива:</span>
                <span className="text-zinc-300">30 дней</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ADVANCED LOGS (Priority 4) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            Системный журнал (Retention: 7 дней)
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Поиск по логам..." 
                className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-blue-500/50 w-40"
              />
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <select className="bg-transparent text-[10px] font-bold uppercase focus:outline-none cursor-pointer">
                <option>Сегодня</option>
                <option>Вчера</option>
                <option>18 Марта</option>
              </select>
            </div>
            <button 
              onClick={handleExportLogs}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-zinc-700"
            >
              <Download className="w-3.5 h-3.5" />
              Экспорт (JSONL)
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-black/40 font-mono text-[11px] text-zinc-400 space-y-1.5 h-64 overflow-y-auto custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 hover:bg-zinc-800/50 px-2 py-1 rounded transition-colors group">
                <span className="text-zinc-600 shrink-0 select-none">{i + 1}</span>
                <span className="text-zinc-500 shrink-0">[{new Date().toLocaleDateString()}]</span>
                <span className={log.includes('LIVE') ? 'text-blue-400' : 'text-zinc-400'}>{log}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-zinc-800/50 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Всего записей: 142,502</span>
            <span className="text-[10px] text-zinc-600 italic">Авто-очистка через 6 дней 22 часа</span>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [mode, setMode] = useState<'demo' | 'realtime'>('demo');
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [alertFlash, setAlertFlash] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [modelPerf, setModelPerf] = useState<ModelPerformance | null>(null);

  // WebSocket Configuration
  const wsUrl = (import.meta as any).env.VITE_WS_URL || 
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'NEW_INCIDENT') {
      const newIncident = message.data as Incident;
      setIncidents(prev => [newIncident, ...prev].slice(0, 100));
      setAlertFlash(true);
      setTimeout(() => setAlertFlash(false), 500);
    } else if (message.type === 'SYSTEM_METRICS') {
      setSystemMetrics(message.data);
    } else if (message.type === 'MODEL_PERFORMANCE') {
      setModelPerf(message.data);
    }
  }, []);

  const { status: wsStatus, sessionCount } = useWebSocket(wsUrl, handleWebSocketMessage);

  // Автоматическая загрузка данных при старте (если файл доступен на сервере)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/data.json');
        if (response.ok) {
          const data = await response.json() as NotebookData;
          if (data && Array.isArray(data.incidents)) {
            setIncidents(data.incidents);
            console.log('Данные успешно загружены из /data.json');
          }
        }
      } catch (err) {
        console.log('Автозагрузка /data.json не удалась, используем мок-данные');
      }
    };
    fetchInitialData();
  }, []);

  const handleAlert = useCallback((alert: { type: string; level: 'Critical' | 'High' | 'Medium'; cashier: string }) => {
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 500);

    const newIncident: Incident = {
      id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      cashier: alert.cashier,
      operator: 'AI System',
      type: alert.type,
      level: alert.level,
      status: 'Новое'
    };
    
    // Добавляем в начало списка
    setIncidents(prev => [newIncident, ...prev].slice(0, 50));
  }, []);

  const tabs = [
    { id: 'monitoring', label: 'Мониторинг', icon: Shield },
    { id: 'incidents', label: 'Инциденты', icon: History },
    { id: 'process', label: 'Процессы', icon: Database },
    { id: 'models', label: 'Модели', icon: Layers },
    { id: 'tech', label: 'Система', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#fafafa] font-sans selection:bg-blue-500/30">
      {/* Header / Nav */}
      <header className="border-b border-zinc-800 bg-[#0e1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xs xs:text-sm sm:text-base lg:text-lg font-bold tracking-tight whitespace-nowrap flex items-center gap-1">
                <span>CASHIER</span>
                <span className="hidden xs:inline">WATCH</span>
                <span className="text-blue-500 text-[8px] sm:text-[10px] font-mono ml-0.5 hidden xxs:inline">v2.4</span>
              </h1>
            </div>
            
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar mx-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-zinc-800 text-blue-400 shadow-lg shadow-black/20' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 min-w-[85px] sm:min-w-[110px]">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                  wsStatus === ConnectionStatus.OPEN ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  wsStatus === ConnectionStatus.CONNECTING ? 'bg-orange-500 animate-pulse' : 'bg-red-500'
                }`} />
                <div className="flex flex-col w-[60px] sm:w-[80px]">
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase leading-none truncate">
                    {wsStatus === ConnectionStatus.OPEN ? 'WS Connected' : 
                     wsStatus === ConnectionStatus.CONNECTING ? 'Connecting...' : 'WS Offline'}
                  </span>
                  {wsStatus === ConnectionStatus.OPEN ? (
                    <span className="text-[7px] sm:text-[8px] text-zinc-600 font-mono mt-0.5 truncate">
                      Sess: {sessionCount}
                    </span>
                  ) : (
                    <span className="text-[7px] sm:text-[8px] text-zinc-800 font-mono mt-0.5 truncate">
                      Status: {wsStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button 
                  onClick={() => setMode('demo')}
                  className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded-md transition-all ${mode === 'demo' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  DEMO
                </button>
                <button 
                  onClick={() => setMode('realtime')}
                  className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded-md transition-all ${mode === 'realtime' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  LIVE
                </button>
              </div>

              <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 shrink-0">
                <div className={`w-2 h-2 rounded-full ${mode === 'realtime' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter whitespace-nowrap">
                  {mode === 'realtime' ? 'Live System' : 'System Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 z-50 px-2 py-2">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-1 py-1.5 transition-colors ${
                activeTab === tab.id ? 'text-blue-400' : 'text-zinc-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium truncate max-w-[60px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'monitoring' && (
              <MonitoringTab 
                onSwitchTab={setActiveTab} 
                mode={mode} 
                incidents={incidents}
                alertFlash={alertFlash}
                systemMetrics={systemMetrics}
                modelPerf={modelPerf}
              />
            )}
            {activeTab === 'incidents' && (
              <IncidentsTab 
                incidents={incidents} 
                onUpload={(data) => setIncidents(data)} 
              />
            )}
            {activeTab === 'process' && <ProcessGraphViewer />}
            {activeTab === 'models' && <ModelsPanel performance={modelPerf} />}
            {activeTab === 'tech' && <TechTab mode={mode} metrics={systemMetrics} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 mt-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold">
            © 2026 Security Systems AI • Demo Prototype
          </p>
        </div>
      </footer>
    </div>
  );
}
