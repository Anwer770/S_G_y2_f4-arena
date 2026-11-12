// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LINK_CATEGORIES,
  DEFAULT_LINK_CLASSIFICATIONS,
  DEFAULT_LINK_IMPORTANCES,
  DEFAULT_LINKS_RECORDS,
  DEFAULT_LINK_TYPES,
} from '../../src/data/defaultLinks';
import { dbStorage } from '../../src/database/dbStorage';
import type { LinkRecord } from '../../src/types/linksLibrary';
import {
  calculateLinksKPIs,
  loadLinkCategories,
  loadLinkClassifications,
  loadLinkImportances,
  loadLinksRecords,
  loadLinkTypes,
  resetLinksToDefault,
  saveLinkCategories,
  saveLinkClassifications,
  saveLinkImportances,
  saveLinksRecords,
  saveLinkTypes,
} from '../../src/utils/storage/links';
import { loadSystemAuditLogs } from '../../src/utils/storage/system';
import { STORAGE_KEYS } from '../../src/utils/storage/keys';

const link = (overrides: Partial<LinkRecord> = {}): LinkRecord => ({
  id: 'LINK-R75',
  siteName: 'رابط R75',
  desc: 'وصف رابط R75',
  url: 'https://example.test/r75',
  classification: 'عادي',
  category: 'عام',
  type: 'موقع رسمي',
  importance: 'A',
  notes: 'ملاحظة',
  isFavorite: false,
  visitCount: 0,
  ...overrides,
});

beforeEach(() => {
  dbStorage.clear();
});

afterEach(() => {
  dbStorage.clear();
});

