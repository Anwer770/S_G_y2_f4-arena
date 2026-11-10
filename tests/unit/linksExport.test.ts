// @vitest-environment jsdom
/** R56 — بحث مكتبة الروابط وتصديرها: لا اختفاء في المرشحات ولا رابط غير آمن. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkRecord } from '../../src/types/linksLibrary';

const xlsx = vi.hoisted(() => ({
  jsonToSheet: vi.fn(() => ({}) as Record<string, unknown>),
  bookNew: vi.fn(() => ({ workbook: true })),
  bookAppendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: xlsx.jsonToSheet,
    book_new: xlsx.bookNew,
    book_append_sheet: xlsx.bookAppendSheet,
  },
  writeFile: xlsx.writeFile,
}));

import {
  exportLinksToCSV,
  exportLinksToExcel,
  exportLinksToJSON,
  filterLinks,
  formatValidUrl,
  normalizeArabicSearch,
} from '../../src/utils/linksExport';

const link = (over: Partial<LinkRecord> = {}): LinkRecord => ({
  id: 'L-1',
  siteName: 'أداة ذكية',
  desc: 'وصف أداة',
  url: 'https://example.com',
  classification: 'ذكاء اصطناعي',
  category: 'تصميم',
  type: 'موقع رسمي',
  importance: 'A',
  notes: 'ملاحظة',
  isFavorite: true,
  visitCount: 3,
  ...over,
});

let csv = '';
const clicks: HTMLAnchorElement[] = [];
let originalCreateObjectUrl: typeof URL.createObjectURL;
let originalClick: typeof HTMLAnchorElement.prototype.click;

beforeEach(() => {
  csv = '';
  clicks.length = 0;
  xlsx.jsonToSheet.mockReset();
  xlsx.jsonToSheet.mockImplementation(() => ({}));
  xlsx.bookNew.mockClear();
  xlsx.bookAppendSheet.mockClear();
  xlsx.writeFile.mockClear();
  originalCreateObjectUrl = URL.createObjectURL;
  originalClick = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = vi.fn(() => 'blob:links-test');
  HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
    clicks.push(this);
  };
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectUrl;
  HTMLAnchorElement.prototype.click = originalClick;
  vi.unstubAllGlobals();
});

describe('تطبيع وبحث الروابط', () => {
  it('يوحد العربية والتشكيل والشرطات من دون تخريب النص الفارغ', () => {
    expect(normalizeArabicSearch('')).toBe('');
    expect(normalizeArabicSearch('  إِدارة-الذَّكاء_العربى  ')).toBe('اداره الذكاء العربي');
  });

  it('يطبق كل مرشحات المفضلة والذكاء والتصنيف والفئة والنوع والأهمية والبحث', () => {
    const links = [
      link(),
      link({
        id: 'L-2',
        siteName: 'GPT مساعد',
        classification: 'أدوات',
        category: 'كتابة',
        type: 'موقع مجاني',
        importance: 'B',
        isFavorite: false,
        desc: 'مساعد كتابة',
      }),
      link({
        id: 'L-3',
        siteName: 'بوابة عادية',
        classification: 'رسمي',
        category: 'حكومي',
        type: 'موقع رسمي',
        importance: 'C',
        isFavorite: false,
      }),
      link({ id: 'L-4', siteName: 'Claude Hub', classification: 'كلود', notes: undefined }),
      link({ id: 'L-5', siteName: 'Gemini Hub', classification: 'جيمنايل' }),
      link({ id: 'L-6', siteName: 'Deep Hub', classification: 'ديب سيك' }),
      link({ id: 'L-7', siteName: 'GPT عربي', classification: 'جي بي تي' }),
      link({ id: 'L-8', siteName: 'AI Hub', classification: '' }),
    ];
    const base = {
      search: '',
      classification: 'الكل',
      category: 'الكل',
      type: 'الكل',
      importance: 'الكل',
      onlyFavorites: false,
      onlyAI: false,
    };

    expect(filterLinks(links, { ...base, onlyFavorites: true }).map((item) => item.id)).toEqual([
      'L-1',
      'L-4',
      'L-5',
      'L-6',
      'L-7',
      'L-8',
    ]);
    expect(filterLinks(links, { ...base, onlyAI: true }).map((item) => item.id)).toEqual([
      'L-1',
      'L-2',
      'L-4',
      'L-5',
      'L-6',
      'L-7',
      'L-8',
    ]);
    expect(filterLinks(links, { ...base, classification: 'رسمي' }).map((item) => item.id)).toEqual(['L-3']);
    expect(filterLinks(links, { ...base, category: 'كتابة' }).map((item) => item.id)).toEqual(['L-2']);
    expect(filterLinks(links, { ...base, type: 'موقع رسمي', importance: 'C' }).map((item) => item.id)).toEqual(['L-3']);
    expect(filterLinks(links, { ...base, search: 'اداه ذكيه' }).map((item) => item.id)).toEqual(['L-1']);
    expect(filterLinks([link({ notes: undefined })], { ...base, search: 'اداه' }).map((item) => item.id)).toEqual([
      'L-1',
    ]);
    expect(filterLinks(links, { ...base, search: 'لا توجد' })).toEqual([]);
  });

  it('يرفض الرابط التنفيذي ويكمل الرابط النظيف إلى https', () => {
    expect(formatValidUrl(' javascript:alert(1) ')).toBe('');
    expect(formatValidUrl('example.com/path')).toBe('https://example.com/path');
    expect(formatValidUrl('https://safe.example')).toBe('https://safe.example');
  });
});

describe('مخرجات CSV وJSON وExcel', () => {
  it('يهرب CSV كاملاً وينزّل CSV وJSON بالاسم المتوقع', () => {
    vi.stubGlobal(
      'Blob',
      class FakeBlob {
        constructor(parts: string[]) {
          csv = parts.join('');
        }
      }
    );

    exportLinksToCSV([link({ siteName: '"اقتباس"', notes: 'سطر' })]);
    expect(csv).toContain('\uFEFFالمعرف,اسم الموقع');
    expect(csv).toContain('""اقتباس""');
    expect(clicks[0].download).toMatch(/^smart_links_library_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(clicks[0].parentElement).toBeNull();

    exportLinksToJSON([link()]);
    expect(clicks[1].download).toMatch(/^smart_links_\d{4}-\d{2}-\d{2}\.json$/);
    expect(clicks[1].parentElement).toBeNull();

    exportLinksToCSV([
      link({
        id: '',
        siteName: '',
        desc: '',
        url: '',
        type: '',
        classification: '',
        category: '',
        importance: '',
        notes: undefined,
        isFavorite: false,
        visitCount: 0,
      }),
    ]);
    expect(csv).toContain('"","","","","","","","","لا","0",""');
  });

  it('ينشئ ملف Excel RTL بصفوف نظيفة حتى الحقول الاختيارية الغائبة', () => {
    exportLinksToExcel([link({ notes: undefined, isFavorite: false, visitCount: 0 })], 'روابط.xlsx');

    const [rows] = xlsx.jsonToSheet.mock.calls[0] as unknown as [Record<string, unknown>[]];
    const sheet = xlsx.jsonToSheet.mock.results[0].value as { ['!views']?: unknown[] };
    expect(rows[0]).toMatchObject({ 'اسم الموقع / الأداة': 'أداة ذكية', مفضل: 'لا', 'مرات الزيارة': 0, ملاحظات: '' });
    expect(sheet['!views']).toEqual([{ rightToLeft: true }]);
    expect(xlsx.bookAppendSheet).toHaveBeenCalledWith({ workbook: true }, sheet, 'مكتبة_الروابط');
    expect(xlsx.writeFile).toHaveBeenCalledWith({ workbook: true }, 'روابط.xlsx');

    exportLinksToExcel(
      [
        link({
          id: '',
          siteName: '',
          desc: '',
          url: '',
          type: '',
          classification: '',
          category: '',
          importance: '',
          notes: undefined,
          isFavorite: true,
          visitCount: undefined,
        }),
      ],
      'فارغ.xlsx'
    );
    const [sparseRows] = xlsx.jsonToSheet.mock.calls[1] as unknown as [Record<string, unknown>[]];
    expect(sparseRows[0]).toMatchObject({ المعرف: '', 'اسم الموقع / الأداة': '', 'مرات الزيارة': 0, مفضل: 'نعم' });
  });

  it('لا يستبدل views الموجود بل يضيف اتجاه RTL إليه', () => {
    const sheet: Record<string, unknown> = { '!views': [{ zoom: 80 }] };
    xlsx.jsonToSheet.mockReturnValueOnce(sheet);

    exportLinksToExcel([], 'موجود.xlsx');

    expect(sheet['!views']).toEqual([{ zoom: 80 }, { rightToLeft: true }]);
  });
});
