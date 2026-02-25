import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCommandPalette, GlobalCommandRegistrar } from '../../features/command/hooks';
import { CommandAction } from '../../features/command/store';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '../../core/utils';

const CommandPalette: React.FC = () => {
  const { isOpen, closePalette, actions } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredActions = useMemo(() => {
    if (!query) return actions;
    const lowerQuery = query.toLowerCase();
    return actions.filter(
      action =>
        action.title.toLowerCase().includes(lowerQuery) ||
        action.keywords?.toLowerCase().includes(lowerQuery) ||
        action.section.toLowerCase().includes(lowerQuery)
    );
  }, [actions, query]);

  const groupedActions: Record<string, CommandAction[]> = useMemo(() => {
    // Fix: Added a type assertion to the reduce accumulator to ensure TypeScript correctly infers the shape of the grouped actions object.
    return filteredActions.reduce((acc, action) => {
      if (!acc[action.section]) {
        acc[action.section] = [];
      }
      acc[action.section].push(action);
      return acc;
    }, {} as Record<string, CommandAction[]>);
  }, [filteredActions]);

  useEffect(() => {
    if (selectedIndex >= filteredActions.length) {
      setSelectedIndex(0);
    }
  }, [filteredActions, selectedIndex]);
  
  // Scroll selected item into view
  useEffect(() => {
      const selectedItem = resultsRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedItem?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filteredActions[selectedIndex];
      if (action) action.onSelect();
    } else if (e.key === 'Escape') {
      closePalette();
    }
  };

  if (!isOpen) return <GlobalCommandRegistrar />;

  let currentIndex = -1;

  return (
    <div 
        className="fixed inset-0 z-[200] flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-sm"
        onClick={closePalette}
    >
      <GlobalCommandRegistrar />
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800">
          <Search size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صفحة أو إجراء..."
            className="w-full bg-transparent outline-none text-base font-bold text-gray-800 dark:text-slate-100"
          />
        </div>

        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {Object.entries(groupedActions).map(([section, sectionActions]) => (
            <div key={section} className="mb-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1.5">{section}</h3>
              {sectionActions.map(action => {
                currentIndex++;
                const isSelected = currentIndex === selectedIndex;
                return (
                  <button
                    key={action.id}
                    data-index={currentIndex}
                    onClick={action.onSelect}
                    className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-right transition-colors",
                        isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                        <action.icon size={16} className={isSelected ? 'text-white' : 'text-gray-500'} />
                        <span className={cn("font-bold text-sm", isSelected ? 'text-white' : 'text-gray-800 dark:text-slate-200')}>{action.title}</span>
                    </div>
                    {isSelected && <CornerDownLeft size={16} className="text-blue-200" />}
                  </button>
                );
              })}
            </div>
          ))}
          {filteredActions.length === 0 && (
              <p className="text-center text-sm font-bold text-gray-400 py-10">لا توجد نتائج مطابقة</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
