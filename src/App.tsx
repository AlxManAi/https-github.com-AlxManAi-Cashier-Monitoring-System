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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModelsPanel from './components/ModelsPanel';
import LocalServerHealth from './components/LocalServerHealth';
import RealTimeAnalyzer from './components/RealTimeAnalyzer';

// --- Types ---
interface Incident {
  id: number;
  timestamp: string;
  cashier: string;
  operator: string;
  type: string;
  level: 'Critical' | 'High' | 'Medium';
  status: 'Новое' | 'В работе' | 'Ложное' | 'Закрыто';
}

// --- Mock Data ---
const MOCK_INCIDENTS: Incident[] = [
  { id: 1, timestamp: '2026-03-06 12:45:12', cashier: 'Касса №4', operator: 'Иванов И.И.', type: 'Выдача до проверки', level: 'Critical', status: 'Новое' },
  { id: 2, timestamp: '2026-03-06 12:44:05', cashier: 'Касса №2', operator: 'Петров П.П.', type: 'Нет проверки подлинности', level: 'High', status: 'В работе' },
  { id: 3, timestamp: '2026-03-06 12:40:30', cashier: 'Касса №1', operator: 'Сидоров С.С.', type: 'Подозрительная активность', level: 'Medium', status: 'Закрыто' },
  { id: 4, timestamp: '2026-03-06 12:38:15', cashier: 'Касса №4', operator: 'Иванов И.И.', type: 'Отмена чека без менеджера', level: 'Critical', status: 'Новое' },
  { id: 5, timestamp: '2026-03-06 12:35:00', cashier: 'Касса №3', operator: 'Кузнецов А.А.', type: 'Лишний товар', level: 'High', status: 'Ложное' },
  { id: 6, timestamp: '2026-03-06 12:30:22', cashier: 'Касса №2', operator: 'Петров П.П.', type: 'Недосдача', level: 'Medium', status: 'Закрыто' },
  { id: 7, timestamp: '2026-03-06 12:25:10', cashier: 'Касса №1', operator: 'Сидоров С.С.', type: 'Ошибка сканирования', level: 'Medium', status: 'В работе' },
  { id: 8, timestamp: '2026-03-06 12:20:05', cashier: 'Касса №4', operator: 'Иванов И.И.', type: 'Выдача до проверки', level: 'Critical', status: 'Новое' },
  { id: 9, timestamp: '2026-03-06 12:15:40', cashier: 'Касса №3', operator: 'Кузнецов А.А.', type: 'Нет проверки подлинности', level: 'High', status: 'Закрыто' },
  { id: 10, timestamp: '2026-03-06 12:10:15', cashier: 'Касса №2', operator: 'Петров П.П.', type: 'Подозрительная активность', level: 'Medium', status: 'Новое' },
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
  customVideoUrl, 
  setCustomVideoUrl,
  onAlert,
  incidents,
  alertFlash
}: { 
  onSwitchTab: (tab: string) => void, 
  mode: 'demo' | 'realtime',
  customVideoUrl: string | null,
  setCustomVideoUrl: (url: string | null) => void,
  onAlert: (alert: { type: string; level: 'Critical' | 'High' | 'Medium'; cashier: string }) => void,
  incidents: Incident[],
  alertFlash?: boolean
}) => {
  const [demoTime, setDemoTime] = useState(120);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (customVideoUrl) {
        URL.revokeObjectURL(customVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
      {/* Left Column: Video */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Видеопоток: Касса №4
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'realtime' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
            <span className="text-[10px] sm:text-xs text-zinc-500 font-mono uppercase tracking-wider">
              {mode === 'realtime' ? 'LIVE • 1080p' : 'ARCHIVE • 1080p'}
            </span>
          </div>
        </div>
        
        <div className={`aspect-video bg-zinc-900 rounded-lg overflow-hidden border relative group transition-colors duration-300 ${alertFlash ? 'border-red-500 ring-2 ring-red-500/50' : 'border-zinc-800'}`}>
          {mode === 'realtime' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                <Camera className="w-12 h-12 text-red-500 relative z-10" />
              </div>
              <p className="mt-4 text-sm font-medium text-zinc-300">Ожидание потока с камеры...</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Protocol: RTSP/ONVIF</p>
            </div>
          ) : (
            <RealTimeAnalyzer 
              videoUrl={customVideoUrl || "https://storage.googleapis.com/mediapipe-assets/business-person-working-on-laptop.mp4"} 
              isActive={mode === 'demo'} 
              onAlert={onAlert}
            />
          )}
          <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-green-400 border border-green-500/30 pointer-events-none z-20">
            DETECTOR ACTIVE: 98% CONF
          </div>
        </div>

        {mode === 'demo' && (
          <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Play className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">Демонстрационный архив</h3>
                  <p className="text-xs text-zinc-500">Анализ записанного видеоматериала</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="video/*" 
                  className="hidden" 
                />
                <button 
                  onClick={triggerFileSelect}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-medium transition-colors border border-zinc-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {customVideoUrl ? 'Сменить видео' : 'Загрузить свое видео'}
                </button>
                
                {customVideoUrl && (
                  <button 
                    onClick={() => {
                      if (customVideoUrl) URL.revokeObjectURL(customVideoUrl);
                      setCustomVideoUrl(null);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Сбросить"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Текущее время демо
                </label>
                <span className="text-sm font-mono text-blue-400">{formatTime(demoTime)} / 09:00</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="540" 
                value={demoTime} 
                onChange={(e) => setDemoTime(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Alerts */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          Активные алерты
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {incidents.slice(0, 4).map((alert) => (
            <div 
              key={alert.id}
              className={`p-3 sm:p-4 rounded-lg border-l-4 bg-zinc-900 border border-zinc-800 transition-all hover:translate-x-1 ${
                alert.level === 'Critical' ? 'border-l-red-500' : 
                alert.level === 'High' ? 'border-l-orange-500' : 'border-l-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <Badge level={alert.level} />
                <span className="text-[10px] text-zinc-500 font-mono">{alert.timestamp.split(' ')[1]}</span>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-zinc-200">{alert.type}</h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">{alert.cashier}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={() => onSwitchTab('incidents')}
          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          Показать все инциденты
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const IncidentsTab = ({ incidents }: { incidents: Incident[] }) => {
  const [levelFilter, setLevelFilter] = useState('Все');
  const [statusFilter, setStatusFilter] = useState('Все');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const filteredIncidents = incidents.filter(inc => {
    const levelMatch = levelFilter === 'Все' || inc.level === levelFilter;
    const statusMatch = statusFilter === 'Все' || inc.status === statusFilter;
    return levelMatch && statusMatch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Журнал инцидентов</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-zinc-900/50 p-3 sm:p-4 rounded-lg border border-zinc-800">
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

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800 -mx-4 sm:mx-0">
        <table className="w-full text-left text-xs sm:text-sm min-w-[600px] sm:min-w-0">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-[9px] sm:text-[10px] font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-3 sm:px-4 py-3">Дата/время</th>
              <th className="px-3 sm:px-4 py-3">Касса</th>
              <th className="hidden sm:table-cell px-4 py-3">Оператор</th>
              <th className="px-3 sm:px-4 py-3">Тип нарушения</th>
              <th className="px-3 sm:px-4 py-3">Уровень</th>
              <th className="px-3 sm:px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {filteredIncidents.map((inc) => (
              <tr 
                key={inc.id} 
                className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() => setSelectedIncident(inc)}
              >
                <td className="px-3 sm:px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">{inc.timestamp.split(' ')[1]}</td>
                <td className="px-3 sm:px-4 py-3 text-zinc-300">{inc.cashier}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-zinc-300">{inc.operator}</td>
                <td className="px-3 sm:px-4 py-3 text-zinc-200">{inc.type}</td>
                <td className="px-3 sm:px-4 py-3"><Badge level={inc.level} /></td>
                <td className="px-3 sm:px-4 py-3">
                  <span className={`text-[10px] sm:text-xs ${
                    inc.status === 'Новое' ? 'text-blue-400' : 
                    inc.status === 'В работе' ? 'text-orange-400' : 
                    inc.status === 'Закрыто' ? 'text-zinc-500' : 'text-red-400'
                  }`}>
                    {inc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details */}
      {selectedIncident && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Инцидент #{selectedIncident.id}</h3>
            <button onClick={() => setSelectedIncident(null)} className="text-zinc-500 hover:text-zinc-300">Закрыть</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Время: <span className="text-zinc-200">{selectedIncident.timestamp}</span></p>
              <p className="text-sm text-zinc-400">Объект: <span className="text-zinc-200">{selectedIncident.cashier}</span></p>
              <p className="text-sm text-zinc-400">Сотрудник: <span className="text-zinc-200">{selectedIncident.operator}</span></p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Нарушение: <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-blue-400">{selectedIncident.type}</code></p>
              <p className="text-sm text-zinc-400">Текущий статус: <span className="text-zinc-200">{selectedIncident.status}</span></p>
            </div>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded border border-zinc-700">
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong>Описание:</strong> Система зафиксировала отклонение от стандартного протокола обслуживания. 
              Требуется проверка видеозаписи за указанный период. Автоматический детектор действий кассира 
              подтвердил нарушение с вероятностью 94%.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const TechTab = ({ mode }: { mode: 'demo' | 'realtime' }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const newLogs = Array.from({ length: 10 }).map((_, i) => {
      const time = new Date().toLocaleTimeString();
      const prefix = mode === 'realtime' ? 'LIVE' : 'INFO';
      return `${prefix} 2026-03-06 ${time} Detector: processed frame ${1000 + i}`;
    });
    setLogs(newLogs);
  }, [mode]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Техническая панель</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Server ID:</span>
          <span className="text-[10px] font-mono text-blue-400">SRV-LOCAL-01</span>
        </div>
      </div>

      {/* Local Server Health Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-400 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Инфраструктура локального сервера
        </h3>
        <LocalServerHealth />
      </section>

      {/* System State */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">Состояние системы</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'realtime' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
            <span className="text-[10px] font-bold uppercase text-zinc-500">
              {mode === 'realtime' ? 'Realtime Processing' : 'Demo / Simulation'}
            </span>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Активных камер</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">1</span>
              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Режим</p>
            <span className="text-3xl font-bold text-white">{mode === 'realtime' ? 'Production' : 'Demo'}</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Задержка обработки</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">145 мс</span>
              <span className="text-xs text-green-500 font-medium">-12 мс</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 bg-zinc-800/50 border-b border-zinc-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium">Логи</span>
        </div>
        <div className="p-4 bg-black/40 font-mono text-xs text-zinc-400 space-y-1 max-h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="hover:bg-zinc-800/50 px-2 py-0.5 rounded transition-colors">
              {log}
            </div>
          ))}
        </div>
      </div>
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
    { id: 'monitoring', label: 'Мониторинг СБ', icon: Shield },
    { id: 'incidents', label: 'Журнал инцидентов', icon: History },
    { id: 'models', label: 'Модели и конфиги', icon: Layers },
    { id: 'tech', label: 'Тех.панель', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#fafafa] font-sans selection:bg-blue-500/30">
      {/* Header / Nav */}
      <header className="border-b border-zinc-800 bg-[#0e1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-600 p-1 sm:p-1.5 rounded-lg">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight">
                CASHIER <span className="hidden sm:inline">WATCH</span>
                <span className="text-blue-500 text-[10px] font-mono ml-1">v2.4</span>
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-zinc-800 text-blue-400 shadow-lg shadow-black/20' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-zinc-500'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-6">
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 scale-90 sm:scale-100">
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

              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <div className={`w-2 h-2 rounded-full ${mode === 'realtime' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                  {mode === 'realtime' ? 'Live System' : 'System Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 z-50 px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                activeTab === tab.id ? 'text-blue-400' : 'text-zinc-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label.split(' ')[0]}</span>
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
                customVideoUrl={customVideoUrl}
                setCustomVideoUrl={setCustomVideoUrl}
                onAlert={handleAlert}
                incidents={incidents}
                alertFlash={alertFlash}
              />
            )}
            {activeTab === 'incidents' && <IncidentsTab incidents={incidents} />}
            {activeTab === 'models' && <ModelsPanel />}
            {activeTab === 'tech' && <TechTab mode={mode} />}
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
