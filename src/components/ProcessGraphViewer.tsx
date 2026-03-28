import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Edit2, 
  FileJson, 
  Download, 
  Plus, 
  Save, 
  X, 
  Copy, 
  Check,
  Star,
  ChevronRight,
  ChevronDown,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Node {
  id: string;
  label: string;
  type: 'start' | 'process' | 'end';
  x: number;
  y: number;
  mandatory?: boolean;
}

interface Edge {
  from: string;
  to: string;
}

interface Process {
  name: string;
  nodes: Node[];
  edges: Edge[];
}

interface MockProcesses {
  [key: string]: Process;
}

// --- Mock Data ---
const MOCK_PROCESSES: MockProcesses = {
  "currency_exchange": {
    "name": "Обмен валюты (v2.0)",
    "nodes": [
      { "id": "IDLE", "label": "Ожидание", "type": "start", "x": 30, "y": 150 },
      { "id": "RECEIVE_CASH", "label": "Прием наличных", "type": "process", "x": 150, "y": 150, "mandatory": true },
      { "id": "COUNTING", "label": "Пересчет", "type": "process", "x": 270, "y": 150, "mandatory": true },
      { "id": "CHECKING", "label": "Детектор", "type": "process", "x": 390, "y": 150, "mandatory": true },
      { "id": "PROCESSING", "label": "Оформление", "type": "process", "x": 510, "y": 150, "mandatory": true },
      { "id": "DISPENSING", "label": "Выдача", "type": "process", "x": 630, "y": 150 },
      { "id": "COMPLETE", "label": "Завершено", "type": "end", "x": 750, "y": 150 }
    ],
    "edges": [
      { "from": "IDLE", "to": "RECEIVE_CASH" },
      { "from": "RECEIVE_CASH", "to": "COUNTING" },
      { "from": "COUNTING", "to": "CHECKING" },
      { "from": "CHECKING", "to": "PROCESSING" },
      { "from": "PROCESSING", "to": "DISPENSING" },
      { "from": "DISPENSING", "to": "COMPLETE" },
      { "from": "COMPLETE", "to": "IDLE" }
    ]
  },
  "payment": {
    "name": "Оплата услуг",
    "nodes": [
      { "id": "start", "label": "Начало", "type": "start", "x": 50, "y": 150 },
      { "id": "select_service", "label": "Выбор услуги", "type": "process", "x": 180, "y": 150, "mandatory": true },
      { "id": "enter_data", "label": "Ввод данных", "type": "process", "x": 310, "y": 150, "mandatory": true },
      { "id": "payment_proc", "label": "Оплата", "type": "process", "x": 440, "y": 150, "mandatory": true },
      { "id": "receipt", "label": "Печать чека", "type": "process", "x": 570, "y": 150 },
      { "id": "end", "label": "Конец", "type": "end", "x": 700, "y": 150 }
    ],
    "edges": [
      { "from": "start", "to": "select_service" },
      { "from": "select_service", "to": "enter_data" },
      { "from": "enter_data", "to": "payment_proc" },
      { "from": "payment_proc", "to": "receipt" },
      { "from": "receipt", "to": "end" }
    ]
  },
  "card_topup": {
    "name": "Пополнение карты",
    "nodes": [
      { "id": "start", "label": "Начало", "type": "start", "x": 50, "y": 150 },
      { "id": "insert_card", "label": "Вставка карты", "type": "process", "x": 180, "y": 150, "mandatory": true },
      { "id": "pin_entry", "label": "Ввод PIN", "type": "process", "x": 310, "y": 150, "mandatory": true },
      { "id": "cash_deposit", "label": "Внесение купюр", "type": "process", "x": 440, "y": 150, "mandatory": true },
      { "id": "confirmation", "label": "Подтверждение", "type": "process", "x": 570, "y": 150 },
      { "id": "end", "label": "Конец", "type": "end", "x": 700, "y": 150 }
    ],
    "edges": [
      { "from": "start", "to": "insert_card" },
      { "from": "insert_card", "to": "pin_entry" },
      { "from": "pin_entry", "to": "cash_deposit" },
      { "from": "cash_deposit", "to": "confirmation" },
      { "from": "confirmation", "to": "end" }
    ]
  }
};

