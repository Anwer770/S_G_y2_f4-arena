/** محرّر الملاحظات — مكوّن العرض (المنطق في `useNoteEditorModel`، R30). */
import React from 'react';
import { NotePriority, NoteStatus, NoteType } from '../../types';
import {
  Bold,
  Briefcase,
  Calendar,
  CheckSquare,
  Clock,
  Code,
  Edit3,
  Eye,
  FileText,
  Folder,
  Heading2,
  Heading3,
  HelpCircle,
  Italic,
  Link,
  List,
  Lock,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Quote,
  Save,
  Sparkles,
  Stethoscope,
  Table,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { NoteEditorModalProps } from './noteEditorTypes';
import { useNoteEditorModel } from './useNoteEditorModel';

export const NoteEditorModal: React.FC<NoteEditorModalProps> = (props) => {
  const {
    aiAnalysisResult,
    applyAiSummary,
    applyAiTagsAndCategory,
    applyAiTasks,
    attachments,
    category,
    content,
    folderId,
    handleAddTag,
    handleAddTask,
    handleDeleteTask,
    handleFileUpload,
    handleRemoveAttachment,
    handleRemoveTag,
    handleRunAiAnalysis,
    handleSubmit,
    handleToggleTask,
    insertFormatting,
    isAiProcessing,
    isFavorite,
    isLocked,
    isNew,
    isPinned,
    isRecording,
    linkedCustomerName,
    linkedDoctorName,
    linkedProject,
    newTagInput,
    newTaskDueDate,
    newTaskText,
    nextReviewDate,
    noteTypes,
    pinCode,
    previewMode,
    priority,
    selectedTags,
    setCategory,
    setContent,
    setFolderId,
    setIsFavorite,
    setIsLocked,
    setIsPinned,
    setLinkedCustomerName,
    setLinkedDoctorName,
    setLinkedProject,
    setNewTagInput,
    setNewTaskDueDate,
    setNewTaskText,
    setNextReviewDate,
    setPinCode,
    setPreviewMode,
    setPriority,
    setShowAiToolkit,
    setSource,
    setStatus,
    setSummary,
    setTitle,
    setType,
    showAiToolkit,
    source,
    status,
    summary,
    tasks,
    title,
    toggleVoiceRecording,
    type,
    isOpen,
    onClose,
    noteToEdit,
    folders,
    customersList,
    doctorsList,
    onSave,
  } = useNoteEditorModel(props);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl my-auto bg-white dark:bg-slate-900 rounded-xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] sm:max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {isNew ? 'إنشاء ملاحظة جديدة في قاعدة المعرفة' : `تعديل الملاحظة: ${noteToEdit?.title}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isNew ? 'وثّق معلوماتك وأفكارك واربطها بالعملاء والمهام والمشاريع' : `الكود: ${noteToEdit?.id}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'جارٍ التحليل...' : 'مساعد الذكاء الاصطناعي'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Toolkit Drawer / Banner */}
        {showAiToolkit && aiAnalysisResult && (
          <div className="bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/60 p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-800 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>اقتراحات المعالج الذكي (AI Suggestions)</span>
              </div>
              <button
                onClick={() => setShowAiToolkit(false)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                إخفاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Summary Suggestion */}
              {aiAnalysisResult.suggestedSummary && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">الملخص المقترح:</div>
                  <p className="text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                    {aiAnalysisResult.suggestedSummary}
                  </p>
                  <button
                    type="button"
                    onClick={applyAiSummary}
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    + اعتماد كملخص
                  </button>
                </div>
              )}

              {/* Tasks Suggestion */}
              {aiAnalysisResult.extractedTasks.length > 0 && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    مهام مكتشفة ({aiAnalysisResult.extractedTasks.length}):
                  </div>
                  <ul className="text-slate-600 dark:text-slate-400 mb-2 space-y-0.5">
                    {aiAnalysisResult.extractedTasks.slice(0, 2).map((t, idx) => (
                      <li key={idx} className="truncate">
                        • {t.text}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={applyAiTasks}
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    + إدراج بقائمة المهام
                  </button>
                </div>
              )}

              {/* Auto Category & Tags */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">التصنيف والوسوم:</div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  نوع: {aiAnalysisResult.suggestedType} | وسوم: {aiAnalysisResult.suggestedTags.join(', ') || 'عام'}
                </p>
                <button
                  type="button"
                  onClick={applyAiTagsAndCategory}
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  + تطبيق التصنيف والوسوم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                عنوان الملاحظة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنواناً واضحاً وموجزاً للملاحظة..."
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">نوع الملاحظة</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NoteType)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              >
                {noteTypes.map((nt) => (
                  <option key={nt.id} value={nt.id}>
                    {nt.icon} {nt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categorization & Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            {/* Folder */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>المجلد</span>
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">التصنيف الرئيسي</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="العمل، المالية، مبيعات..."
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotePriority)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="عالية">🔴 عالية الأهمية</option>
                <option value="متوسطة">🟡 متوسطة</option>
                <option value="منخفضة">🟢 منخفضة</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NoteStatus)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="نشطة">⚡ نشطة ومتابعة</option>
                <option value="جديدة">✨ جديدة</option>
                <option value="مسودة">📝 مسودة</option>
                <option value="قيد المراجعة">⏳ قيد المراجعة</option>
                <option value="مكتملة">✅ مكتملة</option>
                <option value="مؤرشفة">📦 مؤرشفة</option>
              </select>
            </div>
          </div>

          {/* Rich Content Editor with Formatting Toolbar */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1">
                {/* Formatting Tools */}
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  title="عريض (Bold)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  title="مائل (Italic)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  title="عنوان H2"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  title="عنوان H3"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  title="قائمة نقطية"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- [ ] ')}
                  title="قائمة مهام قابلة للتأشير"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  title="اقتباس"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('```\n', '\n```')}
                  title="كتلة كود"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n| البند | البيان | القيمة |\n|:---|:---|:---:|\n| 1 |  |  |\n')}
                  title="إدراج جدول"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <Table className="w-4 h-4" />
                </button>

                <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                {/* Voice Dictation */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  title={isRecording ? 'إيقاف الإملاء الصوتي' : 'بدء الإملاء الصوتي المباشر'}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'جارٍ الاستماع...' : 'إملاء صوتي'}</span>
                </button>
              </div>

              {/* Preview Toggle */}
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  previewMode
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{previewMode ? 'محرر النص' : 'معاينة Markdown'}</span>
              </button>
            </div>

            {/* Content Textarea or Markdown View */}
            {previewMode ? (
              <div className="w-full min-h-[220px] max-h-[350px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                {content ? (
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{content}</div>
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 italic">لا يوجد محتوى للمعاينة بعد...</p>
                )}
              </div>
            ) : (
              <textarea
                id="note-content-area"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب محتوى الملاحظة هنا... يمكنك استخدام صياغة Markdown، الجداول، القوائم، أو الضغط على زر الإملاء الصوتي."
                rows={9}
                className="w-full px-4 py-3 text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-mono leading-relaxed"
              />
            )}
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>الملخص التنفيذي (Executive Summary)</span>
              <span className="text-slate-400 dark:text-slate-500 text-xs">
                اختياري — يظهر في كروت العرض والبحث السريع
              </span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="ملخص مكثف من سطر واحد لأهم ما ورد في الملاحظة..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Embedded Tasks / Checklists */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>المهام والتكليفات المنبثقة من هذه الملاحظة ({tasks.length})</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {tasks.filter((t) => t.completed).length} منجز من {tasks.length}
              </span>
            </div>

            {/* Existing Tasks List */}
            {tasks.length > 0 && (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span
                        className={`truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200 font-medium'}`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Task Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="أضف مهمة جديدة ناتجة عن هذه الملاحظة..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مهمة</span>
              </button>
            </div>
          </div>

          {/* Cross-Entity Links Row (Customers / Doctors / Tasks / Projects) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Link className="w-4 h-4 text-indigo-500" />
              <span>الربط الشبكي بالكيانات (Connected Knowledge Graph)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Linked Customer */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <User className="w-3 h-3 text-blue-500" />
                  <span>العميل المرتبط</span>
                </label>
                <input
                  type="text"
                  value={linkedCustomerName}
                  onChange={(e) => setLinkedCustomerName(e.target.value)}
                  placeholder="اسم العميل أو المركز..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Linked Doctor */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Stethoscope className="w-3 h-3 text-emerald-500" />
                  <span>الطبيب المرتبط</span>
                </label>
                <input
                  type="text"
                  value={linkedDoctorName}
                  onChange={(e) => setLinkedDoctorName(e.target.value)}
                  placeholder="اسم الطبيب أو العيادة..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Linked Project */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-3 h-3 text-purple-500" />
                  <span>المشروع المرتبط</span>
                </label>
                <input
                  type="text"
                  value={linkedProject}
                  onChange={(e) => setLinkedProject(e.target.value)}
                  placeholder="اسم المشروع أو المبادرة..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Source */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <HelpCircle className="w-3 h-3 text-amber-500" />
                  <span>المصدر / المرجع</span>
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="اجتماع، اتصال، كتاب، رابط..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Tags & Review Date & Security Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Tags (Col 6) */}
            <div className="md:col-span-6 space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>الوسوم والكلمات المفتاحية (Tags)</span>
              </label>

              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full"
                  >
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="أضف وسماً واضغط Enter..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* Review Date & Security (Col 6) */}
            <div className="md:col-span-6 space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
              {/* Next Review Date */}
              <div className="space-y-1">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    تاريخ المراجعة القادمة
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">ينبهك النظام عند حلول الموعد</span>
                </label>
                <input
                  type="date"
                  value={nextReviewDate}
                  onChange={(e) => setNextReviewDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Pin & Lock Options */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 dark:text-indigo-400"
                  />
                  <span>📌 تثبيت في أعلى القائمة</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span>⭐ إضافة للمفضلة</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 dark:text-rose-400"
                  />
                  <span>🔒 قفل برمز PIN</span>
                </label>
              </div>

              {isLocked && (
                <div className="pt-1">
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="أدخل رمز PIN للقفل (مثال: 1234)..."
                    maxLength={8}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>المرفقات والملفات ({attachments.length})</span>
              </div>

              <label className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>إرفاق ملفات / صور</span>
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{att.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'حفظ الملاحظة' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
