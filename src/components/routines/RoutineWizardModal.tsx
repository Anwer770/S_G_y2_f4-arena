import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Tag,
  Folder,
  Layers,
  Plus,
  Trash2,
  Bell,
  Sparkles,
  Link,
  Target,
  FileText,
  User,
  MapPin,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  RoutineRecord,
  RoutineStep,
  RoutineCategoryItem,
  RoutineTagItem,
} from '../../types/routines';
import { minutesToTime, timeToMinutes, getAIRoutineOptimizationAdvice } from '../../utils/routines';

interface RoutineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RoutineRecord | null;
  categories: RoutineCategoryItem[];
  tags: RoutineTagItem[];
  onSave: (routine: RoutineRecord) => void;
}

const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-500', name: 'زمردي' },
  { id: 'blue', bg: 'bg-blue-500', name: 'أزرق' },
  { id: 'amber', bg: 'bg-amber-500', name: 'كهرماني' },
  { id: 'purple', bg: 'bg-purple-500', name: 'أرجواني' },
  { id: 'rose', bg: 'bg-rose-500', name: 'وردي' },
  { id: 'teal', bg: 'bg-teal-500', name: 'تيل' },
  { id: 'indigo', bg: 'bg-indigo-500', name: 'نيلي' },
];

const ICON_OPTIONS = ['🌅', '💼', '🤝', '💰', '🩺', '📊', '🌿', '⚡', '🌙', '🎯', '📚', '🏃‍♂️', '🔥', '🛡️', '📦'];

const DAYS_OF_WEEK = [
  { day: 6, label: 'السبت' },
  { day: 0, label: 'الأحد' },
  { day: 1, label: 'الاثنين' },
  { day: 2, label: 'الثلاثاء' },
  { day: 3, label: 'الأربعاء' },
  { day: 4, label: 'الخميس' },
  { day: 5, label: 'الجمعة' },
];

