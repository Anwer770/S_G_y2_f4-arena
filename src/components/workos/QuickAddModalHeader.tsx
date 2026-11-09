/**
 * رأس شاشة الإدخال السريع وتبويبات الأنواع (R30) — مستخرج من WorkOSQuickAddModal.tsx.
 */
import React from 'react';
import { Plus, X } from 'lucide-react';
import { INPUT_TABS } from './workosQuickAddConfig';

interface Props {
  activeType: string;
  setActiveType: (type: string) => void;
  onClose: () => void;
}

export const QuickAddModalHeader: React.FC<Props> = ({ activeType, setActiveType, onClose }) => (
  <>
    {/* Header Bar */}
    <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-[#0F3935] text-white rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>الشاشة الموحدة للإدخال السريع (+ Quick Add المركزية)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
              Work OS v3.0
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدخال مركزي متكامل مع الربط التلقائي بين الطلبيات والمهام والالتزامات المالية
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        title="إغلاق النافذة"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* 1. All Input Type Tabs: [ مهمة | مشروع | طلبية / طلب | التزام مالي | موعد | ملاحظة | هدف | عادة ] */}
    <div className="bg-slate-100/70 dark:bg-slate-800/50 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-thin">
      <div className="flex gap-1.5 min-w-max">
        {INPUT_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveType(item.id)}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#0F3935] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/70 bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  </>
);