describe('R75 — استمرارية مكتبة الروابط الذكية', () => {
  it('يعيد بذور كل دفتر روابط عند غياب المفتاح أو حفظ المصفوفة الفارغة', () => {
    expect(loadLinksRecords()).toEqual(DEFAULT_LINKS_RECORDS);
    expect(loadLinkClassifications()).toEqual(DEFAULT_LINK_CLASSIFICATIONS);
    expect(loadLinkCategories()).toEqual(DEFAULT_LINK_CATEGORIES);
    expect(loadLinkTypes()).toEqual(DEFAULT_LINK_TYPES);
    expect(loadLinkImportances()).toEqual(DEFAULT_LINK_IMPORTANCES);

    saveLinksRecords([]);
    saveLinkClassifications([]);
    saveLinkCategories([]);
    saveLinkTypes([]);
    saveLinkImportances([]);
    expect(loadLinksRecords()).toEqual(DEFAULT_LINKS_RECORDS);
    expect(loadLinkClassifications()).toEqual(DEFAULT_LINK_CLASSIFICATIONS);
    expect(loadLinkCategories()).toEqual(DEFAULT_LINK_CATEGORIES);
    expect(loadLinkTypes()).toEqual(DEFAULT_LINK_TYPES);
    expect(loadLinkImportances()).toEqual(DEFAULT_LINK_IMPORTANCES);
  });

  it('يحفظ سجلات الروابط وقوائمها على مفاتيح مستقلة ولا يسمح للتلف أو الكائن أن يمرر بيانات دخيلة', () => {
    const record = link({ id: 'LINK-INDEPENDENT', siteName: 'سجل مستقل' });
    saveLinksRecords([record]);
    saveLinkClassifications(['تصنيف مستقل']);
    saveLinkCategories(['فئة مستقلة']);
    saveLinkTypes(['نوع مستقل']);
    saveLinkImportances(['Z']);

    expect(loadLinksRecords()).toEqual([record]);
    expect(loadLinkClassifications()).toEqual(['تصنيف مستقل']);
    expect(loadLinkCategories()).toEqual(['فئة مستقلة']);
    expect(loadLinkTypes()).toEqual(['نوع مستقل']);
    expect(loadLinkImportances()).toEqual(['Z']);
    expect(dbStorage.getItem(STORAGE_KEYS.LINKS_CATEGORIES)).not.toContain('سجل مستقل');
    expect(dbStorage.getItem(STORAGE_KEYS.LINKS_RECORDS)).not.toContain('فئة مستقلة');

    dbStorage.setItem(STORAGE_KEYS.LINKS_RECORDS, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.LINKS_CLASSIFICATIONS, JSON.stringify({ classifications: [] }));
    dbStorage.setItem(STORAGE_KEYS.LINKS_CATEGORIES, '{تالف');
    dbStorage.setItem(STORAGE_KEYS.LINKS_TYPES, JSON.stringify({ types: [] }));
    dbStorage.setItem(STORAGE_KEYS.LINKS_IMPORTANCES, '{تالف');
    expect(loadLinksRecords()).toEqual(DEFAULT_LINKS_RECORDS);
    expect(loadLinkClassifications()).toEqual(DEFAULT_LINK_CLASSIFICATIONS);
    expect(loadLinkCategories()).toEqual(DEFAULT_LINK_CATEGORIES);
    expect(loadLinkTypes()).toEqual(DEFAULT_LINK_TYPES);
    expect(loadLinkImportances()).toEqual(DEFAULT_LINK_IMPORTANCES);
  });

  it('يعزل البذور ومدخلات الحفظ والقراءة التالية عن تعديل المستهلك بلا حفظ صريح', () => {
    const originalName = DEFAULT_LINKS_RECORDS[0]!.siteName;
    const originalClassification = DEFAULT_LINK_CLASSIFICATIONS[0]!;
    const defaults = loadLinksRecords();
    const classifications = loadLinkClassifications();
    defaults[0]!.siteName = 'تعديل لا يلوّث البذرة';
    classifications[0] = 'تصنيف لا يلوّث البذرة';

    expect(DEFAULT_LINKS_RECORDS[0]!.siteName).toBe(originalName);
    expect(DEFAULT_LINK_CLASSIFICATIONS[0]).toBe(originalClassification);
    expect(loadLinksRecords()[0]!.siteName).toBe(originalName);
    expect(loadLinkClassifications()[0]).toBe(originalClassification);

    const savedRecords = [link({ id: 'LINK-IMMUTABLE', siteName: 'قبل التعديل الخارجي' })];
    const savedTypes = ['نوع قبل التعديل الخارجي'];
    saveLinksRecords(savedRecords);
    saveLinkTypes(savedTypes);
    savedRecords[0]!.siteName = 'بعد التعديل الخارجي';
    savedTypes[0] = 'نوع بعد التعديل الخارجي';
    expect(loadLinksRecords()[0]!.siteName).toBe('قبل التعديل الخارجي');
    expect(loadLinkTypes()).toEqual(['نوع قبل التعديل الخارجي']);
  });

  it('يحسب مؤشرات كل تصنيف ولا يسقط النوع أو الفئة أو الأهمية الفارغة', () => {
    const metrics = calculateLinksKPIs([
      link({
        id: '1',
        siteName: 'ذكاء Office',
        classification: 'ذكاء اوفس حماية تواصل',
        category: 'إنتاجية',
        type: 'فيسبوك',
        importance: 'A',
        isFavorite: true,
      }),
      link({
        id: '2',
        siteName: 'Claude',
        classification: 'كلود شيت سيبراني',
        category: 'إنتاجية',
        type: 'الانستجرام',
        importance: 'B',
      }),
      link({
        id: '3',
        siteName: 'Gemini',
        classification: 'جيمنايل اكسل امان',
        category: 'تحليل',
        type: 'تلجرام',
        importance: 'C',
      }),
      link({
        id: '4',
        siteName: 'DeepSeek',
        classification: 'ديب سيك ورد تواصل',
        category: 'تحليل',
        type: 'أخرى',
        importance: 'D',
      }),
      link({
        id: '5',
        siteName: 'GPT عربي',
        classification: 'جي بي تي',
        category: '',
        type: '',
        importance: 'ملغي',
      }),
      link({
        id: '6',
        siteName: 'AI Space',
        classification: '',
        category: '',
        type: '',
        importance: 'a',
        isFavorite: true,
      }),
      link({ id: '7', siteName: 'GPT Space', classification: '', category: 'عام', type: 'موقع رسمي', importance: '' }),
      link({
        id: '8',
        siteName: 'بوابة عادية',
        classification: 'عادي',
        category: 'عام',
        type: 'موقع رسمي',
        importance: 'غير مفيد',
      }),
    ]);

    expect(metrics).toEqual({
      total: 8,
      favoritesCount: 2,
      aiCount: 7,
      officeCount: 4,
      socialCount: 4,
      securityCount: 3,
      importanceCounts: { A: 2, B: 1, C: 1, D: 1, other: 3 },
      typeCounts: { فيسبوك: 1, الانستجرام: 1, تلجرام: 1, أخرى: 1, '': 2, 'موقع رسمي': 2 },
      classificationCounts: {
        'ذكاء اوفس حماية تواصل': 1,
        'كلود شيت سيبراني': 1,
        'جيمنايل اكسل امان': 1,
        'ديب سيك ورد تواصل': 1,
        'جي بي تي': 1,
        '': 2,
        عادي: 1,
      },
      categoryCounts: { إنتاجية: 2, تحليل: 2, '': 2, عام: 2 },
    });
  });

  it('يعيد الاستعادة كل الدفاتر إلى بذورها ويضيف حدث نظام واضحاً', () => {
    saveLinksRecords([link({ id: 'LINK-CHANGED' })]);
    saveLinkClassifications(['معدّل']);
    saveLinkCategories(['معدّل']);
    saveLinkTypes(['معدّل']);
    saveLinkImportances(['معدّل']);

    resetLinksToDefault();

    expect(loadLinksRecords()).toEqual(DEFAULT_LINKS_RECORDS);
    expect(loadLinkClassifications()).toEqual(DEFAULT_LINK_CLASSIFICATIONS);
    expect(loadLinkCategories()).toEqual(DEFAULT_LINK_CATEGORIES);
    expect(loadLinkTypes()).toEqual(DEFAULT_LINK_TYPES);
    expect(loadLinkImportances()).toEqual(DEFAULT_LINK_IMPORTANCES);
    expect(loadSystemAuditLogs()[0]).toEqual(
      expect.objectContaining({
        module: 'روابط',
        action: 'استعادة',
        details: expect.stringContaining('استعادة مكتبة الروابط'),
      })
    );
  });
});
