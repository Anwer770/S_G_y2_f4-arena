import React, { useEffect } from 'react';
import type { WorkOSData } from '../../types/workos';
import { loadAutomations, loadTasks } from '../../utils/workos/workosLoaders';
import { onAutomationUpdated } from '../../utils/automation';

/**
 * مزامنة حالة «إدارة العمل» مع نتائج مشغّل الأتمتة (R31).
 *
 * المشغّل يكتب العدّادات وسجل التشغيل ومهام المتابعة في التخزين مباشرةً، وحالة React
 * تبقى قديمة؛ بلا هذه المزامنة يكتب أول حفظ تالٍ النسخة القديمة فوق النتائج.
 */
export function useAutomationSync(setData: React.Dispatch<React.SetStateAction<WorkOSData>>): void {
  useEffect(() => {
    return onAutomationUpdated(() => {
      setData((prev) => ({ ...prev, automations: loadAutomations(), tasks: loadTasks() }));
    });
  }, [setData]);
}
