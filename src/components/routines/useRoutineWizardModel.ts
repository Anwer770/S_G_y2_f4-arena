/**
 * نموذج معالج الروتين (R30) — الحالة والتحقق والمعالِجات، مستخرجة حرفياً
 * من `RoutineWizardModal.tsx` (نفس الترتيب ونفس الاعتماديات).
 */
import { useEffect, useState } from 'react';
import { RoutineRecord, RoutineStep } from '../../types/routines';
import { getAIRoutineOptimizationAdvice, minutesToTime, timeToMinutes } from '../../utils/routines';
import type { RoutineWizardModalProps } from './routineWizardConfig';
import { DAYS_OF_WEEK } from './routineWizardConfig';

export function useRoutineWizardModel(props: RoutineWizardModalProps) {
  const { isOpen, onClose, initialData, categories, tags, onSave } = props;

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

  return {
    priority,
    importance,
    completionRule,
    aiAdvice,
    categoryId,
    color,
    description,
    duration,
    frequency,
    goalIdsInput,
    handleAddStep,
    handleDayToggle,
    handleRemoveStep,
    handleSave,
    handleUpdateStep,
    icon,
    location,
    name,
    notifyOnLate,
    owner,
    planIdsInput,
    reminderOffset,
    remindersEnabled,
    selectedDays,
    selectedTags,
    setCategoryId,
    setColor,
    setCompletionRule,
    setDescription,
    setDuration,
    setGoalIdsInput,
    setIcon,
    setImportance,
    setLocation,
    setName,
    setNotifyOnLate,
    setOwner,
    setPlanIdsInput,
    setPriority,
    setReminderOffset,
    setRemindersEnabled,
    setSelectedTags,
    setShortName,
    setStartDate,
    setStartTime,
    setStep,
    setTaskIdsInput,
    setType,
    shortName,
    startDate,
    startTime,
    step,
    steps,
    taskIdsInput,
    type,
    isOpen,
    onClose,
    initialData,
    categories,
    tags,
    onSave,
  };
}

export type RoutineWizardModel = ReturnType<typeof useRoutineWizardModel>;
