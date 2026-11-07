#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تحويل آلي (Codemod): إضافة مقابلات الوضع الليلي `dark:` للأصناف اللونية الناقصة.

ضمانات السلامة:
  1) إضافات فقط — لا يُحذف ولا يُعدَّل أي صنف قائم ⇒ الوضع النهاري مطابق حرفياً قبل/بعد.
  2) لا تُلمس أي أسطر منطقية: التعديل محصور داخل قيم `className=` فقط.
  3) تُستثنى المكونات المحمية (Protected Components) بالكامل.
  4) تُستثنى الملفات غير الموصولة (كود ميت) — لا قيمة للمستخدم منها.
  5) لا يُضاف مقابل ليلي لخاصية (bg/text/border/divide/ring) موجود لها مقابل في نفس العنصر.
  6) Idempotent: تشغيله مرتين لا يضيف شيئاً في المرة الثانية.

الاستخدام:
  python3 tools/audit/darkmode_codemod.py --dry-run     # عرض ما سيحدث
  python3 tools/audit/darkmode_codemod.py               # التنفيذ
  python3 tools/audit/darkmode_codemod.py --all         # بلا استثناء الكود الميت
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
AUDIT = os.path.join(ROOT, 'docs', 'تدقيق')
DRY = '--dry-run' in sys.argv
INCLUDE_DEAD = '--all' in sys.argv
INCLUDE_PROTECTED = '--include-protected' in sys.argv  # Visual Refactoring داخل المكونات المحمية (أصناف dark: فقط)

# ------------------------------------------------------------------ خريطة التحويل
# prop-color-shade  →  utility ليلي
MAP = {
    # محايد
    'bg-white': 'bg-slate-900',
    'bg-slate-50': 'bg-slate-800/60',
    'bg-slate-100': 'bg-slate-800',
    'bg-slate-200': 'bg-slate-700',
    'text-slate-900': 'text-slate-100',
    'text-slate-800': 'text-slate-200',
    'text-slate-700': 'text-slate-200',
    'text-slate-600': 'text-slate-300',
    'text-slate-500': 'text-slate-400',
    'text-slate-400': 'text-slate-500',
    'border-slate-100': 'border-slate-800',
    'border-slate-200': 'border-slate-700',
    'border-slate-300': 'border-slate-600',
    'divide-slate-100': 'divide-slate-800',
    'divide-slate-200': 'divide-slate-700',
    'ring-slate-200': 'ring-slate-700',
    # تدرجات فاتحة (tints) — تُصبح تدرجات داكنة شفافة
    'bg-teal-50': 'bg-teal-950/40', 'bg-teal-100': 'bg-teal-900/40',
    'text-teal-600': 'text-teal-400', 'text-teal-700': 'text-teal-300', 'text-teal-800': 'text-teal-200',
    'border-teal-100': 'border-teal-900', 'border-teal-200': 'border-teal-800',
    'bg-emerald-50': 'bg-emerald-950/40', 'bg-emerald-100': 'bg-emerald-900/40',
    'text-emerald-600': 'text-emerald-400', 'text-emerald-700': 'text-emerald-300', 'text-emerald-800': 'text-emerald-200',
    'border-emerald-100': 'border-emerald-900', 'border-emerald-200': 'border-emerald-800',
    'bg-rose-50': 'bg-rose-950/40', 'bg-rose-100': 'bg-rose-900/40',
    'text-rose-600': 'text-rose-400', 'text-rose-700': 'text-rose-300', 'text-rose-800': 'text-rose-200',
    'border-rose-100': 'border-rose-900', 'border-rose-200': 'border-rose-800',
    'bg-amber-50': 'bg-amber-950/40', 'bg-amber-100': 'bg-amber-900/40',
    'text-amber-600': 'text-amber-400', 'text-amber-700': 'text-amber-300', 'text-amber-800': 'text-amber-200',
    'border-amber-100': 'border-amber-900', 'border-amber-200': 'border-amber-800',
    'bg-indigo-50': 'bg-indigo-950/40', 'bg-indigo-100': 'bg-indigo-900/40',
    'text-indigo-600': 'text-indigo-400', 'text-indigo-700': 'text-indigo-300',
    'border-indigo-100': 'border-indigo-900', 'border-indigo-200': 'border-indigo-800',
    'bg-blue-50': 'bg-blue-950/40', 'bg-blue-100': 'bg-blue-900/40',
    'text-blue-600': 'text-blue-400', 'text-blue-700': 'text-blue-300',
    'border-blue-100': 'border-blue-900', 'border-blue-200': 'border-blue-800',
    'bg-sky-50': 'bg-sky-950/40', 'bg-sky-100': 'bg-sky-900/40',
    'text-sky-600': 'text-sky-400', 'text-sky-700': 'text-sky-300',
    'border-sky-200': 'border-sky-800',
    'bg-cyan-50': 'bg-cyan-950/40', 'text-cyan-600': 'text-cyan-400', 'border-cyan-200': 'border-cyan-800',
    'bg-green-50': 'bg-green-950/40', 'text-green-600': 'text-green-400', 'border-green-200': 'border-green-800',
    'bg-red-50': 'bg-red-950/40', 'text-red-600': 'text-red-400', 'border-red-200': 'border-red-800',
    'bg-yellow-50': 'bg-yellow-950/40', 'text-yellow-600': 'text-yellow-400', 'border-yellow-200': 'border-yellow-800',
    'bg-orange-50': 'bg-orange-950/40', 'text-orange-600': 'text-orange-400',
    'bg-violet-50': 'bg-violet-950/40', 'text-violet-600': 'text-violet-400',
    'bg-purple-50': 'bg-purple-950/40', 'text-purple-600': 'text-purple-400', 'border-purple-200': 'border-purple-800',
    'bg-fuchsia-50': 'bg-fuchsia-950/40', 'text-fuchsia-600': 'text-fuchsia-400',
    'bg-pink-50': 'bg-pink-950/40', 'text-pink-600': 'text-pink-400',
    'bg-lime-50': 'bg-lime-950/40', 'text-lime-600': 'text-lime-400',
    'bg-neutral-50': 'bg-neutral-800/60', 'bg-neutral-100': 'bg-neutral-800',
    'text-neutral-600': 'text-neutral-300', 'text-neutral-700': 'text-neutral-200',
    'border-neutral-200': 'border-neutral-700',
}
VARIANT_PREFIX = re.compile(r'^(?:[a-z-]+:)+')
TOKEN_OK = re.compile(r'^[a-zA-Z0-9:./\-\[\]%_]+$')
UTIL_RE = re.compile(
    r'^(?P<prop>bg|text|border|divide|ring)-'
    r'(?P<color>[a-z]+)'
    r'(?:-(?P<shade>\d{2,3}))?'
    r'(?:/(?P<alpha>\d{1,3}))?$'
)
CLASSNAME_RE = re.compile(
    r'(className\s*=\s*)(?:"([^"]*)"|\'([^\']*)\'|\{(`[^`]*`)\})',
    re.S,
)



