import React, { useState } from 'react';
import { InventorySettings, WarehouseItem } from '../../../types/settings';
import { Package, Plus, Trash2, CheckCircle2, Warehouse, Tag, Scale } from 'lucide-react';

interface Props {
  settings: InventorySettings;
  onChange: (updated: InventorySettings) => void;
}

export const InventorySettingsTab: React.FC<Props> = ({ settings, onChange }) => {
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');

  // Warehouse handlers
  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;
    const newWh: WarehouseItem = {
      id: `wh-${Date.now()}`,
      name: newWarehouseName.trim(),
      isDefault: settings.warehouses.length === 0,
    };
    onChange({
      ...settings,
      warehouses: [...settings.warehouses, newWh],
    });
    setNewWarehouseName('');
  };

  const handleSetDefaultWarehouse = (id: string) => {
    onChange({
      ...settings,
      warehouses: settings.warehouses.map((w) => ({
        ...w,
        isDefault: w.id === id,
      })),
    });
  };

  const handleDeleteWarehouse = (id: string) => {
    if (settings.warehouses.length <= 1) {
      alert('يجب الإبقاء على مخزن رئيسي واحد على الأقل في النظام');
      return;
    }
    const remaining = settings.warehouses.filter((w) => w.id !== id);
    if (!remaining.some((w) => w.isDefault) && remaining.length > 0) {
      remaining[0].isDefault = true;
    }
    onChange({
      ...settings,
      warehouses: remaining,
    });
  };

  // Category handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (settings.productCategories.includes(newCategoryName.trim())) {
      alert('هذا التصنيف موجود بالفعل');
      return;
    }
    onChange({
      ...settings,
      productCategories: [...settings.productCategories, newCategoryName.trim()],
    });
    setNewCategoryName('');
  };

  const handleDeleteCategory = (cat: string) => {
    if (settings.productCategories.length <= 1) {
      alert('يجب الإبقاء على تصنيف واحد على الأقل');
      return;
    }
    onChange({
      ...settings,
      productCategories: settings.productCategories.filter((c) => c !== cat),
    });
  };

  // Unit handlers
  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    if (settings.units.includes(newUnitName.trim())) {
      alert('هذه الوحدة موجودة بالفعل');
      return;
    }
    onChange({
      ...settings,
      units: [...settings.units, newUnitName.trim()],
    });
    setNewUnitName('');
  };

  const handleDeleteUnit = (unit: string) => {
    if (settings.units.length <= 1) {
      alert('يجب الإبقاء على وحدة قياس واحدة على الأقل');
      return;
    }
    onChange({
      ...settings,
      units: settings.units.filter((u) => u !== unit),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">إعدادات المخزون والمستودعات</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة الفروع والمخازن، وتصنيفات الأصناف، ووحدات القياس المعتمدة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Warehouses Column */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">إدارة المخازن</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              {settings.warehouses.length} مخازن
            </span>
          </div>

          {/* Add warehouse form */}
          <form onSubmit={handleAddWarehouse} className="flex gap-2">
            <input
              type="text"
              value={newWarehouseName}
              onChange={(e) => setNewWarehouseName(e.target.value)}
              placeholder="اسم المخزن الجديد..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl transition-all cursor-pointer"
              title="إضافة مخزن"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Warehouse list */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
            {settings.warehouses.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{wh.name}</span>
                    {wh.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        افتراضي
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!wh.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultWarehouse(wh.id)}
                      className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      title="تعيين كمخزن افتراضي"
                    >
                      تعيين كافتراضي
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteWarehouse(wh.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="حذف المخزن"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Column */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">تصنيفات المنتجات</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              {settings.productCategories.length} تصنيف
            </span>
          </div>

          {/* Add Category form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="تصنيف جديد..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
            />
            <button
              type="submit"
              className="p-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl transition-all cursor-pointer"
              title="إضافة تصنيف"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
            {settings.productCategories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
              >
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{cat}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Units Column */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">وحدات القياس</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              {settings.units.length} وحدات
            </span>
          </div>

          {/* Add Unit form */}
          <form onSubmit={handleAddUnit} className="flex gap-2">
            <input
              type="text"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="وحدة جديدة (مثال: طرد)..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl transition-all cursor-pointer"
              title="إضافة وحدة"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Units list */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
            {settings.units.map((unit) => (
              <div
                key={unit}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
              >
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{unit}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteUnit(unit)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
