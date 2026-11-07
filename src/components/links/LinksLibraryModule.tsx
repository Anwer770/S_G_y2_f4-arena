import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LinkRecord,
  LinksKPIs,
  LinkClassification,
  LinkCategory,
} from '../../types/linksLibrary';
import {
  loadLinksRecords,
  saveLinksRecords,
  loadLinkClassifications,
  loadLinkCategories,
  loadLinkTypes,
  loadLinkImportances,
  calculateLinksKPIs,
  resetLinksToDefault,
} from '../../utils/storage';
import {
  filterLinks,
  exportLinksToCSV,
  exportLinksToExcel,
  exportLinksToJSON,
} from '../../utils/linksExport';
import { UniversalDataExchangeModal } from '../common/UniversalDataExchangeModal';
import { downloadLinksExcelTemplate } from '../../utils/universalDataTemplates';
import { parseLinksExcelFile } from '../../utils/universalImporters';
import { LinksStatsCards } from './LinksStatsCards';
import { LinksGridView } from './LinksGridView';
import { LinksTableView } from './LinksTableView';
import { LinkModal } from './LinkModal';
import { LinksPrintReport } from './LinksPrintReport';
import {
  Globe,
  Plus,
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
  Printer,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Star,
  ShieldCheck,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const LinksLibraryModule: React.FC = () => {
  // Data States
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [importances, setImportances] = useState<string[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('الكل');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedType, setSelectedType] = useState('الكل');
  const [selectedImportance, setSelectedImportance] = useState('الكل');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyAI, setOnlyAI] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'print'>('grid');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    const result = await parseLinksExcelFile(file);
    if (result.count === 0) {
      return { success: false, message: 'الملف لا يحتوي على روابط صالحة.' };
    }

    const map = new Map<string, LinkRecord>();
    links.forEach((l) => map.set(l.id, l));
    result.links.forEach((l) => map.set(l.id, l));
    const merged = Array.from(map.values());

    setLinks(merged);
    saveLinksRecords(merged);

    return {
      success: true,
      message: `تم استيراد ${result.count} رابط بنجاح!`,
    };
  };

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    setLinks(loadLinksRecords());
    setClassifications(loadLinkClassifications());
    setCategories(loadLinkCategories());
    setTypes(loadLinkTypes());
    setImportances(loadLinkImportances());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPIs
  const kpis: LinksKPIs = useMemo(() => {
    return calculateLinksKPIs(links);
  }, [links]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return filterLinks(links, {
      search,
      classification: selectedClassification,
      category: selectedCategory,
      type: selectedType,
      importance: selectedImportance,
      onlyFavorites,
      onlyAI,
    });
  }, [
    links,
    search,
    selectedClassification,
    selectedCategory,
    selectedType,
    selectedImportance,
    onlyFavorites,
    onlyAI,
  ]);

  // CRUD Handlers
  const handleSaveLink = (linkData: LinkRecord) => {
    let updated: LinkRecord[];
    const exists = links.some((l) => l.id === linkData.id);

    if (exists) {
      updated = links.map((l) => (l.id === linkData.id ? linkData : l));
      showToast('تم تعديل بيانات الرابط بنجاح');
    } else {
      updated = [linkData, ...links];
      showToast('تمت إضافة الرابط الجديد بنجاح');
    }

    setLinks(updated);
    saveLinksRecords(updated);
  };

  const handleDeleteLink = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الرابط؟')) {
      const updated = links.filter((l) => l.id !== id);
      setLinks(updated);
      saveLinksRecords(updated);
      showToast('تم حذف الرابط');
    }
  };

  const handleCloneLink = (link: LinkRecord) => {
    const cloned: LinkRecord = {
      ...link,
      id: `LNK-${Date.now().toString(36).toUpperCase()}`,
      siteName: `${link.siteName} (نسخة)`,
      visitCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [cloned, ...links];
    setLinks(updated);
    saveLinksRecords(updated);
    showToast('تم استنساخ الرابط بنجاح');
  };

  const handleToggleFavorite = (id: string) => {
    const updated = links.map((l) =>
      l.id === id ? { ...l, isFavorite: !l.isFavorite } : l
    );
    setLinks(updated);
    saveLinksRecords(updated);
  };

  const handleVisit = (id: string, _url: string) => {
    const updated = links.map((l) =>
      l.id === id ? { ...l, visitCount: (l.visitCount || 0) + 1 } : l
    );
    setLinks(updated);
    saveLinksRecords(updated);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClassification('الكل');
    setSelectedCategory('الكل');
    setSelectedType('الكل');
    setSelectedImportance('الكل');
    setOnlyFavorites(false);
    setOnlyAI(false);
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'هل ترغب في استعادة القائمة الافتراضية الشاملة لمكتبة الروابط (+50 رابط مصنف وموثق)؟'
      )
    ) {
      resetLinksToDefault();
      setLinks(loadLinksRecords());
      showToast('تمت استعادة القائمة الافتراضية بنجاح (+50 رابط)');
    }
  };

  // Handle JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedLinks = parsed.links || parsed;
        if (Array.isArray(importedLinks) && importedLinks.length > 0) {
          const merged = [...importedLinks, ...links];
          // Deduplicate by URL or ID
          const unique = Array.from(
            new Map(merged.map((item) => [item.url, item])).values()
          );
          setLinks(unique);
          saveLinksRecords(unique);
          showToast(`تم استيراد ${importedLinks.length} رابط بنجاح`);
        } else {
          alert('الملف لا يحتوي على بيانات روابط صالحة');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف JSON');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-800/60 p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Main Header */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                مكتبة الروابط
              </h1>
              <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                {links.length} رابط
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              فهرس شامل لأهم مواقع الذكاء الاصطناعي، أدوات الإكسل والأوفيس، محركات البحث، والخدمات التقنية
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal Data Exchange Modal (Excel Import/Export) */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="استيراد وتصدير مكتبة الروابط Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>استيراد إكسل</span>
          </button>

          {/* Add New Link Button */}
          <button
            onClick={() => {
              setEditingLink(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رابط جديد</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportLinksToCSV(filteredLinks)}
            title="تصدير CSV متوافق مع Excel"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={() => exportLinksToJSON(links)}
            title="تصدير نسخة JSON"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl transition-colors text-xs font-bold cursor-pointer"
          >
            JSON
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="استيراد روابط من ملف JSON"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-500" />
          </button>

          {/* Reset to Default */}
          <button
            onClick={handleResetToDefault}
            title="استعادة الروابط الافتراضية"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <LinksStatsCards
        kpis={kpis}
        activeFilter={{
          onlyFavorites,
          onlyAI,
          classification: selectedClassification,
          importance: selectedImportance,
        }}
        onFilterChange={(updates) => {
          if (updates.onlyFavorites !== undefined) setOnlyFavorites(updates.onlyFavorites);
          if (updates.onlyAI !== undefined) setOnlyAI(updates.onlyAI);
          if (updates.classification !== undefined) setSelectedClassification(updates.classification);
          if (updates.importance !== undefined) setSelectedImportance(updates.importance);
        }}
      />

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-black">
        <button
          onClick={() => {
            setSelectedClassification('الكل');
            setOnlyAI(false);
            setOnlyFavorites(false);
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            selectedClassification === 'الكل' && !onlyAI && !onlyFavorites
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          كافة الروابط ({links.length})
        </button>

        <button
          onClick={() => {
            setOnlyAI(true);
            setOnlyFavorites(false);
            setSelectedClassification('الكل');
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            onlyAI
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>الذكاء الاصطناعي ({kpis.aiCount})</span>
        </button>

        <button
          onClick={() => {
            setOnlyFavorites(true);
            setOnlyAI(false);
            setSelectedClassification('الكل');
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            onlyFavorites
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>المفضلة ({kpis.favoritesCount})</span>
        </button>

        <button
          onClick={() => {
            setSelectedClassification('الاوفس الاكسل');
            setOnlyAI(false);
            setOnlyFavorites(false);
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedClassification === 'الاوفس الاكسل'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>أوفيس وإكسل ({kpis.officeCount})</span>
        </button>

        <button
          onClick={() => {
            setSelectedClassification('الامن سيبراني');
            setOnlyAI(false);
            setOnlyFavorites(false);
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedClassification === 'الامن سيبراني'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>أمن سيبراني ({kpis.securityCount})</span>
        </button>

        <button
          onClick={() => {
            setSelectedClassification('محركات بحث');
            setOnlyAI(false);
            setOnlyFavorites(false);
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            selectedClassification === 'محركات بحث'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
          }`}
        >
          محركات بحث
        </button>

        <button
          onClick={() => {
            setSelectedClassification('تصميم');
            setOnlyAI(false);
            setOnlyFavorites(false);
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            selectedClassification === 'تصميم'
              ? 'bg-pink-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/40'
          }`}
        >
          تصميم وميديا
        </button>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الوصف، الرابط، التصنيف، الأهمية..."
            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Classification Filter */}
          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="الكل">كل التصنيفات ({classifications.length})</option>
            {classifications.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Importance Filter */}
          <select
            value={selectedImportance}
            onChange={(e) => setSelectedImportance(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="الكل">كل درجات الأهمية</option>
            {importances.map((imp) => (
              <option key={imp} value={imp}>
                الأهمية: {imp}
              </option>
            ))}
          </select>

          {/* Clear Filters Button (shown if any filter active) */}
          {(search ||
            selectedClassification !== 'الكل' ||
            selectedCategory !== 'الكل' ||
            selectedType !== 'الكل' ||
            selectedImportance !== 'الكل' ||
            onlyFavorites ||
            onlyAI) && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>مسح الفلتر</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              title="عرض البطاقات"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('table')}
              title="عرض الجدول"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('print')}
              title="عرض تقرير الطباعة"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'print'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'print' ? (
        <LinksPrintReport
          links={filteredLinks}
          kpis={kpis}
          onBack={() => setViewMode('grid')}
        />
      ) : viewMode === 'table' ? (
        <LinksTableView
          links={filteredLinks}
          onToggleFavorite={handleToggleFavorite}
          onVisit={handleVisit}
          onEdit={(link) => {
            setEditingLink(link);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteLink}
          onClone={handleCloneLink}
        />
      ) : (
        <LinksGridView
          links={filteredLinks}
          onToggleFavorite={handleToggleFavorite}
          onVisit={handleVisit}
          onEdit={(link) => {
            setEditingLink(link);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteLink}
          onClone={handleCloneLink}
          onAddNew={() => {
            setEditingLink(null);
            setIsModalOpen(true);
          }}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Add / Edit Modal */}
      <LinkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        initialData={editingLink}
        classifications={classifications}
        categories={categories}
        types={types}
        importances={importances}
      />

      {/* Universal Data Exchange Modal for Links Library */}
      <UniversalDataExchangeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="مكتبة الروابط والأدوات"
        itemTypeName="الروابط والأدوات والمواقع"
        icon={Globe}
        themeColor="teal"
        supportedColumnsText="المعرف، اسم الموقع/الأداة، الوصف، الرابط الإلكتروني، النوع، التصنيف، الفئة، الأهمية، مفضل، والملاحظات"
        onDownloadTemplate={downloadLinksExcelTemplate}
        onImportFile={handleImportFile}
        onExportExcel={() => exportLinksToExcel(links)}
        excelSubtitle="ملف إكسل كامل بمكتبة الروابط مع ورقة عمل عربية منسقة"
        onExportJSON={() => exportLinksToJSON(links)}
        jsonSubtitle="تصدير نسخة احتياطية بصيغة JSON شاملة لكافة الحقول"
      />
    </div>
  );
};