def split_template(raw):
    """يقسّم قالب نصي إلى [(هل_تعبير, نص)] مع موازنة أقواس ${...} المتشعّبة.

    يعيد المقاطع كما هي (بلا تعديل) حتى لا يُمَسّ أي كود داخل ${...}.
    """
    segments = []
    buf = []
    i = 0
    n = len(raw)
    while i < n:
        if raw[i] == '$' and i + 1 < n and raw[i + 1] == '{':
            if buf:
                segments.append((False, ''.join(buf)))
                buf = []
            depth = 0
            start = i
            while i < n:
                c = raw[i]
                if c == '{':
                    depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
                elif c in '\'"`':            # تخطّي نص داخل التعبير
                    quote = c
                    i += 1
                    while i < n and raw[i] != quote:
                        if raw[i] == '\\':
                            i += 1
                        i += 1
                i += 1
            segments.append((True, raw[start:i]))
        else:
            buf.append(raw[i])
            i += 1
    if buf:
        segments.append((False, ''.join(buf)))
    return segments


def protected_and_dead():
    protected, dead = set(), set()
    p = os.path.join(AUDIT, 'protectedContracts.json')
    if os.path.exists(p):
        with open(p, encoding='utf-8') as fh:
            for r in json.load(fh):
                protected.add(os.path.normpath(os.path.join(ROOT, r['file'])))
    p = os.path.join(AUDIT, 'inventory.json')
    if os.path.exists(p):
        with open(p, encoding='utf-8') as fh:
            for r in json.load(fh)['inventory']:
                if not r['reachableFromEntry']:
                    dead.add(os.path.normpath(os.path.join(ROOT, r['file'])))
    return protected, dead


def dark_for(token):
    """يعيد الصنف الليلي المقابل للصنف المطلوب، أو None."""
    if token.startswith('dark:') or not TOKEN_OK.match(token):
        return None
    prefix = ''
    m = VARIANT_PREFIX.match(token)
    if m:
        prefix = m.group(0)
    base = token[len(prefix):]
    u = UTIL_RE.match(base)
    if not u:
        return None
    key = f"{u.group('prop')}-{u.group('color')}" + (f"-{u.group('shade')}" if u.group('shade') else '')
    dark = MAP.get(key)
    if not dark:
        return None
    if u.group('alpha') and '/' not in dark:
        dark = f"{dark}/{u.group('alpha')}"
    return f"dark:{prefix}{dark}"


PROP_OF = re.compile(r'^(?P<prefix>(?:[a-z-]+:)*)(?P<prop>bg|text|border|divide|ring)-')


