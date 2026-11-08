/**
 * مخزن وحدة «links» — مُستخرج من storage.ts (R26).
 */
import {
  DEFAULT_LINKS_RECORDS,
  DEFAULT_LINK_CATEGORIES,
  DEFAULT_LINK_CLASSIFICATIONS,
  DEFAULT_LINK_IMPORTANCES,
  DEFAULT_LINK_TYPES,
} from '../../data/defaultLinks';
import { dbStorage } from '../../database/dbStorage';
import { logSystemAudit } from './system';
import { LinkRecord, LinksKPIs } from '../../types';
import { STORAGE_KEYS } from './keys';

export function loadLinksRecords(): LinkRecord[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading links records:', e);
  }
  return DEFAULT_LINKS_RECORDS;
}

export function saveLinksRecords(records: LinkRecord[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving links records:', e);
  }
}

export function loadLinkClassifications(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_CLASSIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link classifications:', e);
  }
  return DEFAULT_LINK_CLASSIFICATIONS;
}

export function saveLinkClassifications(classifications: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_CLASSIFICATIONS, JSON.stringify(classifications));
  } catch (e) {
    console.error('Error saving link classifications:', e);
  }
}

export function loadLinkCategories(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link categories:', e);
  }
  return DEFAULT_LINK_CATEGORIES;
}

export function saveLinkCategories(categories: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving link categories:', e);
  }
}

export function loadLinkTypes(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_TYPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link types:', e);
  }
  return DEFAULT_LINK_TYPES;
}

export function saveLinkTypes(types: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_TYPES, JSON.stringify(types));
  } catch (e) {
    console.error('Error saving link types:', e);
  }
}

export function loadLinkImportances(): string[] {
  try {
    const raw = dbStorage.getItem(STORAGE_KEYS.LINKS_IMPORTANCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading link importances:', e);
  }
  return DEFAULT_LINK_IMPORTANCES;
}

export function saveLinkImportances(importances: string[]): void {
  try {
    dbStorage.setItem(STORAGE_KEYS.LINKS_IMPORTANCES, JSON.stringify(importances));
  } catch (e) {
    console.error('Error saving link importances:', e);
  }
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
