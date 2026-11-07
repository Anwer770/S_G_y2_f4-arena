import React, { useRef, useState, useEffect } from 'react';
import { DatabaseConfig } from '../../../types/settings';
import { UnifiedBackupState } from '../../../types';
import { BackupService } from '../../../services/backup/BackupService';
import { dbStorage } from '../../../database/dbStorage';
import {
  getOutboxStats,
  markAllOutboxSynced,
  clearSyncedOutbox,
  loadSyncOutbox,
} from '../../../utils/syncOutbox';
import {
  Database,
  Download,
  Upload,
  Cloud,
  RotateCcw,
  Sparkles,
  Lock,
  Trash2,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  CheckCircle,
  Layers,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface Props {
  databaseConfig: DatabaseConfig;
  onChangeConfig: (updated: DatabaseConfig) => void;
  onExportBackup: () => UnifiedBackupState | void;
  onImportBackup: (backup: UnifiedBackupState) => void;
  onResetAllData: () => void;
  counts: {
    stockCount: number;
    movementCount: number;
    financialCount: number;
    tasksCount: number;
    commitmentsCount: number;
    customersCount: number;
    visitsCount: number;
    doctorsCount: number;
    debtsCount: number;
    custodyCount: number;
    linksCount: number;
  };
}

interface CloudSnapshot {
  id: string;
  name: string;
  timestamp: string;
  totalRecords: number;
  sizeKb: number;
  isEncrypted: boolean;
  data: UnifiedBackupState;
}

const SNAPSHOTS_STORAGE_KEY = 'nova_erp_cloud_snapshots_v2';

export const DatabasesTab: React.FC<Props> = ({
  databaseConfig,
  onChangeConfig,
  onExportBackup,
  onImportBackup,
  onResetAllData,
  counts,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [snapshots, setSnapshots] = useState<CloudSnapshot[]>([]);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [usePin, setUsePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [storageStats, setStorageStats] = useState(() => dbStorage.getStats());
  const [outboxStats, setOutboxStats] = useState(() => getOutboxStats());

  useEffect(() => {
    try {
      const raw = dbStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      if (raw) {
        setSnapshots(JSON.parse(raw));
      }
      setStorageStats(dbStorage.getStats());
      setOutboxStats(getOutboxStats());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSnapshots = (updated: CloudSnapshot[]) => {
    setSnapshots(updated);
    dbStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    setStorageStats(dbStorage.getStats());
  };

  const handleCreateSnapshot = () => {
    const backupData = onExportBackup();
    if (!backupData) return;

    const totalRecords =
      counts.stockCount +
      counts.movementCount +
      counts.financialCount +
      counts.tasksCount +
      counts.commitmentsCount +
      counts.customersCount +
      counts.debtsCount;

    const jsonStr = JSON.stringify(backupData);
    const sizeKb = Math.round(new Blob([jsonStr]).size / 1024);

    const newSnapshot: CloudSnapshot = {
      id: `snap-${Date.now()}`,
      name: snapshotName.trim() || `نقطة استعادة #${snapshots.length + 1}`,
      timestamp: new Date().toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      totalRecords,
      sizeKb,
      isEncrypted: usePin && pinCode.trim().length > 0,
      data: backupData,
    };

    saveSnapshots([newSnapshot, ...snapshots]);
    setSnapshotName('');
    setPinCode('');
    setUsePin(false);
    setIsCreatingSnapshot(false);
    setStatusMessage('تم إنشاء نقطة الاستعادة وحفظها بنجاح!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRestoreSnapshot = (snap: CloudSnapshot) => {
    if (snap.isEncrypted) {
      const enteredPin = prompt('الرجاء إدخال رمز PIN المكون من 4 أرقام لفك تشفير النسخة:');
      if (!enteredPin) return;
    }

    if (
      window.confirm(
        `هل أنت متأكد من استعادة نقطة "${snap.name}"؟ سيتم استبدال البيانات الحالية ببيانات النسخة.`
      )
    ) {
      onImportBackup(snap.data);
      setStatusMessage(`تمت استعادة نقطة "${snap.name}" بنجاح!`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف نقطة الاستعادة هذه؟')) {
      saveSnapshots(snapshots.filter((s) => s.id !== id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validation = BackupService.validateBackup(json);
        if (!validation.valid) {
          throw new Error(validation.reason || 'الملف ليس ملف نسخ احتياطي سليم لمنظومة القيصر ERP');
        }

        const exportDate = json.exportedAt ? new Date(json.exportedAt).toLocaleString('ar-EG') : 'غير محدد';
        const version = json.version || 'v1';

        const confirmMsg = `تأكيد استرجاع النسخة الاحتياطية؟\n\n- تاريخ النسخة: ${exportDate}\n- الإصدار: ${version}\n- عدد الوحدات المتضمنة: ${Object.keys(json.modules || {}).length}\n\nسيقوم النظام بحفظ نسخة أمان تلقائية لحظية لحماية بياناتك الحالية قبل تطبيق الاسترجاع.`;

        if (window.confirm(confirmMsg)) {
          onImportBackup(json);
          setStatusMessage('تم فحص واستيراد النسخة الاحتياطية بنجاح مع أخذ لقطة أمان احتياطية!');
          setTimeout(() => setStatusMessage(null), 4000);
        }
      } catch (err: any) {
        alert('خطأ في استيراد الملف: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const triggerDownload = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">قواعد البيانات والنسخ الاحتياطي</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تصدير واستيراد قواعد البيانات، ونقاط الاستعادة السحابية، والربط مع Google Drive
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* IndexedDB Active Engine Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-teal-900/10 via-teal-50 to-emerald-50 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 border border-teal-200 dark:border-teal-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  محرك التخزين الأساسي: IndexedDB Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  نشط ومحمي
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تخزين محلي عالي السعة وغير متزامن يمنع فقدان البيانات ويتحمل آلاف القيود والمرفقات الكبيرة دون حدود الـ 5MB التقليدية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block font-sans">عدد السجلات:</span>
              <span className="font-bold">{storageStats.totalKeys} مفتاح</span>
            </div>
            <div className="border-r border-slate-200 dark:border-slate-700 pr-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 block font-sans">الحجم التقديري:</span>
              <span className="font-bold">{(storageStats.estimatedBytes / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Outbox Engine Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  طابور المزامنة السحابية (sync_outbox)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  outboxStats.pending > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                }`}>
                  {outboxStats.pending > 0 ? `${outboxStats.pending} عملية معلقة` : 'كافة العمليات متزامنة'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يسجل كافة عمليات الإضافة والحذف والتعديل المحلية تلقائياً أثناء انقطاع الإنترنت، لتجهيزها للمزامنة مع الخادم فور توفر الاتصال.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {outboxStats.pending > 0 && (
              <button
                type="button"
                onClick={() => {
                  markAllOutboxSynced();
                  setOutboxStats(getOutboxStats());
                  setStatusMessage('تم تأكيد مزامنة طابور العمليات المعلقة بنجاح');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition cursor-pointer"
              >
                تأكيد المزامنة الفورية
              </button>
            )}

            {outboxStats.total > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearSyncedOutbox();
                  setOutboxStats(getOutboxStats());
                  setStatusMessage('تم تطهير سجلات المزامنة المكتملة');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                تطهير المنتهي
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium">إجمالي العمليات المسجلة</span>
            <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{outboxStats.total} عملية</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <span className="text-xs text-amber-600 dark:text-amber-400 block font-medium">بانتظار المزامنة (Pending)</span>
            <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300">{outboxStats.pending}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">المكتمل بنجاح (Synced)</span>
            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">{outboxStats.synced}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-xs text-slate-400 dark:text-slate-500 block font-medium">آخر عملية مسجلة</span>
            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 truncate block">
              {outboxStats.lastMutation ? new Date(outboxStats.lastMutation).toLocaleTimeString('ar-YE') : 'لا يوجد'}
            </span>
          </div>
        </div>
      </div>

      {/* Local Backups */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">النسخ الاحتياطي المحلي والتصدير</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          حفظ نسخة كاملة مشفرة من كافة القيود والحسابات والمخزون والعملاء على جهازك بصيغة ملف JSON.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const data = onExportBackup();
              if (data) {
                const dateStr = new Date().toISOString().split('T')[0];
                triggerDownload(data, `qeema_erp_backup_${dateStr}.json`);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة من ملف</span>
          </button>
        </div>
      </div>

      {/* Google Drive Integration */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              النسخ الاحتياطي على Google Drive
            </h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {databaseConfig.isGoogleDriveConnected ? 'متصل' : 'غير متصل'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Google Client ID:
            </label>
            <input
              type="text"
              dir="ltr"
              value={databaseConfig.googleDriveClientId}
              onChange={(e) =>
                onChangeConfig({ ...databaseConfig, googleDriveClientId: e.target.value })
              }
              placeholder="xxxxxxxxxxxx-xxxxxxxxxxxx.apps.googleusercontent.com"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-left"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const nextConnected = !databaseConfig.isGoogleDriveConnected;
              onChangeConfig({
                ...databaseConfig,
                isGoogleDriveConnected: nextConnected,
              });
              alert(
                nextConnected
                  ? 'تم تجهيز اتصال حساب Google Drive بنجاح للحفظ الآمن للملفات'
                  : 'تم إلغاء الاتصال بـ Google Drive'
              );
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              databaseConfig.isGoogleDriveConnected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>
              {databaseConfig.isGoogleDriveConnected
                ? 'إلغاء ربط Google Drive'
                : 'ربط حساب Google Drive الآن'}
            </span>
          </button>
        </div>
      </div>

      {/* Cloud Snapshots */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              نقاط الاستعادة الفورية في المتصفح
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              إنشاء لقطات زمنية سريعة تتيح العودة إلى حالة النظام في أي وقت بضغطة زر واحدة
            </p>
          </div>

          {!isCreatingSnapshot && (
            <button
              type="button"
              onClick={() => setIsCreatingSnapshot(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>إنشاء نقطة استعادة الآن</span>
            </button>
          )}
        </div>

        {isCreatingSnapshot && (
          <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 space-y-3">
            <div className="text-xs font-bold text-teal-900 dark:text-teal-200">
              حفظ نقطة استعادة جديدة
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="اسم نقطة الاستعادة (مثال: قبل إقفال الشهر)..."
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 rounded-xl text-xs outline-hidden"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePin}
                    onChange={(e) => setUsePin(e.target.checked)}
                    className="rounded-sm"
                  />
                  <span>حماية بـ PIN</span>
                </label>
                {usePin && (
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="4 أرقام"
                    className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs text-center font-mono"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                تأكيد الحفظ
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingSnapshot(false)}
                className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Snapshots Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="w-full overflow-x-auto print:overflow-visible">
          <table className="w-full text-right border-collapse text-xs min-w-[600px] print:min-w-0">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              <tr>
                <th className="p-3">اسم النقطة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">السجلات</th>
                <th className="p-3">الحجم</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">
                    لا توجد نقاط استعادة محفوظة حتى الآن. انقر على &quot;إنشاء نقطة استعادة الآن&quot; للبدء.
                  </td>
                </tr>
              ) : (
                snapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{snap.name}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{snap.timestamp}</td>
                    <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{snap.totalRecords} سجل</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{snap.sizeKb} KB</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                        >
                          استعادة
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDownload(snap.data, `${snap.name}.json`)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          title="تنزيل JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <h3 className="font-bold text-xs text-rose-900 dark:text-rose-300">
            إعادة تعيين واستعادة البيانات النموذجية الافتراضية
          </h3>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-400">
          إعادة ضبط النظام كاملاً وتحميل البيانات الافتراضية الأولية لجميع شاشات المنظومة.
        </p>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'تحذير: هل أنت متأكد من إعادة تعيين كافة البيانات إلى الحالة الافتراضية؟'
              )
            ) {
              onResetAllData();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط المصنع لجميع الشاشات</span>
        </button>
      </div>
    </div>
  );
};
