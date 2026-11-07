import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running as an installed standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (!res) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition shadow-xs cursor-pointer select-none ${
          compact ? 'px-2.5 py-1 text-xs' : 'w-full justify-center px-3.5 py-2 text-xs'
        }`}
        title="تثبيت التطبيق على جهازك للعمل بدون إنترنت وبسرعة فائقة"
      >
        {isIOS ? (
          <Smartphone className="w-3.5 h-3.5 text-teal-200" />
        ) : (
          <Download className="w-3.5 h-3.5 text-teal-200" />
        )}
        <span>{compact ? 'تثبيت التطبيق' : 'تثبيت المنظومة على جهازك'}</span>
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

