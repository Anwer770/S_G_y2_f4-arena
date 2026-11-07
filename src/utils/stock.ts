import { AppSettings, MovementRecord, Product, ProductStock } from '../types';

// Convert Arabic-Indic numerals (٠-٩) to Latin digits (0-9)
export function normalizeArabicDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

// Normalize various date inputs to standard YYYY-MM-DD
export function normalizeDate(dateInput: string, defaultYear: number = 2024): string {
  if (!dateInput) return '';
  const clean = normalizeArabicDigits(dateInput.trim()).replace(/[\\/]/g, '-');

  // Case 1: Already YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const parts = clean.split('-');
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Case 2: DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
    const parts = clean.split('-');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  // Case 3: DD-MM (incomplete date, e.g. 5-10 or 15-10)
  if (/^\d{1,2}-\d{1,2}$/.test(clean)) {
    const parts = clean.split('-');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    return `${defaultYear}-${m}-${d}`;
  }

  // Case 4: MM-YYYY (e.g. 12-2024)
  if (/^\d{1,2}-\d{4}$/.test(clean)) {
    const parts = clean.split('-');
    const m = parts[0].padStart(2, '0');
    const y = parts[1];
    return `${y}-${m}-01`;
  }

  // Fallback if parsing fails
  return clean;
}

// Compute live stock calculation for all products
export function calculateStock(
  products: Product[],
  records: MovementRecord[],
  settings: AppSettings
): ProductStock[] {
  const stockMap: Record<
    string,
    {
      product: Product;
      totalIn: number;
      totalOut: number;
      movementCount: number;
    }
  > = {};

  // Initialize with products list
  for (const prod of products) {
    stockMap[prod.name] = {
      product: prod,
      totalIn: 0,
      totalOut: 0,
      movementCount: 0,
    };
  }

  // Accumulate from movement records
  for (const record of records) {
    if (settings.skipCancelled && record.status === 'ملغي') {
      continue;
    }

    const isInput = record.movementType === 'توريد';
    const items = record.items || {};

    for (const [prodName, quantity] of Object.entries(items)) {
      const qty = Number(quantity) || 0;
      if (qty <= 0) continue;

      if (!stockMap[prodName]) {
        // In case an unlisted product was used in records
        stockMap[prodName] = {
          product: {
            id: `PROD-${Math.random().toString(36).substring(2, 7)}`,
            name: prodName,
            openingStock: 0,
            unit: 'حبة',
            isActive: true,
            createdAt: '2024-01-01',
          },
          totalIn: 0,
          totalOut: 0,
          movementCount: 0,
        };
      }

      stockMap[prodName].movementCount += 1;
      if (isInput) {
        stockMap[prodName].totalIn += qty;
      } else {
        stockMap[prodName].totalOut += qty;
      }
    }
  }

  // Return computed stocks
  return Object.values(stockMap).map(({ product, totalIn, totalOut, movementCount }) => {
    const opening = Number(product.openingStock) || 0;
    const currentStock = opening + totalIn - totalOut;

    return {
      id: product.id,
      name: product.name,
      openingStock: opening,
      totalIn,
      totalOut,
      currentStock,
      movementCount,
      isActive: product.isActive ?? true,
      unit: product.unit || 'حبة',
    };
  });
}

// Generate next auto-sequence ID (e.g. IN-0004 or OUT-0299)
export function getNextSubId(
  movementType: 'توريد' | 'صرف',
  records: MovementRecord[],
  seq: { IN: number; OUT: number }
): { subId: string; nextSeq: { IN: number; OUT: number } } {
  const prefix = movementType === 'توريد' ? 'IN' : 'OUT';
  
  // Find highest existing numerical sequence for that prefix
  let maxSeq = movementType === 'توريد' ? seq.IN : seq.OUT;
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');

  for (const r of records) {
    if (r.subId) {
      const match = r.subId.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= maxSeq) {
          maxSeq = num + 1;
        }
      }
    }
  }

  const subId = `${prefix}-${String(maxSeq).padStart(4, '0')}`;
  const nextSeq = {
    ...seq,
    [movementType === 'توريد' ? 'IN' : 'OUT']: maxSeq + 1,
  };

  return { subId, nextSeq };
}

// Cascade Rename Product across all records
export function cascadeRenameProduct(
  oldName: string,
  newName: string,
  products: Product[],
  records: MovementRecord[]
): { updatedProducts: Product[]; updatedRecords: MovementRecord[] } {
  const updatedProducts = products.map((p) =>
    p.name === oldName ? { ...p, name: newName } : p
  );

  const updatedRecords = records.map((record) => {
    if (!record.items || !(oldName in record.items)) {
      return record;
    }
    const newItems: Record<string, number> = {};
    for (const [key, val] of Object.entries(record.items)) {
      if (key === oldName) {
        newItems[newName] = val;
      } else {
        newItems[key] = val;
      }
    }
    return {
      ...record,
      items: newItems,
    };
  });

  return { updatedProducts, updatedRecords };
}
