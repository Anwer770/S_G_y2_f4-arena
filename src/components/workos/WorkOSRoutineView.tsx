import React, { useState } from 'react';
import { DailyRoutineBlock, DailyReviewRecord } from '../../types/workos';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Plus,
  RotateCcw,
  Star,
  FileCheck,
  AlertCircle,
  Save,
} from 'lucide-react';

interface WorkOSRoutineViewProps {
  routine: DailyRoutineBlock[];
  reviews: DailyReviewRecord[];
  onUpdateRoutineBlockStatus: (id: string, status: any) => void;
  onAddRoutineBlock: (block: Omit<DailyRoutineBlock, 'id'>) => void;
  onSaveDailyReview: (review: DailyReviewRecord) => void;
}

export const WorkOSRoutineView: React.FC<WorkOSRoutineViewProps> = ({
  routine = [],
  reviews = [],
  onUpdateRoutineBlockStatus = (..._args: any[]) => {},
  onAddRoutineBlock = (..._args: any[]) => {},
  onSaveDailyReview = (..._args: any[]) => {},
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'review'>('routine');

  // Daily Review Form State
  const [plannedSummary, setPlannedSummary] = useState('');
  const [achievedSummary, setAchievedSummary] = useState('');
  const [blockersReason, setBlockersReason] = useState('');
  const [carryOverTomorrow, setCarryOverTomorrow] = useState('');
  const [rating, setRating] = useState(4);
  const [reviewNotes, setReviewNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New routine block state
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newCategory, setNewCategory] = useState<'work' | 'planning' | 'health' | 'learning' | 'review' | 'personal'>('work');

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeSlot || !newTitle) return;
    onAddRoutineBlock({
      timeSlot: newTimeSlot,
      title: newTitle,
      plannedActivity: newActivity,
      category: newCategory,
      status: 'planned',
    });
    setNewTimeSlot('');
    setNewTitle('');
    setNewActivity('');
    setIsAddingBlock(false);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    const newRev: DailyReviewRecord = {
      id: `rev_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      plannedSummary,
      achievedSummary,
      blockersReason,
      carryOverTomorrow,
      satisfactionRating: rating,
      reviewNotes,
    };
    onSaveDailyReview(newRev);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Sub Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'routine'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>الروتين اليومي المجدول</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'review'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>مراجعة نهاية اليوم (Daily Review)</span>
          </button>
        </div>

        {activeTab === 'routine' && (
          <button
            onClick={() => setIsAddingBlock(!isAddingBlock)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة فترة زمنية</span>
          </button>
        )}
      </div>

      {/* Routine Timeline View */}
      {activeTab === 'routine' && (
        <div className="space-y-4">
          {isAddingBlock && (
            <form onSubmit={handleCreateBlock} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-teal-300 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-teal-900">إضافة فترة روتين جديدة للجدول اليومي</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="الوقت (مثال: 08:00 - 09:30)"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="عنوان النشاط"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
                  required
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
                >
                  <option value="work">عمل تشغيلي</option>
                  <option value="planning">تخطيط وإدارة</option>
                  <option value="health">صحة ورياضة</option>
                  <option value="learning">تعلم وتطوير</option>
                  <option value="review">مراجعة وتقييم</option>
                </select>
              </div>
              <textarea
                placeholder="تفاصيل النشاط والمخرجات المتوقعة..."
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  حفظ الفترة
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingBlock(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {routine.map((block) => (
              <div
                key={block.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  block.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : block.status === 'postponed'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold shrink-0">
                    {block.timeSlot}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{block.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">{block.plannedActivity}</p>
                    {block.notes && (
                      <div className="mt-1 text-xs text-teal-700 dark:text-teal-300 font-medium">ملاحظة: {block.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => onUpdateRoutineBlockStatus(block.id, 'completed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      block.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    منفذ ✓
                  </button>
                  <button
                    onClick={() => onUpdateRoutineBlockStatus(block.id, 'postponed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      block.status === 'postponed'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    مؤجل
                  </button>
                  <button
                    onClick={() => onUpdateRoutineBlockStatus(block.id, 'planned')}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title="إعادة ضبط كمخطط"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Review Form */}
      {activeTab === 'review' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">مراجعة نهاية اليوم والمساءلة الذاتية (Daily Review)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              جلسة تقييم هادئة في ختام ساعات العمل: قياس الإنجاز، توثيق الدروس المستفادة، وتجهيز خطة الغد.
            </p>
          </div>

          <form onSubmit={handleSaveReview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">ماذا خططت لليوم؟</label>
                <textarea
                  rows={3}
                  value={plannedSummary}
                  onChange={(e) => setPlannedSummary(e.target.value)}
                  placeholder="الملخص الأولي للمهام والأهداف التي وُضعت صباحاً..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">ماذا أنجزت بالفعل؟ (النجاحات)</label>
                <textarea
                  rows={3}
                  value={achievedSummary}
                  onChange={(e) => setAchievedSummary(e.target.value)}
                  placeholder="سجل التحصيلات، المبيعات، الزيارات، أو المهام المكتملة اليوم..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">ماذا لم تنجز؟ ولماذا؟ (العقبات)</label>
                <textarea
                  rows={3}
                  value={blockersReason}
                  onChange={(e) => setBlockersReason(e.target.value)}
                  placeholder="الأسباب: انشغال طارئ، تأخر الرد من العميل، نقص بضاعة في المستودع..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">ماذا ينتقل كأولوية لصباح الغد؟</label>
                <textarea
                  rows={3}
                  value={carryOverTomorrow}
                  onChange={(e) => setCarryOverTomorrow(e.target.value)}
                  placeholder="3 مهام مركزية لبدء الغد بها فوراً..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">تقييمك لإنتاجية اليوم:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                تم حفظ مراجعة اليوم بنجاح وترحيل الأولويات للغد!
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>اعتماد وحفظ مراجعة اليوم</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
