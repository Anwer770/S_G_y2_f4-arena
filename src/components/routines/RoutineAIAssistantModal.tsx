import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { RoutineRecord } from '../../types/routines';
import { parseAIPromptToRoutine } from '../../utils/routines';

interface RoutineAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineGenerated: (routine: RoutineRecord) => void;
}

const SAMPLE_PROMPTS = [
  'روتين صباحي يومي لمطابقة الصندوق والسيولة النقدية والمبيعات في 15 دقيقة',
  'روتين تخطيط وجدولة زيارات الأطباء والصيادلة الأسبوعية صباح كل سبت لمدة 45 دقيقة',
  'روتين إغلاق وجرد مخزون الأصناف الحساسة مساء كل يوم عمل في 25 دقيقة',
  'روتين متابعة ديون وتحصيلات العملاء المستحقة كل أربعاء الساعة 10:00 صباحاً',
  'روتين تطوير مهني وقراءة للملاحظات والمعرفة المؤسسية لمدة 30 دقيقة يومياً',
];

export const RoutineAIAssistantModal: React.FC<RoutineAIAssistantModalProps> = ({
  isOpen,
  onClose,
  onRoutineGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<RoutineRecord | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (customPrompt?: string) => {
    const text = customPrompt || prompt;
    if (!text.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const routine = parseAIPromptToRoutine(text);
      setGeneratedRoutine(routine);
      setIsGenerating(false);
    }, 600);
  };

  const handleAccept = () => {
    if (generatedRoutine) {
      onRoutineGenerated(generatedRoutine);
      onClose();
    }
  };

  return (
    <div
      id="routine-ai-assistant-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-xl backdrop-blur-sm shadow-inner">
              <Sparkles size={22} className="text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                المساعد الذكي لتوليد وهندسة الروتينات (AI Routine Builder)
              </h2>
              <p className="text-xs text-indigo-100">
                اكتب ما تريد بلغتك الطبيعية، وسيقوم الذكاء الاصطناعي ببناء الروتين وتقسيم خطواته بدقة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              صف الروتين أو العادة التي تريد بناءها:
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: أريد روتين يومي صباحي لمدة 20 دقيقة لمراجعة توريدات الأصناف، ومطابقة السجل اليومي، وتوزيع المهام العاجلة على الفريق..."
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-28"
              />
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className="absolute left-3 bottom-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition"
              >
                {isGenerating ? (
                  <>
                    <Zap size={14} className="animate-spin" /> جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> توليد الروتين الآن
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              أمثلة سريعة جاهزة للاختيار:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="text-xs text-right font-medium p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition border border-slate-200 dark:border-slate-700"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Result Card */}
          {generatedRoutine && (
            <div className="p-4 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-sm">
                    {generatedRoutine.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {generatedRoutine.name}
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      {generatedRoutine.startTime} ({generatedRoutine.duration} دقيقة) • {generatedRoutine.categoryName} • {generatedRoutine.frequency}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                  <CheckCircle2 size={14} /> مقترح ذكي متكامل
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {generatedRoutine.description}
              </p>

              {/* Steps list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  الخطوات المقترحة ({generatedRoutine.steps?.length}):
                </h4>
                {generatedRoutine.steps?.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{step.title}</span>
                    </div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                      {step.duration} د
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            إلغاء
          </button>

          {generatedRoutine && (
            <button
              id="btn-accept-ai-routine"
              onClick={handleAccept}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <CheckCircle2 size={16} /> اعتماد وإضافة الروتين إلى الجدول
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