const ProcessGraphViewer: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>("currency_exchange");
  const [isEditing, setIsEditing] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentProcess = MOCK_PROCESSES[selectedKey];

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentProcess, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${selectedKey}_process.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showNotify("Файл JSON экспортирован");
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentProcess, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nodeWidth = 110;
  const nodeHeight = 50;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider truncate">Логика процессов</h3>
            <p className="text-[10px] text-zinc-500 truncate">Визуализация и настройка цепочек операций</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <select 
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none pr-8"
            >
              {Object.entries(MOCK_PROCESSES).map(([key, proc]) => (
                <option key={key} value={key}>{proc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700 w-full sm:w-auto">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                isEditing 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isEditing ? 'ГОТОВО' : 'ПРАВКА'}</span>
              <span className="xs:hidden">{isEditing ? 'OK' : 'ED'}</span>
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-0.5" />
            <button 
              onClick={() => setShowJsonModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <FileJson className="w-3.5 h-3.5" />
              JSON
            </button>
            <button 
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ЭКСПОРТ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] p-4 sm:p-8 min-h-[400px] flex items-center justify-center">
        <div className="min-w-fit h-full flex items-center justify-center">
          <svg viewBox="0 0 860 300" className="w-full h-auto max-w-[860px] drop-shadow-2xl" style={{ minWidth: '600px' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#52525b" />
            </marker>
          </defs>

          {/* Edges */}
          {currentProcess.edges.map((edge, i) => {
            const fromNode = currentProcess.nodes.find(n => n.id === edge.from);
            const toNode = currentProcess.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <line
                key={`edge-${i}`}
                x1={fromNode.x + nodeWidth}
                y1={fromNode.y + nodeHeight / 2}
                x2={toNode.x}
                y2={toNode.y + nodeHeight / 2}
                stroke="#3f3f46"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Nodes */}
          {currentProcess.nodes.map((node) => {
            const isStart = node.type === 'start';
            const isEnd = node.type === 'end';
            
            let color = "stroke-indigo-500/50 fill-indigo-500/10";
            let textColor = "text-indigo-400";
            
            if (isStart) {
              color = "stroke-emerald-500/50 fill-emerald-500/10";
              textColor = "text-emerald-400";
            } else if (isEnd) {
              color = "stroke-rose-500/50 fill-rose-500/10";
              textColor = "text-rose-400";
            }

            return (
              <g key={node.id} className="group cursor-default">
                <rect
                  x={node.x}
                  y={node.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  className={`${color} stroke-2 transition-all duration-300 group-hover:stroke-indigo-400`}
                />
                <text
                  x={node.x + nodeWidth / 2}
                  y={node.y + nodeHeight / 2 + 5}
                  textAnchor="middle"
                  className={`text-[11px] font-medium fill-current ${textColor}`}
                >
                  {node.label}
                </text>

                {node.mandatory && (
                  <g transform={`translate(${node.x + nodeWidth - 15}, ${node.y + 15})`}>
                    <path 
                      d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z" 
                      fill="#f59e0b" 
                      className="animate-pulse"
                    />
                  </g>
                )}

                {isEditing && !isStart && !isEnd && (
                  <g 
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => showNotify(`Узел "${node.label}" удален (demo)`)}
                  >
                    <circle cx={node.x + nodeWidth} cy={node.y} r="8" fill="#ef4444" />
                    <path d={`M${node.x + nodeWidth - 3} ${node.y - 3} L${node.x + nodeWidth + 3} ${node.y + 3} M${node.x + nodeWidth + 3} ${node.y - 3} L${node.x + nodeWidth - 3} ${node.y + 3}`} stroke="white" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        </div>

        {/* Edit Overlay Controls */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900 border border-zinc-700 p-2 rounded-xl shadow-2xl z-10"
            >
              <button 
                onClick={() => showNotify("Событие добавлено (demo)")}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                Добавить событие
              </button>
              <button 
                onClick={() => {
                  showNotify("Изменения сохранены (demo)");
                  setIsEditing(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
              >
                <Save className="w-4 h-4" />
                Сохранить
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-6 right-6 bg-zinc-800 border border-indigo-500/30 text-zinc-200 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-medium">{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Legend */}
      <div className="p-4 bg-zinc-900/40 border-t border-zinc-800 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Начало</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/50" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Процесс</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/50" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Конец</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Обязательно</span>
        </div>
      </div>

      {/* JSON Modal */}
      <AnimatePresence>
        {showJsonModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Process JSON: {currentProcess.name}</h3>
                </div>
                <button 
                  onClick={() => setShowJsonModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-[11px] font-mono text-indigo-300 bg-zinc-950 p-4 rounded-xl border border-zinc-800 leading-relaxed">
                  {JSON.stringify(currentProcess, null, 2)}
                </pre>
              </div>
              <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={handleCopyJson}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
                <button 
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProcessGraphViewer;
