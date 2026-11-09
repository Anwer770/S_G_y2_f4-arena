/**
 * مخزن وحدة «links» — مُستخرج من storage.ts (R26).
 * R35: كل قراءة/كتابة عبر مستودع واحد؛ السلوك محفوظ (المصفوفة الفارغة ⇒ البذرة).
 */
import {
  DEFAULT_LINKS_RECORDS,
  DEFAULT_LINK_CATEGORIES,
  DEFAULT_LINK_CLASSIFICATIONS,
  DEFAULT_LINK_IMPORTANCES,
  DEFAULT_LINK_TYPES,
} from '../../data/defaultLinks';
import { createCollectionRepository } from '../../database/repositories/CollectionRepository';
import { logSystemAudit } from './system';
import { LinkRecord, LinksKPIs } from '../../types';
import { STORAGE_KEYS } from './keys';

const linksRepo = createCollectionRepository<LinkRecord>({
  key: STORAGE_KEYS.LINKS_RECORDS,
  fallback: DEFAULT_LINKS_RECORDS,
  fallbackOnEmpty: true,
});

const linkClassificationsRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.LINKS_CLASSIFICATIONS,
  fallback: DEFAULT_LINK_CLASSIFICATIONS,
  fallbackOnEmpty: true,
});

const linkCategoriesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.LINKS_CATEGORIES,
  fallback: DEFAULT_LINK_CATEGORIES,
  fallbackOnEmpty: true,
});

const linkTypesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.LINKS_TYPES,
  fallback: DEFAULT_LINK_TYPES,
  fallbackOnEmpty: true,
});

const linkImportancesRepo = createCollectionRepository<string>({
  key: STORAGE_KEYS.LINKS_IMPORTANCES,
  fallback: DEFAULT_LINK_IMPORTANCES,
  fallbackOnEmpty: true,
});

export function loadLinksRecords(): LinkRecord[] {
  return linksRepo.read();
}

export function saveLinksRecords(records: LinkRecord[]): void {
  linksRepo.write(records);
}

export function loadLinkClassifications(): string[] {
  return linkClassificationsRepo.read();
}

export function saveLinkClassifications(classifications: string[]): void {
  linkClassificationsRepo.write(classifications);
}

export function loadLinkCategories(): string[] {
  return linkCategoriesRepo.read();
}

export function saveLinkCategories(categories: string[]): void {
  linkCategoriesRepo.write(categories);
}

export function loadLinkTypes(): string[] {
  return linkTypesRepo.read();
}

export function saveLinkTypes(types: string[]): void {
  linkTypesRepo.write(types);
}

export function loadLinkImportances(): string[] {
  return linkImportancesRepo.read();
}

export function saveLinkImportances(importances: string[]): void {
  linkImportancesRepo.write(importances);
}

export function calculateLinksKPIs(records: LinkRecord[]): LinksKPIs {
  const total = records.length;
  let favoritesCount = 0;
  let aiCount = 0;
  let officeCount = 0;
  let socialCount = 0;
  let securityCount = 0;

  const importanceCounts = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    other: 0,
  };

  const typeCounts: { [type: string]: number } = {};
  const classificationCounts: { [cls: string]: number } = {};
  const categoryCounts: { [cat: string]: number } = {};

  records.forEach((r) => {
    if (r.isFavorite) favoritesCount++;

    const cls = r.classification || '';
    const cat = r.category || '';
    const typ = r.type || '';
    const imp = (r.importance || '').toUpperCase();

    // AI detection
    if (
      cls.includes('ذكاء') ||
      cls.includes('كلود') ||
      cls.includes('جيمنايل') ||
      cls.includes('ديب سيك') ||
      cls.includes('جي بي تي') ||
      r.siteName.toLowerCase().includes('ai') ||
      r.siteName.toLowerCase().includes('gpt')
    ) {
      aiCount++;
    }

    // Office detection
    if (cls.includes('اوفس') || cls.includes('شيت') || cls.includes('اكسل') || cls.includes('ورد')) {
      officeCount++;
    }

    // Social detection
    if (typ === 'فيسبوك' || typ === 'الانستجرام' || typ === 'تلجرام' || cls.includes('تواصل')) {
      socialCount++;
    }

    // Security detection
    if (cls.includes('حماية') || cls.includes('سيبراني') || cls.includes('امان')) {
      securityCount++;
    }

    // Importance
    if (imp === 'A') importanceCounts.A++;
    else if (imp === 'B') importanceCounts.B++;
    else if (imp === 'C') importanceCounts.C++;
    else if (imp === 'D') importanceCounts.D++;
    else importanceCounts.other++;

    // Counters
    typeCounts[typ] = (typeCounts[typ] || 0) + 1;
    classificationCounts[cls] = (classificationCounts[cls] || 0) + 1;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return {
    total,
    favoritesCount,
    aiCount,
    officeCount,
    socialCount,
    securityCount,
    importanceCounts,
    typeCounts,
    classificationCounts,
    categoryCounts,
  };
}

export function resetLinksToDefault(): void {
  saveLinksRecords(DEFAULT_LINKS_RECORDS);
  saveLinkClassifications(DEFAULT_LINK_CLASSIFICATIONS);
  saveLinkCategories(DEFAULT_LINK_CATEGORIES);
  saveLinkTypes(DEFAULT_LINK_TYPES);
  saveLinkImportances(DEFAULT_LINK_IMPORTANCES);
  logSystemAudit('روابط', 'استعادة', 'تمت استعادة مكتبة الروابط الذكية إلى حالتها الأولية (+50 رابط)');
}
