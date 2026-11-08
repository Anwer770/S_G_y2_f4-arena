/**
 * أدوات Excel الأساسية: عناوين الأعمدة، التنزيل، والبصمة — مستخرجة من utils/excel.ts (R30).
 */
export const BASE_EXCEL_HEADERS = [
  'Main_ID',
  'Sub_ID',
  'date',
  'Beneficiary Name',
  'Description',
  'Movement',
  'Cases',
  'Category',
  'note',
];

// Helper to download blob
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Simple checksum generator for backup integrity
export function generateSimpleChecksum(dataStr: string): string {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// ============================================================================
// 1. STOCK EXCEL & CSV EXPORT
// ============================================================================
