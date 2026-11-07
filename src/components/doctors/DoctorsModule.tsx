import React, { useState, useMemo } from 'react';
import {
  DoctorAuditLog,
  DoctorRecord,
  DoctorVisitLog,
  DoctorVisitStatus,
} from '../../types';
import { DoctorDirectory } from './DoctorDirectory';
import { DoctorVisitsPlanner } from './DoctorVisitsPlanner';
import { DoctorReports } from './DoctorReports';
import { DoctorModal } from './DoctorModal';
import { DoctorDetailsModal } from './DoctorDetailsModal';
import { RecordDoctorVisitModal } from './RecordDoctorVisitModal';
import { ImportDoctorsModal } from './ImportDoctorsModal';
import { calculateDoctorStats, exportDoctorsToCSV, exportDoctorsToExcel } from '../../utils/doctors';
import { logDoctorAudit } from '../../utils/storage';
import {
  Stethoscope,
  Calendar,
  BarChart3,
  History,
  Plus,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  Layers,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  doctors: DoctorRecord[];
  visits: DoctorVisitLog[];
  auditLogs: DoctorAuditLog[];
  onUpdateDoctors: (doctors: DoctorRecord[]) => void;
  onUpdateVisits: (visits: DoctorVisitLog[]) => void;
  onAddAuditLog?: (action: DoctorAuditLog['action'], name: string, details: string) => void;
}