def process_class_string(body):
    """يعيد (جسم جديد، عدد الإضافات). يحافظ على المسافات الطرفية كما هي
    حتى لا يُدمج صنف ثابت مع تعبير ${...} مجاور."""
    lead = body[:len(body) - len(body.lstrip())]
    trail = body[len(body.rstrip()):]
    result, added = _process_tokens(body.split())
    if added == 0:
        return body, 0
    return lead + result + trail, added


def _process_tokens(tokens):
    """يعيد (نص الأصناف، عدد الإضافات، عدد المحذوفات=0 دائماً)."""
    existing_dark_props = set()
    for t in tokens:
        if t.startswith('dark:'):
            m = PROP_OF.match(t[5:])
            if m:
                existing_dark_props.add(m.group('prop'))
    out = []
    added = 0
    for t in tokens:
        out.append(t)
        d = dark_for(t)
        if not d:
            continue
        m = PROP_OF.match(t)
        prop = m.group('prop') if m else None
        if prop and prop in existing_dark_props:
            continue  # للعنصر مقابل ليلي لنفس الخاصية بالفعل — نحترم الاختيار القائم
        # لا نكرّر نفس المقابل إن وُجد حرفياً
        if d in tokens or d in out:
            continue
        out.append(d)
        added += 1
    return ' '.join(out), added


def main():
    protected, dead = protected_and_dead()
    changed_files = []
    total_added = 0
    skipped = {'protected': 0, 'dead': 0}

    for dp, dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if not f.endswith(('.tsx', '.ts')):
                continue
            path = os.path.join(dp, f)
            npath = os.path.normpath(path)
            if npath in protected and not INCLUDE_PROTECTED:
                skipped['protected'] += 1
                continue
            if npath in dead and not INCLUDE_DEAD:
                skipped['dead'] += 1
                continue
            with open(path, encoding='utf-8', errors='ignore') as fh:
                text = fh.read()
            before_tokens = re.findall(r'[^\s"\'`{}]+', text)

            added_in_file = 0
            def repl(m):
                nonlocal added_in_file
                head, dq, sq, tpl = m.group(1), m.group(2), m.group(3), m.group(4)
                if tpl:  # template literal: نعالج المقاطع النصية فقط ونُبقي ${...} حرفياً
                    raw = tpl[1:-1]
                    segments = split_template(raw)
                    new_parts, n = [], 0
                    for is_expr, part in segments:
                        if is_expr:
                            new_parts.append(part)          # يُعاد كما هو تماماً
                        else:
                            s2, k = process_class_string(part)
                            n += k
                            new_parts.append(s2)
                    if n == 0:
                        return m.group(0)
                    added_in_file += n
                    return f"{head}{{{'`'}{''.join(new_parts)}{'`'}}}"
                body = dq if dq is not None else sq
                quote = '"' if dq is not None else "'"
                new_body, n = process_class_string(body)
                if n == 0:
                    return m.group(0)
                added_in_file += n
                return f"{head}{quote}{new_body}{quote}"

            new_text = CLASSNAME_RE.sub(repl, text)
            if added_in_file == 0:
                continue

            after_tokens = re.findall(r'[^\s"\'`{}]+', new_text)
            # ضمان: كل صنف قائم يجب أن يبقى موجوداً (إضافات فقط)
            from collections import Counter
            cb, ca = Counter(before_tokens), Counter(after_tokens)
            removed = [t for t in cb if ca[t] < cb[t] and not t.startswith('dark:')]
            if removed:
                print(f"  ⚠ تجاوز محتمل في {os.path.relpath(path, ROOT)}: {removed[:5]} — تم التخطي")
                continue

            total_added += added_in_file
            changed_files.append((os.path.relpath(path, ROOT).replace(os.sep, '/'), added_in_file))
            if not DRY:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_text)

    changed_files.sort(key=lambda x: -x[1])
    print(('(معاينة) ' if DRY else '') + f"ملفات متأثرة: {len(changed_files)} · إضافات dark: {total_added}")
    print(f"مستثنى: {skipped['protected']} مكوّناً محمياً · {skipped['dead']} ملفاً ميتاً")
    print('-' * 60)
    for name, n in changed_files[:25]:
        print(f"{n:>5}  {name}")
    if len(changed_files) > 25:
        print(f"  ... و{len(changed_files) - 25} ملفاً آخر")
    out = os.path.join(AUDIT, 'darkmode-codemod-report.json')
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump({'dryRun': DRY, 'files': len(changed_files), 'added': total_added,
                   'skipped': skipped, 'details': changed_files}, fh, ensure_ascii=False, indent=1)
    print(f"\nالتقرير: {os.path.relpath(out, ROOT)}")


if __name__ == '__main__':
    main()
