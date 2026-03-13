/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ModelsPanel from './components/ModelsPanel';
import LocalServerHealth from './components/LocalServerHealth';

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

const MonitoringTab = ({ onSwitchTab, mode }: { onSwitchTab: (tab: string) => void, mode: 'demo' | 'realtime' }) => {
  const [demoTime, setDemoTime] = useState(120);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* Left Column: Video */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Видеопоток: Касса №4
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'realtime' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
              {mode === 'realtime' ? 'LIVE • 1080p' : 'ARCHIVE • 1080p'}
            </span>
          </div>
        </div>
        
        <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative group">
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
            <iframe 
              src="https://drive.google.com/file/d/1fMF-zUDpuX9aWu1lwX7ki4Gx-r5NWR52/preview" 
              className="w-full h-full border-0"
              allow="autoplay"
              referrerPolicy="no-referrer"
            ></iframe>
          )}
          <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-green-400 border border-green-500/30 pointer-events-none">
            DETECTOR ACTIVE: 98% CONF
          </div>
        </div>

        {mode === 'demo' && (
          <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
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
        )}
      </div>

      {/* Right Column: Alerts */}
      <div className="lg:col-span-3 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          Активные алерты
        </h2>
        
        <div className="space-y-3">
          {MOCK_INCIDENTS.slice(0, 4).map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 bg-zinc-900 border border-zinc-800 transition-all hover:translate-x-1 ${
                alert.level === 'Critical' ? 'border-l-red-500' : 
                alert.level === 'High' ? 'border-l-orange-500' : 'border-l-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <Badge level={alert.level} />
                <span className="text-[10px] text-zinc-500 font-mono">{alert.timestamp.split(' ')[1]}</span>
              </div>
              <h3 className="text-sm font-medium text-zinc-200">{alert.type}</h3>
              <p className="text-xs text-zinc-500 mt-1">{alert.cashier}</p>
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

const IncidentsTab = () => {
  const [levelFilter, setLevelFilter] = useState('Все');
  const [statusFilter, setStatusFilter] = useState('Все');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const filteredIncidents = MOCK_INCIDENTS.filter(inc => {
    const levelMatch = levelFilter === 'Все' || inc.level === levelFilter;
    const statusMatch = statusFilter === 'Все' || inc.status === statusFilter;
    return levelMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Журнал инцидентов</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
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
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-widest border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3">Дата/время</th>
              <th className="px-4 py-3">Касса</th>
              <th className="px-4 py-3">Оператор</th>
              <th className="px-4 py-3">Тип нарушения</th>
              <th className="px-4 py-3">Уровень</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/20">
            {filteredIncidents.map((inc) => (
              <tr 
                key={inc.id} 
                className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() => setSelectedIncident(inc)}
              >
                <td className="px-4 py-3 font-mono text-zinc-400">{inc.timestamp}</td>
                <td className="px-4 py-3 text-zinc-300">{inc.cashier}</td>
                <td className="px-4 py-3 text-zinc-300">{inc.operator}</td>
                <td className="px-4 py-3 text-zinc-200">{inc.type}</td>
                <td className="px-4 py-3"><Badge level={inc.level} /></td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${
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
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">CASHIER WATCH <span className="text-blue-500 text-xs font-mono ml-1">v2.4</span></h1>
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

            <div className="flex items-center gap-6">
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button 
                  onClick={() => setMode('demo')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'demo' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  DEMO
                </button>
                <button 
                  onClick={() => setMode('realtime')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'realtime' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  REALTIME
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <div className={`w-2 h-2 rounded-full ${mode === 'realtime' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                  {mode === 'realtime' ? 'Live System' : 'System Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'monitoring' && <MonitoringTab onSwitchTab={setActiveTab} mode={mode} />}
            {activeTab === 'incidents' && <IncidentsTab />}
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
