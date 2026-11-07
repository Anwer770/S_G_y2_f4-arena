import React, { useState } from 'react';
import { NoteRecord, NoteTemplate } from '../../types';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  Search,
  BookOpen,
} from 'lucide-react';
import { smartAnalyzeNoteText } from '../../utils/notes';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteRecord[];
  onCreateNoteFromAi: (title: string, content: string, category: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestedNote?: {
    title: string;
    content: string;
    category: string;
  };
  time: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  notes,
  onCreateNoteFromAi,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `مرحباً بك! أنا مساعد الذكاء الاصطناعي الخاص بقاعدة المعرفة والملاحظات.
لدي وصول إلى كافة ملاحظاتك ومحاضر اجتماعاتك وأفكارك (${(notes || []).length} ملاحظة).
يمكنني الإجابة عن أي استفسار، استخراج المهام العالقة، كتابة ملخصات تنفيذية، أو صياغة مسودات جديدة. كيف يمكنني مساعدتك اليوم؟`,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const quickPrompts = [
    'لخص لي أهم القرارات والاتفاقات في الملاحظات الأخيرة',
    'ما هي المهام العالقة التي تحتاج إلى متابعة عاجلة؟',
    'اكتب لي مسودة محضر اجتماع مع عميل جديد',
    'حلل تصنيفات الملاحظات وقدم مقترحات لتحسين سير العمل',
  ];

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    setTimeout(() => {
      let aiResponseText = '';
      let suggestedNote: ChatMessage['suggestedNote'] | undefined = undefined;

      const lower = textToSend.toLowerCase();

      if (lower.includes('لخص') || lower.includes('ملخص') || lower.includes('قرارات')) {
        const activeNotes = notes.slice(0, 5);
        aiResponseText = `بناءً على تحليل الملاحظات الأخيرة:\n\n` +
          activeNotes.map((n, i) => `**${i + 1}. ${n.title}** (${n.category}):\n${n.summary || n.content.substring(0, 100)}...`).join('\n\n') +
          `\n\n📌 **الخلاصة:** يتضح التركيز الحالي على متابعة الذمم وتطوير استراتيجية التوزيع للربع القادم.`;
      } else if (lower.includes('مهام') || lower.includes('عالق') || lower.includes('متابعة')) {
        const allTasks = notes.flatMap((n) => (n.tasks || []).map((t) => ({ ...t, noteTitle: n.title })));
        const pendingTasks = allTasks.filter((t) => !t.completed);

        if (pendingTasks.length > 0) {
          aiResponseText = `تم استخراج ${pendingTasks.length} مهمة غير مكتملة من قاعدة الملاحظات:\n\n` +
            pendingTasks.map((t, idx) => `• **${t.text}** (الأولوية: ${t.priority || 'متوسطة'}${t.dueDate ? ` | الاستحقاق: ${t.dueDate}` : ''}) — من ملاحظة "${t.noteTitle}"`).join('\n');
        } else {
          aiResponseText = `رائع! لا توجد حالياً مهام غير مكتملة داخل الملاحظات.`;
        }
      } else if (lower.includes('مسودة') || lower.includes('اكتب') || lower.includes('محضر') || lower.includes('صيغ')) {
        aiResponseText = `قمت بصياغة مسودة قياسية متكاملة لك جاهزة للاستخدام:`;
        suggestedNote = {
          title: `محضر اجتماع - ${new Date().toLocaleDateString('ar-YE')}`,
          content: `## أهداف الاجتماع:\n- مناقشة مؤشرات الأداء ومراجعة الخطط التشغيلية.\n- وضع جدول زمني لتنفيذ المهام ذات الأولوية.\n\n## الحضور:\n- الإدارة التنفيذية، فريق العمليات.\n\n## القرارات المتخذة:\n1. اعتماد خطة التطوير للفترة القادمة.\n2. تكليف المسؤولين بمتابعة التنفيذ وفق المواعيد المقررة.\n\n## التوصيات والمتابعة:\n- جدولة اجتماع مراجعة بعد أسبوعين.`,
          category: 'العمل',
        };
      } else {
        // General search & reasoning across notes
        const matchingNotes = notes.filter((n) =>
          n.title.toLowerCase().includes(lower) ||
          n.content.toLowerCase().includes(lower) ||
          n.tags?.some((tag) => tag.toLowerCase().includes(lower))
        );

        if (matchingNotes.length > 0) {
          aiResponseText = `وجدت ${matchingNotes.length} ملاحظة ذات صلة بطلبك:\n\n` +
            matchingNotes.slice(0, 3).map((n) => `• **${n.title}** (${n.date}): ${n.summary || n.content.substring(0, 120)}...`).join('\n\n');
        } else {
          aiResponseText = `قمت بمسح جميع الملاحظات (${notes.length} ملاحظة)، ولم أجد تطابقاً حرفياً مباشراً. لكن بناءً على معرفتي بالمنظومة، أوصي بإنشاء ملاحظة جديدة لتوثيق هذا الموضوع.`;
        }
      }

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        suggestedNote,
        time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsProcessing(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-3xl my-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                <span>مساعد الذكاء الاصطناعي لقاعدة المعرفة</span>
                <span className="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full font-bold">
                  AI v2.0
                </span>
              </h2>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                استنتاج ذكي، استخراج المهام والقرارات، والإجابة الدقيقة من واقع الملاحظات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] p-4 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* Suggested Note Card if created by AI */}
                {msg.suggestedNote && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                    <div className="font-bold text-purple-700 dark:text-purple-300">
                      📄 {msg.suggestedNote.title}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {msg.suggestedNote.content}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNoteFromAi(
                          msg.suggestedNote!.title,
                          msg.suggestedNote!.content,
                          msg.suggestedNote!.category
                        );
                        onClose();
                      }}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حفظ هذه المسودة كملاحظة جديدة</span>
                    </button>
                  </div>
                )}

                <div
                  className={`text-xs mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl rounded-tl-none text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                <span>المساعد يحلل الملاحظات ويصيغ الإجابة...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">مقترحات:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 hover:text-purple-600 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="اطلب ملخصاً، ابحث عن موضوع، أو اطلب صياغة مسودة..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputQuery.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