export const RoutineWizardModal: React.FC<RoutineWizardModalProps> = ({
  isOpen,
  onClose,
  initialData,
  categories,
  tags,
  onSave,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-work');
  const [icon, setIcon] = useState('🌅');
  const [color, setColor] = useState('emerald');
  const [owner, setOwner] = useState('الإدارة');
  const [location, setLocation] = useState('المكتب الرئيسي');

  // Recurrence
  const [type, setType] = useState<RoutineRecord['type']>('DAILY');
  const [frequency, setFrequency] = useState('يومي');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState(4);
  const [importance, setImportance] = useState(4);

  // Steps
  const [steps, setSteps] = useState<RoutineStep[]>([
    { id: 'stp-1', title: 'التهيئة وفحص المتطلبات', duration: 5, isRequired: true },
    { id: 'stp-2', title: 'تنفيذ النشاط الرئيسي للروتين', duration: 20, isRequired: true },
    { id: 'stp-3', title: 'تدوين الملاحظات والإغلاق', duration: 5, isRequired: false },
  ]);

  // Links
  const [goalIdsInput, setGoalIdsInput] = useState('');
  const [planIdsInput, setPlanIdsInput] = useState('');
  const [taskIdsInput, setTaskIdsInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderOffset, setReminderOffset] = useState<number>(10);
  const [notifyOnLate, setNotifyOnLate] = useState(true);
  const [completionRule, setCompletionRule] = useState<'ALL_STEPS' | 'REQUIRED_ONLY' | 'PERCENTAGE'>('REQUIRED_ONLY');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setShortName(initialData.shortName || '');
      setDescription(initialData.description || '');
      setCategoryId(initialData.categoryId || categories[0]?.id || 'cat-work');
      setIcon(initialData.icon || '🌅');
      setColor(initialData.color || 'emerald');
      setOwner(initialData.owner || 'الإدارة');
      setLocation(initialData.location || '');
      setType(initialData.type || 'DAILY');
      setFrequency(initialData.frequency || 'يومي');
      setSelectedDays(initialData.selectedDays || [6, 0, 1, 2, 3, 4]);
      setStartTime(initialData.startTime || '08:00');
      setDuration(initialData.duration || 30);
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setPriority(initialData.priority || 4);
      setImportance(initialData.importance || 4);
      setSteps(
        initialData.steps?.length
          ? initialData.steps
          : [{ id: 'stp-1', title: 'الخطوة الأولى', duration: 10, isRequired: true }]
      );
      setGoalIdsInput(initialData.goalIds?.join(', ') || '');
      setPlanIdsInput(initialData.planIds?.join(', ') || '');
      setTaskIdsInput(initialData.taskIds?.join(', ') || '');
      setSelectedTags(initialData.tags || []);
      setRemindersEnabled(initialData.reminderSettings?.enabled ?? true);
      setReminderOffset(initialData.reminderSettings?.offsetsMinutes?.[0] || 10);
      setNotifyOnLate(initialData.reminderSettings?.notifyOnLate ?? true);
      setCompletionRule(initialData.completionRule || 'REQUIRED_ONLY');
    } else {
      // Reset defaults
      setName('');
      setShortName('');
      setDescription('');
      setCategoryId(categories[0]?.id || 'cat-work');
      setIcon('🌅');
      setColor('emerald');
      setSteps([
        { id: 'stp-1', title: 'التهيئة وفحص المتطلبات', duration: 5, isRequired: true },
        { id: 'stp-2', title: 'تنفيذ النشاط الرئيسي للروتين', duration: 20, isRequired: true },
        { id: 'stp-3', title: 'تدوين الملاحظات والإغلاق', duration: 5, isRequired: false },
      ]);
      setStep(1);
    }
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  // Step Management
  const handleAddStep = () => {
    const newStep: RoutineStep = {
      id: `stp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: 'خطوة جديدة',
      duration: 5,
      order: steps.length + 1,
      isRequired: true,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (index: number, field: keyof RoutineStep, value: unknown) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    const selectedCategory = categories.find((c) => c.id === categoryId);
    const calculatedEndTime = minutesToTime(timeToMinutes(startTime) + duration);

    const routineRecord: RoutineRecord = {
      id: initialData?.id || `rtn-${Date.now()}`,
      code: initialData?.code || `RTN-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim() || 'روتين بدون اسم',
      shortName: shortName.trim() || name.trim().slice(0, 15),
      description: description.trim(),
      categoryId,
      categoryName: selectedCategory?.name || 'عام',
      type,
      frequency,
      selectedDays,
      startDate,
      startTime,
      endTime: calculatedEndTime,
      duration,
      priority,
      importance,
      status: initialData?.status || 'ACTIVE',
      isActive: initialData?.isActive ?? true,
      color,
      icon,
      owner,
      location,
      goalIds: goalIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      planIds: planIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      taskIds: taskIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      reminderSettings: {
        enabled: remindersEnabled,
        offsetsMinutes: [reminderOffset],
        notifyOnLate,
        notifyAtStart: true,
      },
      completionRule,
      steps: steps.map((s, idx) => ({ ...s, order: idx + 1 })),
      tags: selectedTags,
      currentStreak: initialData?.currentStreak || 0,
      longestStreak: initialData?.longestStreak || 0,
      totalExecutions: initialData?.totalExecutions || 0,
      completedExecutions: initialData?.completedExecutions || 0,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(routineRecord);
    onClose();
  };

  const aiAdvice = getAIRoutineOptimizationAdvice({
    id: 'draft',
    name,
    duration,
    startTime,
    steps,
    reminderSettings: { enabled: remindersEnabled, offsetsMinutes: [reminderOffset] },
  } as RoutineRecord);

  return (
    <div
      id="routine-wizard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-xl sm:rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[96vh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-xl backdrop-blur-sm">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? 'تعديل الروتين / العادة' : 'معالج إنشاء روتين ذكي جديد'}
              </h2>
              <p className="text-xs text-emerald-100">
                الخطوة {step} من 6 :{' '}
                {step === 1 && 'البيانات الأساسية والهوية'}
                {step === 2 && 'التكرار والجدولة الزمنية'}
                {step === 3 && 'هيكلة خطوات الروتين'}
                {step === 4 && 'الربط بالأهداف والمهام'}
                {step === 5 && 'التنبيهات والاستثناءات'}
                {step === 6 && 'المراجعة الذكية والاعتماد'}
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

        {/* Step Indicator Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          {[1, 2, 3, 4, 5, 6].map((st) => (
            <button
              key={st}
              onClick={() => setStep(st)}
              className={`flex items-center gap-1.5 font-bold transition px-2.5 py-1 rounded-lg ${
                step === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : step > st
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[11px] border border-current">
                {step > st ? '✓' : st}
              </span>
              <span className="hidden sm:inline">
                {st === 1 && 'الأساسية'}
                {st === 2 && 'الجدولة'}
                {st === 3 && 'الخطوات'}
                {st === 4 && 'الروابط'}
                {st === 5 && 'التنبيهات'}
                {st === 6 && 'المراجعة'}
              </span>
            </button>
          ))}
        </div>

        {/* Step Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الروتين / العادة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مراجعة وتخطيط أولويات يوم العمل"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم المختصر (للجداول والشارات)
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="مثال: انطلاقة العمل"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التصنيف الرئيسي
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف والهدف من الروتين
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ما الهدف الذي يحققه هذا الروتين؟ وما هي المعايير المتبعة؟"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                />
              </div>

              {/* Icon & Color Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الأيقونة التعبيرية
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition ${
                          icon === ic
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 scale-110'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اللون المميز
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-white transition ${
                          color === c.id ? 'ring-4 ring-slate-400 dark:ring-slate-600 scale-110' : ''
                        }`}
                        title={c.name}
                      >
                        {color === c.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المسؤول / المنفذ
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="مثال: الإدارة العامة، المحاسب"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المكان أو البيئة
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: المكتب الرئيسي، العيادات، المنزل"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Recurrence & Timing */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نمط التكرار
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as RoutineRecord['type'])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="DAILY">يومي (أو أيام مختارة)</option>
                    <option value="WEEKDAYS">أيام العمل الرسمية (السبت - الخميس)</option>
                    <option value="WEEKENDS">عطلة نهاية الأسبوع (الجمعة)</option>
                    <option value="WEEKLY">أسبوعي</option>
                    <option value="MONTHLY">شهري</option>
                    <option value="CUSTOM_INTERVAL">فاصل مخصص (كل N أيام)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ بدء الروتين
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Days Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الأيام النشطة للروتين
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSel = selectedDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => handleDayToggle(d.day)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                          isSel
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وقت البدء المخطط
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المدة التقديرية (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وقت الانتهاء التلقائي
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-200/70 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span>{minutesToTime(timeToMinutes(startTime) + duration)}</span>
                    <Clock size={16} className="text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Priority & Importance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مستوى الأولوية (1 - 5)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPriority(lvl)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${
                          priority === lvl
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        P{lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مستوى الأهمية الاستراتيجية
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setImportance(lvl)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${
                          importance === lvl
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        ⭐ {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Steps Breakdown */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    قائمة خطوات الروتين ({steps.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    قسّم الروتين إلى مهام متسلسلة صغيرة لرفع دقة الإنجاز والتنفيذ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                >
                  <Plus size={14} /> إضافة خطوة
                </button>
              </div>

              {/* Steps List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {steps.map((st, index) => (
                  <div
                    key={st.id || index}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                        placeholder="عنوان الخطوة..."
                        className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={st.duration}
                          onChange={(e) => handleUpdateStep(index, 'duration', Number(e.target.value))}
                          className="w-14 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center font-bold"
                        />
                        <span className="text-slate-500 dark:text-slate-400">د</span>
                      </div>
                      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={st.isRequired}
                          onChange={(e) => handleUpdateStep(index, 'isRequired', e.target.checked)}
                          className="rounded text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500"
                        />
                        إلزامي
                      </label>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>مجموع مدد الخطوات: {steps.reduce((sum, s) => sum + (s.duration || 0), 0)} دقيقة</span>
                <span>المدة المحددة للروتين: {duration} دقيقة</span>
              </div>
            </div>
          )}

          {/* STEP 4: Links & Tags */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوسوم والتصنيفات الدلالية
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => {
                    const isSel = selectedTags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSel) {
                            setSelectedTags(selectedTags.filter((tg) => tg !== t.name));
                          } else {
                            setSelectedTags([...selectedTags, t.name]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isSel
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-500" />
                  ربط الروتين بوحدات النظام الأخرى
                </h4>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    أرقام / معرفات الأهداف المرتبطة (مفصولة بفواصل):
                  </label>
                  <input
                    type="text"
                    value={goalIdsInput}
                    onChange={(e) => setGoalIdsInput(e.target.value)}
                    placeholder="مثال: G-01, G-02"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    أرقام الخطط والبرامج التشغيلية:
                  </label>
                  <input
                    type="text"
                    value={planIdsInput}
                    onChange={(e) => setPlanIdsInput(e.target.value)}
                    placeholder="مثال: P-01, P-04"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    معرفات المهام المتصلة:
                  </label>
                  <input
                    type="text"
                    value={taskIdsInput}
                    onChange={(e) => setTaskIdsInput(e.target.value)}
                    placeholder="مثال: TSK-001, TSK-004"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Reminders & Completion Rules */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Bell size={14} className="text-amber-500" />
                      تفعيل التنبيهات والإشعارات
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      إرسال تذكيرات صوتية وبصرية قبل موعد بدء الروتين.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                {remindersEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        التذكير المسبق قبل البدء بـ:
                      </label>
                      <select
                        value={reminderOffset}
                        onChange={(e) => setReminderOffset(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold outline-none"
                      >
                        <option value={5}>5 دقائق قبل البدء</option>
                        <option value={10}>10 دقائق قبل البدء</option>
                        <option value={15}>15 دقيقة قبل البدء</option>
                        <option value={30}>30 دقيقة قبل البدء</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnLate}
                          onChange={(e) => setNotifyOnLate(e.target.checked)}
                          className="rounded text-rose-600 dark:text-rose-400"
                        />
                        تنبيه فوري في حال تأخر بدء الروتين عن موعده
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Rule */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  معيار احتساب الإنجاز الكامل (Completion Rule)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCompletionRule('REQUIRED_ONLY')}
                    className={`p-3 rounded-xl border text-right transition ${
                      completionRule === 'REQUIRED_ONLY'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1">الخطوات الإلزامية فقط</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">يعتبر الروتين مكتملاً بمجرد إنهاء جميع الخطوات الإلزامية.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompletionRule('ALL_STEPS')}
                    className={`p-3 rounded-xl border text-right transition ${
                      completionRule === 'ALL_STEPS'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1">كافة الخطوات 100%</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">يتطلب إنهاء جميع الخطوات دون استثناء لأعلى دقة.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompletionRule('PERCENTAGE')}
                    className={`p-3 rounded-xl border text-right transition ${
                      completionRule === 'PERCENTAGE'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1">نسبة مئوية (70% فأعلى)</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">يكفي إنجاز الأغلبية العظمى لاحتساب الـ Streak.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & AI Optimization */}
          {step === 6 && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">{name || 'روتين بدون اسم'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {startTime} ({duration} دقيقة) • {categories.find((c) => c.id === categoryId)?.name} • {frequency}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {description || 'لا يوجد وصف تفصيلي.'}
                </div>
              </div>

              {/* AI Advice Panel */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                    المساعد الذكي: فحص جودة وتناسق الروتين
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                    درجة الجودة: {aiAdvice.score}%
                  </span>
                </div>

                <p className="text-xs text-indigo-800 dark:text-indigo-300">{aiAdvice.circadianAdvice}</p>

                {aiAdvice.tips.length > 0 && (
                  <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1 list-disc list-inside pt-1">
                    {aiAdvice.tips.map((tp, i) => (
                      <li key={i}>{tp}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
              >
                <ChevronRight size={16} /> السابق
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                التالي <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                id="btn-save-routine-wizard"
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95"
              >
                <Check size={16} /> {initialData ? 'حفظ التعديلات' : 'اعتماد وإنشاء الروتين'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
