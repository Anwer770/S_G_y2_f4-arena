import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value = 0,
  duration = 800,
  formatter,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const safeInitial = typeof value === 'number' && !isNaN(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState<number>(safeInitial);
  const startTimeRef = useRef<number | null>(null);
  const startValRef = useRef<number>(safeInitial);
  const targetValRef = useRef<number>(safeInitial);
  const reqIdRef = useRef<number | null>(null);

  useEffect(() => {
    const validTarget = typeof value === 'number' && !isNaN(value) ? value : 0;
    startValRef.current = typeof displayValue === 'number' && !isNaN(displayValue) ? displayValue : 0;
    targetValRef.current = validTarget;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValRef.current + (targetValRef.current - startValRef.current) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        reqIdRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValRef.current);
      }
    };

    reqIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
    };
  }, [value, duration]);

  const safeVal = typeof displayValue === 'number' && !isNaN(displayValue) ? displayValue : 0;
  const formattedText = formatter ? formatter(safeVal) : safeVal.toLocaleString('ar-YE');

  return (
    <span className={`inline-block font-mono tracking-tight transition-colors duration-200 ${className}`}>
      {prefix}
      {formattedText}
      {suffix}
    </span>
  );
};
