import React, { useRef, useState, useEffect } from 'react';
import { Customer, CustomerVisitRecord } from '../../types';
import {
  X,
  Printer,
  Calendar,
  DollarSign,
  Share2,
  Copy,
  Check,
  Phone,
  FileText,
  Smartphone,
  QrCode as QrIcon,
  Receipt,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  visits: CustomerVisitRecord[];
}

export const CustomerStatementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customer,
  visits,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [printMode, setPrintMode] = useState<'a4' | 'thermal80'>('a4');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [customPhone, setCustomPhone] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);

  useEffect(() => {
    if (customer) {
      setCustomPhone(customer.phone || '');
    }
  }, [customer]);

  const customerVisits = customer ? visits.filter((v) => v.customerId === customer.id) : [];

  const printDate = new Date().toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printTime = new Date().toLocaleTimeString('ar-YE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Generate QR Code for 80mm Thermal Receipt (Containing verification info)
  useEffect(() => {
    if (!customer) return;
    const qrPayload = JSON.stringify({
      org: 'NOVA_ERP',
      source: customer.source,
      clientId: customer.id,
      clientName: customer.name,
      balanceYER: customer.balanceYER || 0,
      balanceSAR: customer.balanceSAR || 0,
      date: new Date().toISOString().split('T')[0],
      rep: customer.responsible,
    });

    QRCode.toDataURL(qrPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Build clean WhatsApp business statement text
  const buildStatementText = () => {
    const yer = (customer.balanceYER || 0).toLocaleString('ar-YE');
    const sar = (customer.balanceSAR || 0).toLocaleString('ar-SA');
    const usd = (customer.balanceUSD || 0).toLocaleString();
    const statusYER = (customer.balanceYER || 0) < 0 ? 'مديونية مستحقة على العميل' : 'رصيد دائن / مطابق';
    const lastVisit = customerVisits[0]
      ? `\n*آخر حركة مسجلة:* ${customerVisits[0].date} - ${customerVisits[0].amountCollectedYER ? customerVisits[0].amountCollectedYER.toLocaleString('ar-YE') + ' ريال' : customerVisits[0].status}`
      : '';

    return `*📋 كشف حساب ومطابقة رصيد معتمد*
━━━━━━━━━━━━━━━━━━
🏢 *المنشأة / العميل:* ${customer.name}
🆔 *رقم الحساب:* ${customer.id} / ${customer.subId || 'عام'}
📍 *المسار والمنطقة:* ${customer.region} • ${customer.route}
👤 *المندوب المسؤول:* ${customer.responsible}
📅 *تاريخ الكشف:* ${printDate} - ${printTime}

💵 *ملخص الأرصدة المالية:*
• *ريال يمني:* ${yer} ريال (${statusYER})
• *ريال سعودي:* ${sar} ر.س
• *دولار أمريكي:* $${usd}
${lastVisit}

━━━━━━━━━━━━━━━━━━
📝 *ملاحظة:* يرجى التكرم بالاطلاع ومطابقة الرصيد، والرد في حال وجود أي استفسار أو قيد للمطابقة. شاكرين لكم حسن تعاونكم الدائم.
✨ *المنظومة-الإدارية-المتكاملة — إدارة الحسابات والمبيعات الميدانية*`;
  };

  // Format clean phone for WhatsApp
  const cleanPhoneNumber = (phoneInput: string) => {
    let clean = (phoneInput || '').replace(/[^0-9]/g, '');
    if (clean.length === 9 && clean.startsWith('7')) {
      clean = '967' + clean; // Yemen mobile default
    } else if (clean.length === 9 && clean.startsWith('5')) {
      clean = '966' + clean; // Saudi mobile default
    }
    return clean;
  };

  const handleSendWhatsApp = (targetPhone?: string) => {
    const rawNumber = targetPhone !== undefined ? targetPhone : (customer.phone || customPhone);
    const cleaned = cleanPhoneNumber(rawNumber);

    if (!cleaned) {
      setShowPhonePrompt(true);
      return;
    }

    const message = buildStatementText();
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyStatement = () => {
    const text = buildStatementText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSourceHeader = (source: string) => {
    switch (source) {
      case 'توب مكياجي':
        return {
          title: 'شركة توب مكياجي لمستحضرات التجميل والعناية',
          subtitle: 'إدارة المبيعات والتوزيع الميداني • كشف حساب ومتابعة عميل',
          color: 'from-pink-800 to-rose-950',
          accent: 'border-pink-500',
        };
      case 'عفيف':
        return {
          title: 'مؤسسة عفيف التجارية للتوكيلات والتوزيع',
          subtitle: 'إدارة الحسابات والعملاء • كشف حساب رسمي',
          color: 'from-blue-900 to-indigo-950',
          accent: 'border-blue-500',
        };
      case 'الأطباء':
        return {
          title: 'القطاع الطبي والصيدلاني • الأطباء والمراكز الطبية',
          subtitle: 'إدارة الزيارات العلمية والتوزيع الدوائي • كشف حساب عميل',
          color: 'from-emerald-900 to-teal-950',
          accent: 'border-emerald-500',
        };
      default:
        return {
          title: 'المنظومة-الإدارية-المتكاملة — إدارة المبيعات والعملاء',
          subtitle: 'إدارة المبيعات والعملاء والتحصيل الميداني • كشف حساب رسمي ومطابقة أرصدة',
          color: 'from-teal-900 to-slate-950',
          accent: 'border-teal-500',
        };
    }
  };

  const headerInfo = getSourceHeader(customer.source);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white dark:print:bg-slate-900"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 80mm Print CSS injection for Thermal Bluetooth Printers (Xprinter / Sunmi / Bixolon / ESC/POS) */}
      <style>{`
        @media print {
          @page {
            size: ${printMode === 'thermal80' ? '80mm auto' : 'A4 portrait'};
            margin: ${printMode === 'thermal80' ? '1.5mm' : '8mm'};
          }
          body {
            background: #fff !important;
            color: #000 !important;
            font-family: monospace, 'Cairo', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden {
            display: none !important;
          }
          .thermal-receipt-container {
            width: 78mm !important;
            max-width: 78mm !important;
            padding: 1mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-slate-200 dark:border-slate-800 print:border-none print:shadow-none print:max-h-none print:w-full my-auto"
        dir="rtl"
      >
        {/* Modal Toolbar (Non-printable) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 shadow-xs print-hidden">
          {/* Mode Switcher: A4 vs 80mm Thermal */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setPrintMode('a4')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printMode === 'a4'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ورق رسمي A4</span>
            </button>
            <button
              onClick={() => setPrintMode('thermal80')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printMode === 'thermal80'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>إيصال حراري 80mm (ESC/POS)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp 1-Click Send */}
            <button
              onClick={() => handleSendWhatsApp()}
              className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="إرسال كشف الحساب مباشرة للعميل عبر تطبيق واتساب"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>إرسال عبر واتساب</span>
            </button>

            {/* Copy Statement Text */}
            <button
              onClick={handleCopyStatement}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="نسخ كشف الحساب كنص منسق للمراسلة"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>

            {/* Instant Print */}
            <button
              onClick={handlePrint}
              className={`px-4 py-1.5 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                printMode === 'thermal80'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{printMode === 'thermal80' ? 'طباعة إيصال 80mm' : 'طباعة فورية / PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 flex items-center justify-center transition-colors cursor-pointer text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Phone Prompt Popover when client phone is missing */}
        {showPhonePrompt && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 p-3 px-6 flex items-center justify-between gap-3 text-xs print-hidden">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>أدخل رقم هاتف العميل لإرسال كشف الحساب عبر واتساب:</span>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="مثال: 777123456 أو 967777123456"
                className="bg-white dark:bg-slate-900 border border-emerald-300 rounded-lg px-3 py-1 font-mono text-slate-800 dark:text-slate-200 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleSendWhatsApp(customPhone);
                  setShowPhonePrompt(false);
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                إرسال الآن
              </button>
              <button
                onClick={() => setShowPhonePrompt(false)}
                className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: 80MM THERMAL RECEIPT (ESC/POS Bluetooth & Roll Printer) */}
        {/* ============================================================ */}
        {printMode === 'thermal80' ? (
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-800 flex justify-center print:bg-white dark:print:bg-slate-900 print:p-0">
            <div
              ref={printRef}
              className="thermal-receipt-container w-full max-w-[320px] bg-white dark:bg-slate-900 p-4 font-mono text-slate-900 dark:text-slate-100 border border-dashed border-slate-300 dark:border-slate-600 shadow-md rounded-xl print:shadow-none print:border-none print:rounded-none print:p-1 text-xs"
            >
              {/* Thermal Header */}
              <div className="text-center space-y-1 pb-2">
                <div className="text-base font-black tracking-tight">{headerInfo.title}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-bold">إدارة المبيعات والتوزيع الميداني</div>
                <div className="text-xs font-black border-y border-dashed border-slate-800 py-1 my-1">
                  *** كشف حساب عميل معتمد (80mm) ***
                </div>
              </div>

              {/* Thermal Metadata */}
              <div className="text-xs space-y-1 py-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span className="font-bold">التاريخ:</span>
                  <span>{printDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">الوقت:</span>
                  <span>{printTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">العميل:</span>
                  <span className="font-black truncate max-w-[170px]">{customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">رقم الحساب:</span>
                  <span className="font-bold">{customer.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">المنطقة / المسار:</span>
                  <span>{customer.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">المندوب:</span>
                  <span>{customer.responsible}</span>
                </div>
                {customer.phone && (
                  <div className="flex justify-between">
                    <span className="font-bold">الهاتف:</span>
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>

              {/* Thermal Balances Table */}
              <div className="py-2 border-b border-dashed border-slate-800 space-y-1.5">
                <div className="text-center font-black text-xs pb-1">
                  ================================
                </div>
                <div className="text-center font-black text-xs">
                  الأرصدة والمطابقة الحالية
                </div>
                <div className="text-center font-black text-xs">
                  ================================
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-1 rounded font-bold">
                    <span>ر.ي (ريال يمني):</span>
                    <span className="font-black text-sm">
                      {(customer.balanceYER || 0).toLocaleString('ar-YE')}
                    </span>
                  </div>
                  <div className="text-xs text-right text-slate-600 dark:text-slate-300 px-1">
                    الحالة: {(customer.balanceYER || 0) < 0 ? 'مديونية مستحقة' : 'رصيد دائن / مطابق'}
                  </div>

                  <div className="flex justify-between items-center p-1 font-bold">
                    <span>ر.س (ريال سعودي):</span>
                    <span>{(customer.balanceSAR || 0).toLocaleString('ar-SA')}</span>
                  </div>

                  <div className="flex justify-between items-center p-1 font-bold">
                    <span>$ (دولار أمريكي):</span>
                    <span>${(customer.balanceUSD || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Last Transactions / Visits */}
              {customerVisits.length > 0 && (
                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-xs">
                  <div className="font-bold text-xs pb-1">آخر الحركات والزيارات:</div>
                  {customerVisits.slice(0, 3).map((v) => (
                    <div key={v.id} className="flex justify-between border-b border-dotted border-slate-200 dark:border-slate-700 pb-0.5">
                      <span>{v.date}</span>
                      <span>{v.status}</span>
                      <span className="font-bold">
                        {v.amountCollectedYER ? `${v.amountCollectedYER.toLocaleString()} ر.ي` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* QR Code Verification for Electronic Receipt */}
              <div className="pt-3 pb-1 flex flex-col items-center justify-center text-center space-y-1">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR Verification"
                    className="w-24 h-24 mx-auto border border-slate-300 dark:border-slate-600 p-1 bg-white dark:bg-slate-900"
                  />
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  رمز التحقق والمطابقة الإلكترونية ESC/POS
                </span>
              </div>

              {/* Barcode representation */}
              <div className="py-1 text-center font-mono text-xs tracking-widest text-slate-400 dark:text-slate-500">
                ||| | |||| | ||| |||| | || | |||
                <div className="text-xs text-slate-500 dark:text-slate-400">{customer.id} - {new Date().toISOString().split('T')[0]}</div>
              </div>

              {/* Thermal Signatures & Cut Line */}
              <div className="pt-3 space-y-4 text-xs text-center border-t border-dashed border-slate-400">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>توقيع المندوب: ...........</span>
                  <span>توقيع العميل: ...........</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  شكراً لتعاملكم • نسعد بخدمتكم دائماً
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  - - - - - - - - [ قص الورق هنا ] - - - - - - - -
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: OFFICIAL A4 CORPORATE LETTERHEAD STATEMENT */
          /* ============================================================ */
          <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
            {/* Official Letterhead Header */}
            <div className={`p-6 rounded-xl bg-gradient-to-r ${headerInfo.color} text-white relative overflow-hidden shadow-xs`}>
              <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight">{headerInfo.title}</h1>
                  <p className="text-xs text-slate-200 mt-1 font-medium">{headerInfo.subtitle}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-300 font-mono flex-wrap">
                    <span>تاريخ الكشف: {printDate} ({printTime})</span>
                    <span>•</span>
                    <span>الفرع / المصدر: {customer.source}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="inline-block px-3 py-1 bg-white/10 dark:bg-slate-900/10 rounded-xl border border-white/20 text-xs font-black text-amber-300">
                    كشف حساب معتمد A4
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-300">
                    {customer.id} / {customer.subId || 'عام'}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">اسم العميل / المنشأة:</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{customer.name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">المنطقة والمسار:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {customer.region} • {customer.route}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">المندوب المسؤول:</span>
                <span className="font-bold text-teal-800 dark:text-teal-200">{customer.responsible}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-bold">رقم الهاتف والتواصل:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customer.phone || 'غير مسجل'}</span>
              </div>
            </div>

            {/* Balance Matrix 3 Currencies */}
            <div>
              <h3 className="font-black text-xs text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ملخص الأرصدة المالية الحالية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div className="text-slate-500 dark:text-slate-400 font-bold text-xs">الرصيد بالريال اليمني (YER)</div>
                  <div
                    className={`text-lg font-black font-mono mt-1 ${
                      (customer.balanceYER || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {(customer.balanceYER || 0).toLocaleString('ar-YE')} ريال
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {(customer.balanceYER || 0) < 0 ? 'مديونية مستحقة على العميل' : 'رصيد دائن / مطابق'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400 font-bold text-xs">الرصيد بالريال السعودي (SAR)</div>
                  <div className="text-lg font-black font-mono text-slate-800 dark:text-slate-200 mt-1">
                    {(customer.balanceSAR || 0).toLocaleString('ar-SA')} ر.س
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">حساب العملة الأجنبية</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 dark:text-slate-400 font-bold text-xs">الرصيد بالدولار الأمريكي (USD)</div>
                  <div className="text-lg font-black font-mono text-slate-800 dark:text-slate-200 mt-1">
                    ${(customer.balanceUSD || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">حساب العملة الأجنبية</div>
                </div>
              </div>
            </div>

            {/* Visits & Transactions Log */}
            <div>
              <h3 className="font-black text-xs text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                سجل الحركات والزيارات والتحصيلات الأخيرة
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <div className="w-full overflow-x-auto print:overflow-visible">
                <table className="w-full text-right border-collapse text-xs min-w-[600px] print:min-w-0">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">المندوب</th>
                      <th className="p-2.5">الحالة</th>
                      <th className="p-2.5">المبلغ المحصل</th>
                      <th className="p-2.5">بيان المهمة والنتيجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerVisits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 dark:text-slate-500">
                          لا توجد حركات تحصيل أو زيارات مسجلة حديثاً
                        </td>
                      </tr>
                    ) : (
                      customerVisits.map((v) => (
                        <tr key={v.id}>
                          <td className="p-2.5 font-medium">{v.date}</td>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{v.responsible}</td>
                          <td className="p-2.5 font-bold">{v.status}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {v.amountCollectedYER ? `${v.amountCollectedYER.toLocaleString()} ريال` : '—'}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">{v.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            {/* Official Endorsement & Signatures */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-6">
                <span className="font-bold text-slate-600 dark:text-slate-300 block">المندوب المسؤول</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">{customer.responsible}</span>
                <div className="border-b border-slate-300 dark:border-slate-600 w-32 mx-auto"></div>
              </div>

              <div className="space-y-6">
                <span className="font-bold text-slate-600 dark:text-slate-300 block">قسم الحسابات والمراجعة</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">مطابق للسجلات</span>
                <div className="border-b border-slate-300 dark:border-slate-600 w-32 mx-auto"></div>
              </div>

              <div className="space-y-6">
                <span className="font-bold text-slate-600 dark:text-slate-300 block">ختم وتوقيع العميل / المنشأة</span>
                <span className="font-bold text-slate-400 dark:text-slate-500 block">بالموافقة والاعتماد</span>
                <div className="border-b border-slate-300 dark:border-slate-600 w-32 mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
