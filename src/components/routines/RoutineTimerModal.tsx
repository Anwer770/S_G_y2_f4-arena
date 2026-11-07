import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Clock,
  Zap,
  CheckSquare,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  RoutineRecord,
  RoutineOccurrence,
  RoutineExecution,
  RoutineSession,
} from '../../types/routines';
import { formatTimerSeconds } from '../../utils/routines';

interface RoutineTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: RoutineRecord | null;
  occurrence: RoutineOccurrence | null;
  onComplete: (execution: RoutineExecution) => void;
}

export const RoutineTimerModal: React.FC<RoutineTimerModalProps> = ({
  isOpen,
  onClose,
  routine,
  occurrence,
  onComplete,
}) => {
  const totalDurationSeconds = ((routine?.duration) || 30) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDurationSeconds);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepCompletion, setStepCompletion] = useState<{ [stepId: string]: boolean }>({});
  const [sessions, setSessions] = useState<RoutineSession[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<string>(new Date().toISOString());

  // Post-completion rating state
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [focusLevel, setFocusLevel] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(2);
  const [rating, setRating] = useState<number>(5);
  const [executionNotes, setExecutionNotes] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize step completion from occurrence if exists
  useEffect(() => {
    if (!isOpen || !routine) return;

    if (occurrence?.stepProgress) {
      const map: { [stepId: string]: boolean } = {};
      occurrence.stepProgress.forEach((p) => {
        map[p.stepId] = p.isCompleted;
      });
      setStepCompletion(map);
    } else {
      const map: { [stepId: string]: boolean } = {};
      routine.steps?.forEach((s) => {
        map[s.id] = false;
      });
      setStepCompletion(map);
    }
    setSecondsRemaining((routine.duration || 30) * 60);
    setSecondsElapsed(0);
    setIsRunning(true);
    setCurrentSessionStart(new Date().toISOString());
    setIsFinishing(false);
  }, [routine, occurrence, isOpen]);

  // Timer Tick Engine
  useEffect(() => {
    if (!isOpen || !routine) return;

    if (isRunning && !isFinishing) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isFinishing, isOpen, routine]);

  if (!isOpen || !routine) return null;

  const handleTogglePlayPause = () => {
    const now = new Date().toISOString();
    if (isRunning) {
      // Pause current session
      const newSession: RoutineSession = {
        id: `sess-${Date.now()}`,
        executionId: '',
        startedAt: currentSessionStart,
        endedAt: now,
        duration: Math.max(1, Math.round((new Date(now).getTime() - new Date(currentSessionStart).getTime()) / 1000)),
        status: 'paused',
      };
      setSessions((prev) => [...prev, newSession]);
      setIsRunning(false);
    } else {
      // Resume new session
      setCurrentSessionStart(now);
      setIsRunning(true);
    }
  };

  const handleToggleStep = (stepId: string) => {
    setStepCompletion((prev) => {
      const nextVal = !prev[stepId];
      const updated = { ...prev, [stepId]: nextVal };

      // Play subtle chime sound effect via Web Audio API if enabled
      if (nextVal && soundEnabled) {
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } catch {
          // ignore
        }
      }
      return updated;
    });
  };

  const handleFinishPrompt = () => {
    setIsRunning(false);
    setIsFinishing(true);
  };

  const handleFinalSave = () => {
    const now = new Date().toISOString();
    const finalSession: RoutineSession = {
      id: `sess-final-${Date.now()}`,
      executionId: '',
      startedAt: currentSessionStart,
      endedAt: now,
      duration: Math.max(1, Math.round((new Date(now).getTime() - new Date(currentSessionStart).getTime()) / 1000)),
      status: 'completed',
    };
    const allSessions = [...sessions, finalSession];

    const completedStepsCount = Object.values(stepCompletion).filter(Boolean).length;
    const totalStepsCount = routine.steps?.length || 1;
    const completionRate = Math.round((completedStepsCount / totalStepsCount) * 100);

    const actualDurationMinutes = Math.max(1, Math.round(secondsElapsed / 60));

    const todayDateStr = new Date().toISOString().split('T')[0];

    const execution: RoutineExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      routineId: routine.id,
      routineName: routine.name,
      occurrenceId: occurrence?.id || `occ-${todayDateStr}-${routine.id}`,
      date: occurrence?.date || todayDateStr,
      plannedStart: routine.startTime || '08:00',
      plannedEnd: routine.endTime || '08:30',
      actualStart: allSessions[0]?.startedAt || now,
      actualEnd: now,
      plannedDuration: routine.duration || 30,
      actualDuration: actualDurationMinutes,
      status: completionRate >= 70 ? 'COMPLETED' : 'PARTIALLY_COMPLETED',
      completionRate,
      completedStepsCount,
      totalStepsCount,
      skippedStepsCount: totalStepsCount - completedStepsCount,
      postponeCount: occurrence?.postponeCount || 0,
      pauseCount: sessions.length,
      energyLevel,
      focusLevel,
      difficultyLevel,
      rating,
      notes: executionNotes,
      sessions: allSessions,
      createdAt: now,
      updatedAt: now,
    };

    onComplete(execution);
    onClose();
  };

  const steps = routine.steps || [];
  const completedSteps = Object.values(stepCompletion).filter(Boolean).length;
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const timerPercent = Math.min(100, Math.round((secondsElapsed / Math.max(1, totalDurationSeconds)) * 100));

  return (
    <div
      id="routine-timer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 dark:bg-slate-900/20 flex items-center justify-center text-2xl backdrop-blur-sm">
              {routine.icon || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 dark:bg-slate-900/20 text-white">
                  جلسة تركيز حية
                </span>
                <span className="text-xs text-emerald-100">{routine.categoryName}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">{routine.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg transition"
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!isFinishing ? (
          /* Active Timer Screen */
          <div className="p-6 space-y-6">
            {/* Circular Timer & Controls */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="text-emerald-500 transition-all duration-500 ease-out"
                    strokeWidth="8"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * timerPercent) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-slate-800 dark:text-white font-mono tracking-tight">
                    {formatTimerSeconds(secondsRemaining)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    المستغرق: {formatTimerSeconds(secondsElapsed)}
                  </span>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  id="btn-timer-toggle"
                  onClick={handleTogglePlayPause}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition active:scale-95 ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause size={18} /> إيقاف مؤقت
                    </>
                  ) : (
                    <>
                      <Play size={18} /> استئناف الروتين
                    </>
                  )}
                </button>

                <button
                  id="btn-timer-finish"
                  onClick={handleFinishPrompt}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md transition active:scale-95"
                >
                  <CheckCircle2 size={18} /> إنهاء وتوثيق
                </button>
              </div>
            </div>

            {/* Steps Progress Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={16} className="text-emerald-500" />
                  قائمة خطوات الروتين
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {completedSteps} من {steps.length} منجزة ({progressPercent}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Step items checklist */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {steps.map((st, idx) => {
                  const isChecked = !!stepCompletion[st.id];
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        handleToggleStep(st.id);
                      }}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : isCurrent
                          ? 'bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-emerald-600 dark:text-emerald-400">
                          {isChecked ? <CheckCircle2 size={20} className="fill-emerald-500 text-white" /> : <Square size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <span className={`text-sm font-medium ${isChecked ? 'line-through opacity-80' : ''}`}>
                              {st.title}
                            </span>
                            {st.isRequired && (
                              <span className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/40 px-1.5 py-0.5 rounded">
                                إلزامي
                              </span>
                            )}
                          </div>
                          {st.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mr-7">
                              {st.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {st.duration} د
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Post-Execution Rating Screen */
          <div className="p-6 space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl mx-auto flex items-center justify-center text-3xl shadow-inner">
                <Award size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                رائع! تم استكمال جلسة الروتين بنجاح
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                استغرقت {Math.max(1, Math.round(secondsElapsed / 60))} دقيقة، وأنجزت {completedSteps} من أصل {steps.length} خطوات.
              </p>
            </div>

            {/* Metrics Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Zap size={14} className="text-amber-500" /> مستوى الطاقة:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{energyLevel} / 5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-indigo-500" /> مستوى التركيز:
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{focusLevel} / 5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focusLevel}
                  onChange={(e) => setFocusLevel(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ملاحظات ونتائج التنفيذ:
              </label>
              <textarea
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                placeholder="اكتب أية ملاحظات، أرقام، أو أفكار طرأت أثناء تنفيذ هذا الروتين..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-24"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishing(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                العودة للمؤقت
              </button>
              <button
                id="btn-save-execution"
                type="button"
                onClick={handleFinalSave}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg transition active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> حفظ في سجل التنفيذ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
