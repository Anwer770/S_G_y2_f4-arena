import React, { useState } from 'react';
import {
  AppSettings,
  AuditLog,
  Item,
  Movement,
  ProductStock,
} from '../../types';
import { DashboardView } from '../DashboardView';
import { RecordsView } from '../RecordsView';
import { InventoryView } from '../InventoryView';
import { ReportsView } from '../ReportsView';
import { MovementModal } from '../MovementModal';
import { MovementDetailsModal } from '../MovementDetailsModal';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadStockExcelTemplate } from '../../utils/universalDataTemplates';
import { parseStockExcelFile } from '../../utils/universalImporters';
import { exportRecordsToExcel } from '../../utils/excel';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Layers,
  FileSpreadsheet,
  Plus,
  BarChart3,
  Boxes,
} from 'lucide-react';

interface Props {
  products: Item[];
  records: Movement[];
  categories: string[];
  statuses: string[];
  settings: AppSettings;
  seq: { IN: number; OUT: number };
  auditLogs: AuditLog[];
  stocks: Record<string, ProductStock>;
  onSaveMovement: (record: Movement) => void;
  onDeleteRecord: (record: Movement) => void;
  onBulkDelete: (subIds: string[]) => void;
  onCloneRecord: (record: Movement) => void;
  onAddProduct: (newProduct: Item) => void;
  onEditProduct: (oldName: string, updatedProduct: Item) => void;
  onDeleteProduct: (product: Item) => void;
  onToggleProductActive: (product: Item) => void;
}

export const StockModule: React.FC<Props> = ({
  products,
  records,
  categories,
  statuses,
  settings,
  seq,
  auditLogs,
  stocks,
  onSaveMovement,
  onDeleteRecord,
  onBulkDelete,
  onCloneRecord,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleProductActive,
}) => {
  const [subTab, setSubTab] = useState<'records' | 'inventory' | 'reports' | 'dashboard'>('records');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Movement | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Movement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    const result = await parseStockExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف المرفق لا يحتوي على حركات مخزنية صالحة.' };
    }

    result.movements.forEach((mov) => {
      onSaveMovement(mov as any);
    });

    return {
      success: true,
      message: `تم استيراد وإدراج ${result.count} حركة توريد وصرف بنجاح!`,
    };
  };

  const handleExportJSON = () => {
    const data = {
      records,
      products,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_المخزون_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleOpenAddMovement = () => {
    setEditingRecord(null);
    setIsMovementModalOpen(true);
  };

  const handleEditRecord = (record: Movement) => {
    setEditingRecord(record);
    setIsMovementModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs p-5 md:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">ادارة صرف وتوريد</h1>
              <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                المخزون
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إدارة وتوثيق حركات التوريد (IN) والصرف (OUT)، جرد المخزون، والتقارير الرقابية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
            title="استيراد وتصدير حركات المخزون Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>استيراد Excel</span>
          </button>

          <button
            id="stock-add-movement-btn"
            onClick={handleOpenAddMovement}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all w-full md:w-auto justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل حركة جديدة (IN / OUT)</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar for Stock */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            subTab === 'records'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>سجل حركات التوريد والصرف ({records.length})</span>
        </button>

        <button
          onClick={() => setSubTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            subTab === 'inventory'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>دليل الأصناف وبطاقات الجرد ({products.length})</span>
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            subTab === 'reports'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>التقارير التحليلية والرقابية</span>
        </button>

        <button
          onClick={() => setSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
            subTab === 'dashboard'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>مؤشرات وإحصائيات المخزون</span>
        </button>
      </div>

      {/* Sub Views */}
      {subTab === 'records' && (
        <RecordsView
          records={records}
          products={products}
          categories={categories}
          statuses={statuses}
          onOpenAddModal={handleOpenAddMovement}
          onEditRecord={handleEditRecord}
          onDeleteRecord={onDeleteRecord}
          onCloneRecord={onCloneRecord}
          onViewRecord={(r) => setViewingRecord(r)}
          onBulkDelete={onBulkDelete}
        />
      )}

      {subTab === 'inventory' && (
        <InventoryView
          products={products}
          stocks={stocks}
          onAddProduct={onAddProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onToggleActive={onToggleProductActive}
        />
      )}

      {subTab === 'reports' && (
        <ReportsView
          records={records}
          products={products}
          stocks={stocks}
          categories={categories}
        />
      )}

      {subTab === 'dashboard' && (
        <DashboardView
          records={records}
          stocks={stocks}
          onOpenAddModal={handleOpenAddMovement}
          onViewRecord={(r) => setViewingRecord(r)}
          onGoToRecords={() => setSubTab('records')}
          onGoToInventory={() => setSubTab('inventory')}
          onGoToReports={() => setSubTab('reports')}
        />
      )}

      {/* Modals */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={onSaveMovement}
        editingRecord={editingRecord}
        products={products}
        records={records}
        categories={categories}
        statuses={statuses}
        seq={seq}
      />

      <MovementDetailsModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onEdit={(r) => {
          setEditingRecord(r);
          setIsMovementModalOpen(true);
        }}
      />

      {/* Universal Data Exchange Modal for Stock */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="صرف وتوريد المخزون"
        itemTypeName="حركات وسندات المخزون"
        icon={Package}
        themeColor="teal"
        supportedColumnsText="نوع الحركة (IN/OUT)، التاريخ، كود الصنف، اسم الصنف، المستودع، الكمية، السعر الفردي، الجهة / المورد، رقم السند"
        onDownloadTemplate={downloadStockExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={() => exportRecordsToExcel(records, products as any)}
        excelSubtitle="جدول حركات المخزون مع تفقيط وحسابات الأصناف"
        onExportJSON={handleExportJSON}
        jsonSubtitle="نسخة احتياطية كاملة لكافة حركات المخزون والأصناف"
      />
    </div>
  );
};
