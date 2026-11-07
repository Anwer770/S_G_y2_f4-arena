import React, { useState, useEffect } from 'react';
import {
  Customer,
  CustomerSignificance,
  CustomerSource,
  VisitStatus,
} from '../../types';
import {
  CUSTOMER_REGIONS,
  CUSTOMER_RESPONSIBLES,
  CUSTOMER_ROUTES,
  CUSTOMER_SIGNIFICANCES,
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
} from '../../data/defaultCustomers';
import { generateNextCustomerId } from '../../utils/customers';
import {
  X,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Phone,
  DollarSign,
  FileText,
  Shield,
  Sparkles,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
  existingCustomers: Customer[];
}

export const CustomerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  existingCustomers,
}) => {
  const isEdit = !!customer;

  const [id, setId] = useState('');
  const [subId, setSubId] = useState('');
  const [name, setName] = useState('');
  const [source, setSource] = useState<CustomerSource>('القيصر الذهبي');
  const [region, setRegion] = useState('صنعاء');
  const [route, setRoute] = useState('السبت');
  const [significance, setSignificance] = useState<CustomerSignificance>('B');
  const [status, setStatus] = useState<VisitStatus>('مخطط');
  const [responsible, setResponsible] = useState('انور');
  const [taskDesc, setTaskDesc] = useState('');
  const [dateBegin, setDateBegin] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [balanceYER, setBalanceYER] = useState<number | ''>(0);
  const [balanceSAR, setBalanceSAR] = useState<number | ''>(0);
  const [balanceUSD, setBalanceUSD] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isInternalAccount, setIsInternalAccount] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setId(customer.id);
      setSubId(customer.subId || '');
      setName(customer.name);
      setSource(customer.source);
      setRegion(customer.region);
      setRoute(customer.route);
      setSignificance(customer.significance);
      setStatus(customer.status);
      setResponsible(customer.responsible);
      setTaskDesc(customer.taskDesc || '');
      setDateBegin(customer.dateBegin || '');
      setDateEnd(customer.dateEnd || '');
      setBalanceYER(customer.balanceYER ?? 0);
      setBalanceSAR(customer.balanceSAR ?? 0);
      setBalanceUSD(customer.balanceUSD ?? 0);
      setNotes(customer.notes || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setIsInternalAccount(!!customer.isInternalAccount);
    } else {
      const generated = generateNextCustomerId(existingCustomers, 'القيصر الذهبي');
      setId(generated.id);
      setSubId(generated.subId);
      setName('');
      setSource('القيصر الذهبي');
      setRegion('صنعاء');
      setRoute('السبت');
      setSignificance('B');
      setStatus('مخطط');
      setResponsible('انور');
      setTaskDesc('');
      setDateBegin(new Date().toISOString().split('T')[0]);
      setDateEnd('');
      setBalanceYER(0);
      setBalanceSAR(0);
      setBalanceUSD(0);
      setNotes('');
      setPhone('');
      setAddress('');
      setIsInternalAccount(false);
    }
    setErrors({});
  }, [customer, isOpen, existingCustomers]);

  // When changing source on a new customer, update SubId prefix
  const handleSourceChange = (newSource: CustomerSource) => {
    setSource(newSource);
    if (!isEdit) {
      const generated = generateNextCustomerId(existingCustomers, newSource);
      setSubId(generated.subId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'اسم العميل / المنشأة مطلوب';
    if (!id.trim()) newErrors.id = 'المعرف الرئيسي مطلوب';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedCustomer: Customer = {
      id: id.trim(),
      subId: subId.trim(),
      name: name.trim(),
      source,
      region,
      route,
      significance,
      status,
      responsible,
      taskDesc: taskDesc.trim(),
      dateBegin: dateBegin || undefined,
      dateEnd: dateEnd || undefined,
      balanceYER: Number(balanceYER) || 0,
      balanceSAR: Number(balanceSAR) || 0,
      balanceUSD: Number(balanceUSD) || 0,
      notes: notes.trim(),
      phone: phone.trim(),
      address: address.trim(),
      isInternalAccount,
      lastVisitDate: customer?.lastVisitDate,
      visitResult: customer?.visitResult,
      createdAt: customer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedCustomer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-slate-900/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <UserCheck className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isEdit ? 'تعديل بيانات العميل والزيارة' : 'إضافة عميل / منشأة جديدة'}
              </h2>
              <p className="text-xs text-amber-100/90 font-medium">
                نظام إدارة العملاء والزيارات الميدانية • القيصر الذهبي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Basic Identification Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                البيانات الأساسية والتعريف
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <input
                  type="checkbox"
                  checked={isInternalAccount}
                  onChange={(e) => setIsInternalAccount(e.target.checked)}
                  className="rounded text-amber-600 dark:text-amber-400 focus:ring-amber-500 w-3.5 h-3.5"
                />
                حساب داخلي / عهدة / توالف
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  اسم العميل / الصيدلية / المركز / الطبيب <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: صيدلية العالمية، د. أحمد الوادعي، مركز كوزمتكس"
                  className={`w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                    errors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.name}</p>}
              </div>

              {/* Source Brand */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  المصدر / العلامة التجارية <span className="text-rose-500">*</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => handleSourceChange(e.target.value as CustomerSource)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {CUSTOMER_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Main ID */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">المعرف الرئيسي (Main_ID)</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Sub ID */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">المعرف الفرعي (Sub_ID)</label>
                <input
                  type="text"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  placeholder="مثال: ذهبي-001، توب-001، د-001"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  رقم الهاتف / واتساب
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 771234567"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono text-slate-900 dark:text-slate-100 font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                العنوان التفصيلي ومقر العمل
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: صنعاء - شارع الزبيري بجوار المستشفى الجمهوري"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* 2. Route, Geographical Region & Visit Details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              تخطيط المسار والزيارات والمندوب
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Region */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">المنطقة الجغرافية</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOMER_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Route */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">مسار الزيارة (اليوم)</label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOMER_ROUTES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsible */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">المندوب المسؤول</label>
                <select
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOMER_RESPONSIBLES.map((resp) => (
                    <option key={resp} value={resp}>
                      {resp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Significance */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">مستوى الأهمية</label>
                <select
                  value={significance}
                  onChange={(e) => setSignificance(e.target.value as CustomerSignificance)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOMER_SIGNIFICANCES.map((sig) => (
                    <option key={sig} value={sig}>
                      {sig === 'A'
                        ? 'A - عالي الأهمية'
                        : sig === 'B'
                        ? 'B - متوسط الأهمية'
                        : sig === 'C'
                        ? 'C - عادي'
                        : '√ - عميل مؤكد'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Status */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">حالة الزيارة الحالية</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VisitStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOMER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Begin */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">تاريخ بدء المهمة</label>
                <input
                  type="date"
                  value={dateBegin}
                  onChange={(e) => setDateBegin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Date End */}
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">تاريخ انتهاء المهمة / الاستحقاق</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Task Description */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">وصف المهمة / الغرض من الزيارة</label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="مثال: زيارة دورية وعرض منتجات جديدة وتحصيل الدفعة الشهرية..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>
          </div>

          {/* 3. Multi-Currency Financial Balances */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                الأرصدة المالية متعددة العملات (تدعم الأرصدة السالبة للمديونيات)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* YER Balance */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  الرصيد بالريال اليمني (YER)
                </label>
                <input
                  type="number"
                  step="any"
                  value={balanceYER}
                  onChange={(e) => setBalanceYER(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className={`w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold focus:outline-hidden focus:ring-2 ${
                    Number(balanceYER) < 0
                      ? 'border-rose-300 text-rose-600 bg-rose-50/40 focus:ring-rose-500'
                      : 'border-slate-300 text-emerald-700 focus:ring-emerald-500'
                  }`}
                />
                {Number(balanceYER) < 0 && (
                  <p className="text-xs text-rose-500 mt-1 font-bold">⚠️ رصيد دائن / مديونية سالبة</p>
                )}
              </div>

              {/* SAR Balance */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  الرصيد بالريال السعودي (SAR)
                </label>
                <input
                  type="number"
                  step="any"
                  value={balanceSAR}
                  onChange={(e) => setBalanceSAR(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* USD Balance */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  الرصيد بالدولار الأمريكي (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={balanceUSD}
                  onChange={(e) => setBalanceUSD(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 4. Notes & Additional Info */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              ملاحظات إضافية وتفاصيل التسوية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات حول السداد، تفضيلات العميل، أو تعليمات للمندوب..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-medium text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md shadow-amber-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              {isEdit ? 'حفظ التعديلات' : 'إضافة العميل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
