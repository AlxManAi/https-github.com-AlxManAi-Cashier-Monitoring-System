import React from 'react';
import { Server, Activity, RefreshCw, Terminal, Download } from 'lucide-react';

interface SoftwareComponent {
  id: string;
  name: string;
  version: string;
  status: 'running' | 'stopped' | 'updating' | 'error';
  uptime: string;
  cpu: string;
  ram: string;
  description: string;
}

const MOCK_COMPONENTS: SoftwareComponent[] = [
  {
    id: 'api_gw',
    name: 'API Gateway',
    version: 'v1.4.2',
    status: 'running',
    uptime: '12d 4h',
    cpu: '2.4%',
    ram: '128MB',
    description: 'Основной шлюз для обработки REST и WebSocket запросов.'
  },
  {
    id: 'streamer',
    name: 'Video Streamer',
    version: 'v2.1.0',
    status: 'running',
    uptime: '5d 12h',
    cpu: '15.8%',
    ram: '512MB',
    description: 'Сервис захвата и трансляции видеопотоков (WebRTC/HLS).'
  },
  {
    id: 'db_pg',
    name: 'PostgreSQL DB',
    version: '15.4',
    status: 'running',
    uptime: '45d 1h',
    cpu: '1.2%',
    ram: '1.2GB',
    description: 'Основное хранилище инцидентов и метаданных.'
  },
  {
    id: 'redis_cache',
    name: 'Redis Cache',
    version: '7.2',
    status: 'running',
    uptime: '45d 1h',
    cpu: '0.5%',
    ram: '256MB',
    description: 'Кэш для очередей уведомлений и сессий.'
  },
  {
    id: 'ml_inference',
    name: 'ML Inference Engine',
    version: 'v1.3.0',
    status: 'updating',
    uptime: '0m',
    cpu: '0%',
    ram: '0MB',
    description: 'Среда исполнения нейросетевых моделей (TensorRT).'
  },
  {
    id: 'monitoring',
    name: 'System Monitor',
    version: 'v1.0.5',
    status: 'error',
    uptime: '0m',
    cpu: '0%',
    ram: '0MB',
    description: 'Агент сбора метрик и логов системы.'
  }
];

const SoftwareStackPanel: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_COMPONENTS.map((comp) => (
          <div key={comp.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  comp.status === 'running' ? 'bg-green-500/10 text-green-400' :
                  comp.status === 'updating' ? 'bg-blue-500/10 text-blue-400' :
                  comp.status === 'error' ? 'bg-red-500/10 text-red-400' :
                  'bg-zinc-500/10 text-zinc-400'
                }`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{comp.name}</h3>
                  <span className="text-[10px] font-mono text-zinc-500">{comp.version}</span>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                comp.status === 'running' ? 'bg-green-500/20 text-green-400' :
                comp.status === 'updating' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                comp.status === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-zinc-500/20 text-zinc-400'
              }`}>
                {comp.status}
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-6 line-clamp-2 h-8">
              {comp.description}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-[#0f172a] p-2 rounded border border-[#334155]">
                <span className="block text-[9px] text-zinc-500 uppercase">Uptime</span>
                <span className="text-xs font-mono text-white">{comp.uptime}</span>
              </div>
              <div className="bg-[#0f172a] p-2 rounded border border-[#334155]">
                <span className="block text-[9px] text-zinc-500 uppercase">CPU</span>
                <span className="text-xs font-mono text-white">{comp.cpu}</span>
              </div>
              <div className="bg-[#0f172a] p-2 rounded border border-[#334155]">
                <span className="block text-[9px] text-zinc-500 uppercase">RAM</span>
                <span className="text-xs font-mono text-white">{comp.ram}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-[#334155]">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#0f172a] hover:bg-zinc-800 rounded text-xs font-medium transition-colors">
                <RefreshCw className="w-3 h-3" />
                Restart
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#0f172a] hover:bg-zinc-800 rounded text-xs font-medium transition-colors">
                <Terminal className="w-3 h-3" />
                Logs
              </button>
              <button className="p-2 bg-[#0f172a] hover:bg-zinc-800 rounded transition-colors group-hover:text-blue-400" title="Update version">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Global Actions */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-blue-500/20 p-3 rounded-full flex-shrink-0">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm md:text-base">Пакетное обновление системы</h4>
            <p className="text-xs md:text-sm text-zinc-400">Доступно обновление для 3 компонентов (v2.5.0 Stable)</p>
          </div>
        </div>
        <button className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 text-sm">
          Обновить весь стек
        </button>
      </div>
    </div>
  );
};

export default SoftwareStackPanel;
