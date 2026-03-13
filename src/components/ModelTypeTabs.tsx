import React from 'react';
import { ModelType } from '../types/models';

interface ModelTypeTabsProps {
  activeTab: ModelType;
  onTabChange: (tab: ModelType) => void;
}

/**
 * Переключатель вкладок по типам моделей.
 */
const ModelTypeTabs: React.FC<ModelTypeTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ModelType; label: string }[] = [
    { id: "detector", label: "Детекторы" },
    { id: "tracker", label: "Трекинг" },
    { id: "process_engine", label: "ProcessEngine" },
    { id: "action", label: "Action" },
  ];

  return (
    <div className="flex border-b border-zinc-800 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 text-sm font-medium transition-all relative ${
            activeTab === tab.id 
              ? 'text-[#38bdf8]' 
              : 'text-[#9ca3af] hover:text-[#e5e7eb]'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8]"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ModelTypeTabs;
