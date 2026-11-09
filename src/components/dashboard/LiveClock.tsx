/**
 * ساعة اليوم الحيّة في رأس لوحة التحكم — مستخرجة من UnifiedDashboard.tsx (R30).
 */
import React, { useEffect, useState } from 'react';

export const LiveClock: React.FC = React.memo(() => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const day = now.toLocaleDateString('ar-YE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const time = now.toLocaleTimeString('ar-YE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setTimeStr(`${day} • ${time}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="font-mono text-xs">{timeStr || 'الثلاثاء، 8 سبتمبر • 12:16:26 م'}</span>;
});
