import React, { useState, useEffect } from 'react';
import { CustodyIssueRecord, CustodySection, CustodyPriority, CustodyStatus } from '../../types/custodyIssues';
import {
  X,
  Save,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Tag,
  Shield,
  Layers,
  Coins,
  Link2,
} from 'lucide-react';

interface CustodyIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<CustodyIssueRecord>) => void;
  initialRecord?: CustodyIssueRecord | null;
  defaultSection?: CustodySection;
  categories: string[];
  responsibles: string[];
  statuses: string[];
  priorities: string[];
}

export const CustodyIssueModal: React.FC<CustodyIssueModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  defaultSection = 'custody',
  categories,
  responsibles,
  statuses,
  priorities,
}) => {
  const [section, setSection] = useState<CustodySection>(defaultSection);
  const [date, setDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [cat, setCat] = useState<string>('عهدة');
  const [pri, setPri] = useState<CustodyPriority>('A');
  const [status, setStatus] = useState<CustodyStatus>('مخطط');
  const [resp, setResp] = useState<string>('انا');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('ريال يمني');
  const [notes, setNotes] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [isCorrupted, setIsCorrupted] = useState<boolean>(false);
  const [corruptedText, setCorruptedText] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialRecord) {
      setSection(initialRecord.section || 'custody');
      setDate(initialRecord.date || '');
      setName(initialRecord.name || '');
      setDesc(initialRecord.desc || '');
      setCat(initialRecord.cat || 'عهدة');
      setPri(initialRecord.pri || 'A');
      setStatus(initialRecord.status || 'مخطط');
      setResp(initialRecord.resp || 'انا');
      setAmount(initialRecord.amount !== undefined && initialRecord.amount > 0 ? String(initialRecord.amount) : '');
      setCurrency(initialRecord.currency || 'ريال يمني');
      setNotes(initialRecord.notes || '');
      setLink(initialRecord.link || '');
      setIsCorrupted(!!initialRecord.isCorruptedReference || (initialRecord.desc && initialRecord.desc.includes('Schedule!')));
      setCorruptedText(initialRecord.corruptedRefText || '');
    } else {
      setSection(defaultSection);
      setDate(new Date().toISOString().split('T')[0]);
      setName('');
      setDesc('');
      setCat(defaultSection === 'custody' ? 'عهدة' : 'مشكلة');
      setPri('A');
      setStatus('مخطط');
      setResp('انا');
      setAmount('');
      setCurrency('ريال يمني');
      setNotes('');
      setLink('');
      setIsCorrupted(false);
      setCorruptedText('');
    }
    setError('');
  }, [initialRecord, defaultSection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      setError('يرجى كتابة الوصف التفصيلي للسجل (حقل إلزامي)');
      return;
    }

    const cleanedDesc = desc.trim();
    const stillHasCorruptedRef = cleanedDesc.includes('Schedule!');

    const recordData: Partial<CustodyIssueRecord> = {
      ...(initialRecord?.id ? { id: initialRecord.id } : {}),
      section,
      date: date.trim(),
      name: name.trim(),
      desc: cleanedDesc,
      cat: cat.trim() || 'أخرى',
      pri,
      status: status.trim() || 'بدون حالة',
      resp: resp.trim() || 'غير محدد',
      amount: amount ? Number(amount) : 0,
      currency,
      notes: notes.trim(),
      link: link.trim(),
      isCorruptedReference: stillHasCorruptedRef,
      corruptedRefText: stillHasCorruptedRef ? (corruptedText || cleanedDesc) : '',
      updatedAt: new Date().toISOString(),
      ...(initialRecord?.createdAt ? { createdAt: initialRecord.createdAt } : { createdAt: new Date().toISOString() }),
    };

    onSave(recordData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {initialRecord ? 'تعديل سجل العهدة / الإشكالية' : 'إضافة سجل جديد في دفتر العهد والاشكاليات'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {initialRecord?.id ? `المعرف: ${initialRecord.id}` : 'وثق التفاصيل بدقة للمتابعة السلسة'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isCorrupted && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>تنبيه مرجع تالف:</strong> هذا السجل مستورد من Excel بمرجع معطوب ({corruptedText || 'Schedule!'}). يرجى استبدال الوصف بالنص الحقيقي الصحيح.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDesc('');
                  setIsCorrupted(false);
                }}
                className="bg-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-amber-300 transition cursor-pointer shrink-0"
              >
                مسح المرجع التالف
              </button>
            </div>
          )}

          {/* Section Selector */}
          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5">
              القسم الرئيسي <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSection('custody')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-bold ${
                  section === 'custody'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>العهد وحسابات (له/عليه/سندات)</span>
              </button>
              <button
                type="button"
                onClick={() => setSection('issues')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-bold ${
                  section === 'issues'
                    ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>الاشكاليات المعلقة (مرتجعات/تعويضات/فروقات)</span>
              </button>
            </div>
          </div>

          {/* Date & Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <Calendar className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                التاريخ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <User className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                الاسم / الصيدلية / العميل / الجهة
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صيدلية البركة / صدام / أمين العهدة"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Description (Required) */}
          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
              الوصف التفصيلي <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (!e.target.value.includes('Schedule!')) {
                  setIsCorrupted(false);
                }
              }}
              placeholder="اكتب تفاصيل العهدة، أرقام السندات، طبيعة الإشكالية أو الخلاف بالتفصيل..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 font-sans"
              required
            />
          </div>

          {/* Category, Priority & Responsible */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <Tag className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                الفئة / التصنيف
              </label>
              <input
                type="text"
                list="custody-categories-list"
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                placeholder="اختر أو اكتب فئة"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900"
              />
              <datalist id="custody-categories-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <Shield className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                الأولوية
              </label>
              <select
                value={pri}
                onChange={(e) => setPri(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 font-bold"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p === 'A'
                      ? 'A (عاجل جداً)'
                      : p === 'B'
                      ? 'B (عالي)'
                      : p === 'C'
                      ? 'C (متوسط)'
                      : p === 'D'
                      ? 'D (منخفض)'
                      : p === '√'
                      ? '√ (مكتمل / منجز)'
                      : p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <User className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                المسؤول
              </label>
              <input
                type="text"
                list="custody-responsibles-list"
                value={resp}
                onChange={(e) => setResp(e.target.value)}
                placeholder="انا، صدام، الفريق..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 font-bold"
              />
              <datalist id="custody-responsibles-list">
                {responsibles.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Status & Financial Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                الحالة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 font-bold"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <Coins className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                المبلغ المالي (إن وجد)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                العملة
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900"
              >
                <option value="ريال يمني">ريال يمني</option>
                <option value="دولار">دولار ($)</option>
                <option value="ريال سعودي">ريال سعودي (SAR)</option>
              </select>
            </div>
          </div>

          {/* Notes & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                ملاحظات إضافية
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات المتابعة أو الإجراءات القادمة"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                <Link2 className="w-3.5 h-3.5 inline ml-1 text-slate-400 dark:text-slate-500" />
                الرابط أو المستند المرجعي (URL)
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#059669] text-white rounded-lg font-black shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialRecord ? 'حفظ التعديلات' : 'إضافة السجل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