export const DoctorsModule: React.FC<Props> = ({
  doctors,
  visits,
  auditLogs,
  onUpdateDoctors,
  onUpdateVisits,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'directory' | 'planner' | 'reports' | 'audit'
  >('directory');

  // Modals state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<DoctorRecord | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<DoctorRecord | null>(null);

  const [isRecordVisitModalOpen, setIsRecordVisitModalOpen] = useState(false);
  const [selectedDoctorForVisit, setSelectedDoctorForVisit] = useState<DoctorRecord | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Dynamic lists from data
  const customRegions = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => d.region && set.add(d.region));
    return Array.from(set);
  }, [doctors]);

  const customRoutes = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => d.route && set.add(d.route));
    return Array.from(set);
  }, [doctors]);

  const customResponsibles = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => d.responsible && set.add(d.responsible));
    return Array.from(set);
  }, [doctors]);

  const customSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => d.specialty && set.add(d.specialty));
    return Array.from(set);
  }, [doctors]);

  // Overall Stats
  const stats = useMemo(() => calculateDoctorStats(doctors, visits), [doctors, visits]);

  // Handlers
  const handleSaveDoctor = (saved: DoctorRecord) => {
    const exists = doctors.some((d) => d.id === saved.id);
    let updated: DoctorRecord[];
    if (exists) {
      updated = doctors.map((d) => (d.id === saved.id ? saved : d));
      logDoctorAudit('تعديل', saved.name, `تم تعديل بيانات الطبيب ${saved.name} (${saved.id})`);
    } else {
      updated = [saved, ...doctors];
      logDoctorAudit(
        'إضافة',
        saved.name,
        `تم إضافة طبيب جديد ${saved.name} (${saved.id}) للتخصص ${saved.specialty}`
      );
    }
    onUpdateDoctors(updated);
  };

  const handleDeleteDoctor = (id: string) => {
    const target = doctors.find((d) => d.id === id);
    if (!target) return;
    if (window.confirm(`هل أنت متأكد من حذف الطبيب "${target.name}" نهائياً من دفتر الزيارات؟`)) {
      const updated = doctors.filter((d) => d.id !== id);
      onUpdateDoctors(updated);
      logDoctorAudit('حذف', target.name, `تم حذف الطبيب ${target.name} (${target.id}) من المنظومة`);
      setIsDetailsModalOpen(false);
    }
  };

  const handleSaveVisit = (
    visit: DoctorVisitLog,
    updatedDoctorStatus?: DoctorVisitStatus,
    samplesGiven?: string,
    visitResult?: string
  ) => {
    const updatedVisits = [visit, ...visits];
    onUpdateVisits(updatedVisits);

    // Update doctor's current status and visit history
    const updatedDoctors = doctors.map((d) => {
      if (d.id === visit.doctorId) {
        return {
          ...d,
          status: updatedDoctorStatus || d.status,
          samplesGiven: samplesGiven !== undefined ? samplesGiven : d.samplesGiven,
          visitResult: visitResult !== undefined ? visitResult : d.visitResult,
          lastVisitDate: visit.date,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    onUpdateDoctors(updatedDoctors);
    logDoctorAudit(
      'زيارة',
      visit.doctorName,
      `تم توثيق زيارة ميدانية للطبيب ${visit.doctorName} بواسطة ${visit.responsible} - النتيجة: ${visit.status}`
    );
  };

  const handleUpdateStatus = (doctorId: string, newStatus: DoctorVisitStatus) => {
    const updated = doctors.map((d) => {
      if (d.id === doctorId) {
        return { ...d, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return d;
    });
    onUpdateDoctors(updated);
    const doc = doctors.find((d) => d.id === doctorId);
    if (doc) {
      logDoctorAudit('تعديل', doc.name, `تم تغيير حالة الزيارة إلى "${newStatus}"`);
    }
  };

  const handleImportDoctors = (importedDoctors: DoctorRecord[], mode: 'append' | 'replace') => {
    let finalDoctors: DoctorRecord[];
    if (mode === 'replace') {
      finalDoctors = importedDoctors;
      logDoctorAudit(
        'استيراد',
        'دفتر الأطباء',
        `تم استبدال كامل دفتر الأطباء واستيراد ${importedDoctors.length} طبيب من ملف Excel/CSV`
      );
    } else {
      // Append mode with overwrite for matching IDs
      const map = new Map<string, DoctorRecord>();
      doctors.forEach((d) => map.set(d.id, d));
      importedDoctors.forEach((d) => map.set(d.id, d));
      finalDoctors = Array.from(map.values());
      logDoctorAudit(
        'استيراد',
        'دفتر الأطباء',
        `تم دمج واستيراد ${importedDoctors.length} سجل طبيب جديد في المنظومة`
      );
    }
    onUpdateDoctors(finalDoctors);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white/95 dark:bg-slate-900/85 backdrop-blur-xs rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-fade-in-up stagger-1">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  ادارة الاطباء وزيارات
                </h1>
                <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
                  العيادات والمراكز
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                جدولة وتوثيق الزيارات الطبية الميدانية، تتبع العينات الترويجية، وقياس أداء المناديب
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">إجمالي الأطباء</span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">{stats.totalDoctors}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-xs text-teal-600 dark:text-teal-400 block font-bold">نسبة إنجاز الخطة</span>
              <span className="text-base font-black font-mono text-teal-600 dark:text-teal-400">
                {stats.visitCompletionRate}%
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-bold">الزيارات المكتملة</span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {stats.completedVisitsCount}
              </span>
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
              title="استيراد وتصدير بيانات الأطباء والزيارات Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>استيراد Excel</span>
            </button>

            <button
              onClick={() => {
                setSelectedDoctorForEdit(null);
                setIsDoctorModalOpen(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة طبيب</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto text-xs font-black no-scrollbar">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'directory'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>دليل الأطباء والمراكز</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                activeSubTab === 'directory' ? 'bg-teal-700 dark:bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {doctors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('planner')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'planner'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>جدول ومخطط الزيارات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'reports'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>التقارير وأداء المناديب</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'audit'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل العمليات والتدقيق</span>
            {auditLogs.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                  activeSubTab === 'audit' ? 'bg-teal-700 dark:bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {auditLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Views Container */}
      {activeSubTab === 'directory' && (
        <DoctorDirectory
          doctors={doctors}
          onAddDoctor={() => {
            setSelectedDoctorForEdit(null);
            setIsDoctorModalOpen(true);
          }}
          onEditDoctor={(doc) => {
            setSelectedDoctorForEdit(doc);
            setIsDoctorModalOpen(true);
          }}
          onDeleteDoctor={handleDeleteDoctor}
          onViewDoctor={(doc) => {
            setSelectedDoctorForDetails(doc);
            setIsDetailsModalOpen(true);
          }}
          onRecordVisit={(doc) => {
            setSelectedDoctorForVisit(doc);
            setIsRecordVisitModalOpen(true);
          }}
          onUpdateStatus={handleUpdateStatus}
          onExportExcel={() => exportDoctorsToExcel(doctors)}
          onExportCSV={() => exportDoctorsToCSV(doctors)}
          onOpenImport={() => setIsImportModalOpen(true)}
          customRegions={customRegions}
          customRoutes={customRoutes}
          customResponsibles={customResponsibles}
          customSpecialties={customSpecialties}
        />
      )}

      {activeSubTab === 'planner' && (
        <DoctorVisitsPlanner
          doctors={doctors}
          onRecordVisit={(doc) => {
            setSelectedDoctorForVisit(doc);
            setIsRecordVisitModalOpen(true);
          }}
          onViewDoctor={(doc) => {
            setSelectedDoctorForDetails(doc);
            setIsDetailsModalOpen(true);
          }}
          onUpdateStatus={handleUpdateStatus}
          onAddDoctor={() => {
            setSelectedDoctorForEdit(null);
            setIsDoctorModalOpen(true);
          }}
          customResponsibles={customResponsibles}
        />
      )}

      {activeSubTab === 'reports' && <DoctorReports doctors={doctors} visits={visits} />}

      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-700 dark:text-teal-300" />
              سجل التدقيق والعمليات لدفتر الأطباء
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">
              {auditLogs.length} حركة مسجلة
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
              لا توجد سجلات تدقيق مسجلة حتى الآن
            </div>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                          log.action === 'إضافة'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'تعديل'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'حذف'
                            ? 'bg-rose-100 text-rose-800'
                            : log.action === 'استيراد'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{log.targetName}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">{log.details}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('ar-YE') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => {
          setIsDoctorModalOpen(false);
          setSelectedDoctorForEdit(null);
        }}
        onSave={handleSaveDoctor}
        doctorToEdit={selectedDoctorForEdit}
        existingDoctors={doctors}
        customRegions={customRegions}
        customRoutes={customRoutes}
        customResponsibles={customResponsibles}
        customSpecialties={customSpecialties}
      />

      <DoctorDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedDoctorForDetails(null);
        }}
        doctor={selectedDoctorForDetails}
        visits={visits}
        onEdit={(doc) => {
          setIsDetailsModalOpen(false);
          setSelectedDoctorForEdit(doc);
          setIsDoctorModalOpen(true);
        }}
        onDelete={handleDeleteDoctor}
        onRecordVisit={(doc) => {
          setIsDetailsModalOpen(false);
          setSelectedDoctorForVisit(doc);
          setIsRecordVisitModalOpen(true);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      <RecordDoctorVisitModal
        isOpen={isRecordVisitModalOpen}
        onClose={() => {
          setIsRecordVisitModalOpen(false);
          setSelectedDoctorForVisit(null);
        }}
        doctor={selectedDoctorForVisit}
        onSaveVisit={handleSaveVisit}
        customResponsibles={customResponsibles}
      />

      <ImportDoctorsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingDoctors={doctors}
        onImportDoctors={handleImportDoctors}
      />
    </div>
  );
};
