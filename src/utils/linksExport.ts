import { LinkRecord } from '../types/linksLibrary';
import * as XLSX from 'xlsx';

/**
 * Normalize Arabic text for instant, error-tolerant search
 */
export function normalizeArabicSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // Remove harakat (tashkeel)
    .replace(/[-_]/g, ' ');
}

/**
 * Filter links based on query, classification, category, type, importance, favorite, and AI flags
 */
export function filterLinks(
  links: LinkRecord[],
  filters: {
    search: string;
    classification: string;
    category: string;
    type: string;
    importance: string;
    onlyFavorites: boolean;
    onlyAI: boolean;
  }
): LinkRecord[] {
  const normQuery = normalizeArabicSearch(filters.search);

  return links.filter((item) => {
    // Favorites filter
    if (filters.onlyFavorites && !item.isFavorite) {
      return false;
    }

    // AI filter
    if (filters.onlyAI) {
      const cls = item.classification || '';
      const isAI =
        cls.includes('ذكاء') ||
        cls.includes('كلود') ||
        cls.includes('جيمنايل') ||
        cls.includes('ديب سيك') ||
        cls.includes('جي بي تي') ||
        item.siteName.toLowerCase().includes('ai') ||
        item.siteName.toLowerCase().includes('gpt');
      if (!isAI) return false;
    }

    // Classification filter
    if (filters.classification && filters.classification !== 'الكل' && item.classification !== filters.classification) {
      return false;
    }

    // Category filter
    if (filters.category && filters.category !== 'الكل' && item.category !== filters.category) {
      return false;
    }

    // Type filter
    if (filters.type && filters.type !== 'الكل' && item.type !== filters.type) {
      return false;
    }

    // Importance filter
    if (filters.importance && filters.importance !== 'الكل' && item.importance !== filters.importance) {
      return false;
    }

    // Text search filter
    if (normQuery) {
      const combined = `${item.siteName} ${item.desc} ${item.url} ${item.classification} ${item.category} ${item.type} ${item.importance} ${item.notes || ''}`;
      const normCombined = normalizeArabicSearch(combined);
      if (!normCombined.includes(normQuery)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ensure URL starts with http:// or https://
 */
export function formatValidUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Export links list as CSV with UTF-8 BOM for full Arabic Excel support
 */
export function exportLinksToCSV(links: LinkRecord[]): void {
  const headers = ['المعرف', 'اسم الموقع', 'الوصف', 'الرابط', 'النوع', 'التصنيف', 'الفئة', 'الأهمية', 'مفضل', 'مرات الزيارة', 'ملاحظات'];

  const rows = links.map((r) => [
    `"${(r.id || '').replace(/"/g, '""')}"`,
    `"${(r.siteName || '').replace(/"/g, '""')}"`,
    `"${(r.desc || '').replace(/"/g, '""')}"`,
    `"${(r.url || '').replace(/"/g, '""')}"`,
    `"${(r.type || '').replace(/"/g, '""')}"`,
    `"${(r.classification || '').replace(/"/g, '""')}"`,
    `"${(r.category || '').replace(/"/g, '""')}"`,
    `"${(r.importance || '').replace(/"/g, '""')}"`,
    `"${r.isFavorite ? 'نعم' : 'لا'}"`,
    `"${r.visitCount || 0}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `smart_links_library_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export links as clean formatted JSON file
 */
export function exportLinksToJSON(links: LinkRecord[]): void {
  const exportData = {
    title: 'مكتبة الروابط الذكية - Smart Links Library',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalLinks: links.length,
    links,
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `smart_links_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export links as native Excel XLSX with RTL worksheet
 */
export function exportLinksToExcel(links: LinkRecord[], filename = `مكتبة_الروابط_${new Date().toISOString().split('T')[0]}.xlsx`): void {
  const rows = links.map((r) => ({
    'المعرف': r.id || '',
    'اسم الموقع / الأداة': r.siteName || '',
    'الوصف': r.desc || '',
    'الرابط الإلكتروني': r.url || '',
    'النوع': r.type || '',
    'التصنيف': r.classification || '',
    'الفئة': r.category || '',
    'الأهمية': r.importance || '',
    'مفضل': r.isFavorite ? 'نعم' : 'لا',
    'مرات الزيارة': r.visitCount || 0,
    'ملاحظات': r.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(wb, ws, 'مكتبة_الروابط');
  XLSX.writeFile(wb, filename);
}
