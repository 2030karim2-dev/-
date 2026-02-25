
import React from 'react';
import { Maximize, Minimize, Sparkles, Droplet } from 'lucide-react';
import { useThemeStore } from '../../../lib/themeStore';

const EffectsCustomizer: React.FC = () => {
  const { draftSettings, setDraftRadius, setDraftShadowStrength } = useThemeStore();
  const { radius, shadowStrength } = draftSettings;
  
  const Placeholder: React.FC<{title: string}> = ({title}) => (
    <div className="text-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-amber-400" />
        <p className="text-[10px] font-bold text-gray-400">{title} - قريباً</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">استدارة الحواف (Border Radius)</h3>
          <div className="flex items-center gap-4">
            <Minimize size={16} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={radius}
              onChange={(e) => setDraftRadius(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <Maximize size={16} className="text-gray-400" />
          </div>
          <div className="text-center mt-3 text-xs font-mono text-gray-500">{radius}rem</div>

          <div className="mt-6 flex gap-4 justify-center items-end">
            <div style={{ borderRadius: `${radius}rem` }} className="w-20 h-20 bg-blue-500 shadow-lg transition-all"></div>
            <div style={{ borderRadius: `${radius}rem` }} className="w-16 h-16 bg-emerald-500 shadow-lg transition-all"></div>
            <div style={{ borderRadius: `${radius}rem` }} className="w-12 h-12 bg-rose-500 shadow-lg transition-all"></div>
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">كثافة الظل (Shadow Intensity)</h3>
          <div className="flex items-center gap-4">
            <Droplet size={16} className="text-gray-400 opacity-20" />
            <input
              type="range"
              min="0"
              max="0.25"
              step="0.01"
              value={shadowStrength}
              onChange={(e) => setDraftShadowStrength(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <Droplet size={16} className="text-gray-400" />
          </div>
          <div className="text-center mt-3 text-xs font-mono text-gray-500">{shadowStrength.toFixed(2)}</div>

          <div className="mt-6 flex gap-4 justify-center items-end">
            <div style={{ borderRadius: `${radius}rem` }} className="w-20 h-20 bg-white dark:bg-slate-800 shadow-lg transition-all"></div>
            <div style={{ borderRadius: `${radius}rem` }} className="w-16 h-16 bg-white dark:bg-slate-800 shadow-lg transition-all"></div>
            <div style={{ borderRadius: `${radius}rem` }} className="w-12 h-12 bg-white dark:bg-slate-800 shadow-lg transition-all"></div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-4">
         <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">تأثيرات إضافية</h3>
         <div className="grid md:grid-cols-2 gap-3">
            <Placeholder title="نمط الحركة (Animations)" />
         </div>
      </div>
    </div>
  );
};

export default EffectsCustomizer;
