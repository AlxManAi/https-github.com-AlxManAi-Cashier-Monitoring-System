import React from 'react';
import { HardDrive, Thermometer, Zap, Database, Network, ShieldCheck } from 'lucide-react';

/**
 * Компонент мониторинга локального сервера.
 * Отображает специфичные для on-premise установки метрики.
 */
const LocalServerHealth: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Storage Health */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white">Хранилище архива</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Заполнено: 7.2 TB / 10 TB</span>
                <span className="text-blue-400 font-bold">72%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[72%]" />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Глубина архива:</span>
              <span className="text-zinc-200 font-mono">30 дней</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Retention Policy:</span>
              <span className="text-emerald-500 font-bold uppercase">Auto-Rotate</span>
            </div>
          </div>
        </div>

        {/* GPU / Hardware Acceleration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white">NVIDIA RTX 4090</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="block text-[9px] text-zinc-500 uppercase">Load</span>
                <span className="text-lg font-bold text-white">42%</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="block text-[9px] text-zinc-500 uppercase">Temp</span>
                <span className="text-lg font-bold text-emerald-400">64°C</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">VRAM Usage:</span>
              <span className="text-zinc-200 font-mono">8.4 GB / 24 GB</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Driver:</span>
              <span className="text-zinc-400 font-mono">535.129.03</span>
            </div>
          </div>
        </div>

        {/* Network & Cameras */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white">Локальная сеть</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">IP Камеры (ONVIF):</span>
              <span className="text-zinc-200 font-bold">12 / 12 Online</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Входящий трафик:</span>
              <span className="text-zinc-200 font-mono">84 Mbps</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Subnet:</span>
              <span className="text-zinc-400 font-mono">192.168.10.x</span>
            </div>
            <div className="pt-2">
              <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">
                Сканировать сеть
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Security & Offline Status */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-full">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-white">Режим "Air-Gap" Активен</h4>
            <p className="text-sm text-zinc-400">Система работает полностью автономно. Внешние соединения заблокированы.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase">Local SQLite Mode</span>
        </div>
      </div>
    </div>
  );
};

export default LocalServerHealth;
