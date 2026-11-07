import { Item, Movement, ProductStock, AppSettings } from '../../types';
import { productRepository, stockMovementRepository } from '../../database/repositories/ProductRepository';
import { calculateStock, cascadeRenameProduct, getNextSubId } from '../../utils/stock';
import { Outbox } from '../../sync/Outbox';

export class InventoryService {
  public getAllProducts(): Item[] {
    return productRepository.getAll();
  }

  public getAllMovements(): Movement[] {
    return stockMovementRepository.getAll();
  }

  public calculateCurrentStock(
    products: Item[] = this.getAllProducts(),
    records: Movement[] = this.getAllMovements(),
    settings?: AppSettings
  ): ProductStock[] {
    return calculateStock(products, records, settings);
  }

  public saveMovement(
    movement: Movement,
    seq: { IN: number; OUT: number },
    onSeqUpdate?: (newSeq: { IN: number; OUT: number }) => void
  ): Movement {
    const existing = stockMovementRepository.findBySubId(movement.subId);
    let saved: Movement;

    if (existing) {
      saved = stockMovementRepository.update(movement.id || movement.subId, movement) || movement;
      Outbox.enqueue('StockMovement', 'UPDATE', movement.subId, saved);
    } else {
      saved = stockMovementRepository.add(movement);
      Outbox.enqueue('StockMovement', 'INSERT', movement.subId, saved);

      const numMatch = movement.subId.match(/^(IN|OUT)-(\d+)$/i);
      if (numMatch && onSeqUpdate) {
        const type = numMatch[1].toUpperCase() as 'IN' | 'OUT';
        const num = parseInt(numMatch[2], 10);
        const nextSeq = { ...seq, [type]: Math.max(seq[type], num + 1) };
        onSeqUpdate(nextSeq);
      }
    }

    return saved;
  }

  public renameProduct(oldName: string, newProduct: Item): { updatedProducts: Item[]; updatedRecords: Movement[] } {
    const products = productRepository.getAll();
    const records = stockMovementRepository.getAll();

    if (oldName !== newProduct.name) {
      const { updatedProducts, updatedRecords } = cascadeRenameProduct(
        oldName,
        newProduct.name,
        products,
        records
      );
      productRepository.saveAll(
        updatedProducts.map((p) => (p.id === newProduct.id ? newProduct : p))
      );
      stockMovementRepository.saveAll(updatedRecords);
      return { updatedProducts, updatedRecords };
    } else {
      const updated = products.map((p) => (p.id === newProduct.id ? newProduct : p));
      productRepository.saveAll(updated);
      return { updatedProducts: updated, updatedRecords: records };
    }
  }

  public cloneMovement(
    record: Movement,
    records: Movement[],
    seq: { IN: number; OUT: number }
  ): Movement {
    const { subId: nextSubId } = getNextSubId(record.movementType, records, seq);
    const cloned: Movement = {
      ...record,
      id: nextSubId,
      subId: nextSubId,
      mainId: `Categ-${1000 + records.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    return stockMovementRepository.add(cloned);
  }
}

export const inventoryService = new InventoryService();
