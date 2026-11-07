#!/usr/bin/env python3
"""
كودمود استجابة الجداول — حصر أفقي + عرض أدنى يمنع سحق الأعمدة.

القاعدة (لا شيء غيرها):
  1. كل جدول داخل حاوية تمرير أفقية: `<div className="w-full overflow-x-auto print:overflow-visible">`
     (يُضاف فقط إن لم يكن للجدول سلف بحاوية تمرير).
  2. كل جدول يأخذ عرضاً أدنى بحسب عدد أعمدته (≈105px للعمود عند خط 12px):
       ≤4  ⟶ 440px   ·  5–6 ⟶ 600px   ·  7–9 ⟶ 820px   ·  ≥10 ⟶ 960px
  3. مع كل `min-w-[...]` يُضاف `print:min-w-0` حتى تبقى الطباعة كما هي
     (تنسيق الطباعة يفرض `table { width: 100% }`، وأي min-width أكبر من صفحة A4 يُقصّ الجدول على الورق).

لا يُمسّ أي حقل/نص/معالج/منطق — إضافة عنصر تغليف وأصناف تخطيط فقط.

الاستخدام:
  python3 tools/audit/tables_codemod.py --dry-run
  python3 tools/audit/tables_codemod.py
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
AUDIT = os.path.join(ROOT, 'docs', 'تدقيق')
DRY = '--dry-run' in sys.argv
WRAPPER = 'w-full overflow-x-auto print:overflow-visible'

DIV_OPEN = re.compile(r'<div\b([^>]*)>', re.S)
DIV_CLOSE = re.compile(r'</div>')
TABLE_TAG = re.compile(r'<table\b([^>]*)>', re.S)
SCROLL = re.compile(r'overflow-x-auto')
MINW = re.compile(r'\s*min-w-\[\d+px\]\s*print:min-w-0')
CLASS_ATTR = re.compile(r'className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\})', re.S)


def min_width_for(cols):
    if cols <= 4:
        return 440
    if cols <= 6:
        return 600
    if cols <= 9:
        return 820
    return 960


def dead_files():
    dead = set()
    p = os.path.join(AUDIT, 'inventory.json')
    if os.path.exists(p):
        with open(p, encoding='utf-8') as fh:
            for r in json.load(fh)['inventory']:
                if not r['reachableFromEntry']:
                    dead.add(os.path.normpath(os.path.join(ROOT, r['file'])))
    return dead


def scroll_ancestors(text):
    """يعيد مصفوفة: لكل موضع هل يوجد سلف بحاوية تمرير (حسب مكدّس div)."""
    events = []
    for m in DIV_OPEN.finditer(text):
        attrs = CLASS_ATTR.search(m.group(1))
        cls = (attrs.group(1) or attrs.group(2) or '') if attrs else ''
        events.append((m.start(), True, bool(SCROLL.search(cls))))
    for m in DIV_CLOSE.finditer(text):
        events.append((m.start(), False, False))
    events.sort(key=lambda e: e[0])
    return events


def transform(text):
    """يعيد (نص جديد, عدد الجداول, عدد الأغلفة المضافة, تفاصيل)."""
    events = scroll_ancestors(text)
    tables = list(TABLE_TAG.finditer(text))
    details = []
    wrappers = 0
    # نعمل من آخر جدول إلى الأول حتى لا تتأثر المواضع
    for m in reversed(tables):
        stack = [False]
        for pos, is_open, is_scroll in events:
            if pos >= m.start():
                break
            if is_open:
                stack.append(is_scroll or stack[-1])
            elif len(stack) > 1:
                stack.pop()
        has_scroll = stack[-1]

        tag = m.group(0)
        head_end = text.find('</thead>', m.end())
        head = text[m.end():head_end] if 0 < head_end < m.end() + 20000 else text[m.end():m.end() + 4000]
        cols = len(re.findall(r'<th\b', head))

        ca = CLASS_ATTR.search(tag)
        if ca is not None:
            body = ca.group(1) if ca.group(1) is not None else ca.group(2)
            body = MINW.sub('', body).rstrip()
            newcls = f'{body} min-w-[{min_width_for(cols)}px] print:min-w-0'
            if ca.group(1) is not None:
                newtag = tag[:ca.start()] + f'className="{newcls}"' + tag[ca.end():]
            else:
                newtag = tag[:ca.start()] + f'className={{`{newcls}`}}' + tag[ca.end():]
            text = text[:m.start()] + newtag + text[m.end():]
            details.append({'line': text[:m.start()].count('\n') + 1, 'columns': cols, 'minWidth': min_width_for(cols)})
        else:
            newtag = tag[:-1] + f' className="min-w-[{min_width_for(cols)}px] print:min-w-0">'
            text = text[:m.start()] + newtag + text[m.end():]
            details.append({'line': text[:m.start()].count('\n') + 1, 'columns': cols, 'minWidth': min_width_for(cols)})

        if not has_scroll:
            line_start = text.rfind('\n', 0, m.start()) + 1
            prefix = text[line_start:m.start()]
            open_tag = f'<div className="{WRAPPER}">'
            if prefix.strip() == '':           # الجدول وحده في بداية السطر
                indent = prefix
                text = text[:line_start] + indent + open_tag + '\n' + text[line_start:]
            else:                              # الجدول داخل سطر (تعبير شرطي مثلاً)
                indent = ' ' * len(prefix)
                text = text[:m.start()] + open_tag + '\n' + indent + text[m.start():]
            close_pos = text.find('</table>', m.start()) + len('</table>')
            text = text[:close_pos] + f'\n{indent}</div>' + text[close_pos:]
            wrappers += 1
    return text, len(tables), wrappers, details


def main():
    dead = dead_files()
    changed, details, total_wrappers, total_tables = [], [], 0, 0
    for dp, _dn, fn in os.walk(SRC):
        for f in sorted(fn):
            if not f.endswith('.tsx'):
                continue
            path = os.path.join(dp, f)
            if os.path.normpath(path) in dead:
                continue
            text = open(path, encoding='utf-8', errors='ignore').read()
            if '<table' not in text:
                continue
            new, ntab, nwrap, det = transform(text)
            if new == text:
                continue
            changed.append({'file': os.path.relpath(path, ROOT), 'tables': ntab, 'wrappers': nwrap})
            details.extend(det)
            total_wrappers += nwrap
            total_tables += ntab
            if not DRY:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)

    prefix = '(معاينة) ' if DRY else ''
    print(f"{prefix}ملفات: {len(changed)} · جداول معدّلة: {total_tables} · أغلفة تمرير مضافة: {total_wrappers}")
    for c in sorted(changed, key=lambda x: -x['tables']):
        print(f"   {c['tables']} جدولاً · {c['wrappers']} غلاف  {c['file']}")
    if '--json' in sys.argv:
        with open(os.path.join(AUDIT, 'tables-codemod-report.json'), 'w', encoding='utf-8') as fh:
            json.dump({'dryRun': DRY, 'status': 'معاينة' if DRY else 'منفَّذ',
                       'files': changed, 'tables': total_tables, 'wrappers': total_wrappers,
                       'details': details}, fh, ensure_ascii=False, indent=1)
        print('تقرير: docs/تدقيق/tables-codemod-report.json')
    return 0


if __name__ == '__main__':
    sys.exit(main())
