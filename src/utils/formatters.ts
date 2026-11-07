export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export function calculateArabicDay(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const dayIndex = date.getDay(); // 0 = Sunday
  return ARABIC_DAYS[dayIndex] || '';
}

export function formatNumberLatin(amount: number | undefined | null): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(val);
}

export function formatCurrency(amount: number | undefined | null): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatArabicDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const dayName = calculateArabicDay(dateString);
  const formatted = date.toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `${dayName}، ${formatted}`;
}

export function numberToWordsArabic(num: number): string {
  if (num === 0) return 'صفر ريال';
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  const teens = ['أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    let parts: string[] = [];
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h > 0) parts.push(hundreds[h]);
    if (r > 0) {
      if (r <= 10) parts.push(units[r]);
      else if (r < 20) parts.push(teens[r - 11]);
      else {
        const u = r % 10;
        const t = Math.floor(r / 10);
        if (u > 0) parts.push(`${units[u]} و${tens[t]}`);
        else parts.push(tens[t]);
      }
    }
    return parts.join(' و');
  }

  const intPart = Math.floor(num);
  let words = '';
  if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    words += `${convertGroup(millions)} مليون `;
  }
  const thousands = Math.floor((intPart % 1000000) / 1000);
  if (thousands > 0) {
    if (thousands === 1) words += (words ? 'و' : '') + 'ألف ';
    else if (thousands === 2) words += (words ? 'و' : '') + 'ألفان ';
    else words += (words ? 'و' : '') + `${convertGroup(thousands)} آلاف `;
  }
  const remainder = intPart % 1000;
  if (remainder > 0) {
    words += (words ? 'و' : '') + convertGroup(remainder);
  }

  return words.trim() ? `فقط ${words.trim()} ريال لا غير` : 'صفر ريال';
}

export function getMovementTypeStyle(type: 'توريد' | 'صرف' | string) {
  if (type === 'توريد') {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      pill: 'bg-emerald-600 text-white',
      text: 'text-emerald-700 font-bold',
      lightText: 'text-emerald-600',
      label: 'توريد (IN)',
      isInput: true,
    };
  }
  return {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    pill: 'bg-rose-600 text-white',
    text: 'text-rose-700 font-bold',
    lightText: 'text-rose-600',
    label: 'صرف (OUT)',
    isInput: false,
  };
}

export function getStatusStyle(status: string) {
  const trimmed = (status || '').trim();
  switch (trimmed) {
    case 'تم التنفيذ':
    case '√':
    case 'A':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'قيد التنفيذ':
    case 'B':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'تم ترحيل':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'ملغي':
      return 'bg-slate-100 text-slate-500 border-slate-300 line-through';
    case 'معلق':
    case 'عهده':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getCategoryBadgeStyle(category: string) {
  const c = (category || '').trim();
  switch (c) {
    case 'مبيعات':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'مشتريات':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'عينات':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'هدية':
      return 'bg-pink-50 text-pink-800 border-pink-200';
    case 'دعم':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'توزيع':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'تالف':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'مرتجع':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'شركة':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'شخصي':
      return 'bg-violet-50 text-violet-800 border-violet-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
